import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { islemKaydet } from '../lib/islemKaydi.js';
import { girisGerekli, rolGerekli } from '../middleware/kimlik.js';

const router = Router();
router.use(girisGerekli);

// Öğrencinin programına ait protokol: ÇAP'ta anadal bölümüne göre, YDP'de bölümden bağımsız.
function protokolBul(ogrenci) {
  return prisma.protokol.findFirst({
    where: {
      aktif: true,
      programTuru: ogrenci.programTuru,
      bolumId: ogrenci.programTuru === 'CAP' ? ogrenci.anadalBolumId : null,
    },
    include: { satirlar: { select: { id: true, dersId: true, akts: true } } },
  });
}

// Öğrenci kartı: kimlik bilgileri, ders planı (arşiv dahil) ve AKTS özeti
async function kartGetir(ogrenciId) {
  const ogrenci = await prisma.ogrenci.findUnique({
    where: { id: ogrenciId },
    select: {
      id: true, ogrenciNo: true, adSoyad: true, eposta: true, programTuru: true, durum: true,
      anadalBolumId: true,
      anadalBolum: { select: { ad: true } },
      kabulDonemi: { select: { akademikYil: true, tur: true } },
      planDersleri: {
        orderBy: [{ ders: { yariyil: 'asc' } }, { ders: { kod: 'asc' } }],
        select: {
          id: true, durum: true, onayDurumu: true, kaynak: true, redGerekcesi: true, onayTarihi: true, olusturma: true,
          ders: { select: { kod: true, ad: true, akts: true, yariyil: true, tur: true } },
        },
      },
      // Belge arşivi: tüm sürümler (eski sürümler silinmez)
      belgeler: {
        orderBy: [{ tur: 'asc' }, { surumNo: 'desc' }],
        select: {
          id: true, tur: true, orijinalAd: true, boyut: true, surumNo: true,
          onayDurumu: true, redGerekcesi: true, olusturma: true,
        },
      },
    },
  });
  if (!ogrenci) return null;

  const protokol = await protokolBul(ogrenci);
  const onayli = ogrenci.planDersleri.filter((p) => p.onayDurumu === 'ONAYLANDI');
  const toplam = (liste) => liste.reduce((t, p) => t + p.ders.akts, 0);
  const tamamlanan = toplam(onayli.filter((p) => ['GECTI', 'MUAF'].includes(p.durum)));
  const gerekli = protokol ? protokol.satirlar.reduce((t, s) => t + s.akts, 0) : null;

  const { anadalBolumId, ...kimlik } = ogrenci;
  return {
    ...kimlik,
    protokolAdi: protokol?.ad ?? null,
    akts: {
      gerekli, // protokoldeki toplam AKTS
      tamamlanan, // geçilen ve muaf dersler
      devamEden: toplam(onayli.filter((p) => p.durum === 'ALINDI')),
      planlanan: toplam(onayli.filter((p) => p.durum === 'PLANLANDI')),
      onayBekleyen: toplam(ogrenci.planDersleri.filter((p) => p.onayDurumu === 'ONAY_BEKLIYOR')),
      kalan: gerekli === null ? null : Math.max(gerekli - tamamlanan, 0),
    },
  };
}

// Öğrenci yalnız kendi kartını görür: kimlik oturumdan alınır.
router.get('/kartim', rolGerekli('OGRENCI'), async (req, res) => {
  const ogrenci = await prisma.ogrenci.findUnique({ where: { kullaniciId: req.kullanici.id }, select: { id: true } });
  res.json({ kart: await kartGetir(ogrenci.id) });
});

router.get('/ogrenciler/:id/kart', rolGerekli('KOORDINATOR', 'BOLUM_BASKANI'), async (req, res) => {
  const kart = await kartGetir(req.params.id);
  if (!kart) return res.status(404).json({ hata: 'Öğrenci bulunamadı.' });
  res.json({ kart });
});

// Ders kataloğu (yalnız aktif dersler). Öğrenciye kendi protokolündeki dersler işaretlenir.
router.get('/katalog', async (req, res) => {
  const dersler = await prisma.ders.findMany({
    where: { aktif: true },
    orderBy: [{ yariyil: 'asc' }, { kod: 'asc' }],
    select: { id: true, kod: true, ad: true, akts: true, yariyil: true, tur: true },
  });
  let protokolDersleri = new Set();
  if (req.kullanici.rol === 'OGRENCI') {
    const ogrenci = await prisma.ogrenci.findUnique({ where: { kullaniciId: req.kullanici.id } });
    const protokol = await protokolBul(ogrenci);
    protokolDersleri = new Set(protokol?.satirlar.map((s) => s.dersId).filter(Boolean));
  }
  res.json({ dersler: dersler.map((d) => ({ ...d, protokolde: protokolDersleri.has(d.id) })) });
});

// Öğrenci katalogdan ders seçer; kayıt koordinatör onayına kadar "onay bekliyor" kalır.
// Katalog dışı ders girilemez (dersId katalogda olmalı).
router.post('/plan', rolGerekli('OGRENCI'), async (req, res, next) => {
  const sonuc = z.object({ dersId: z.string().uuid('Ders seçin.') }).safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.issues[0].message });

  const ogrenci = await prisma.ogrenci.findUnique({ where: { kullaniciId: req.kullanici.id } });
  const ders = await prisma.ders.findFirst({ where: { id: sonuc.data.dersId, aktif: true } });
  if (!ders) return res.status(400).json({ hata: 'Ders katalogda bulunamadı.' });

  // Ders protokolde belirli bir satırsa o satıra bağlanır (seçmeli yuvası koordinatörce eşlenir).
  const protokol = await protokolBul(ogrenci);
  const satir = protokol?.satirlar.find((s) => s.dersId === ders.id);

  try {
    const plan = await prisma.$transaction(async (tx) => {
      const yeni = await tx.planDersi.create({
        data: {
          ogrenciId: ogrenci.id, dersId: ders.id, protokolSatiriId: satir?.id ?? null,
          kaynak: 'OGRENCI', olusturanId: req.kullanici.id,
        },
      });
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: 'PLAN_DERS_ISTENDI', varlik: 'PlanDersi', varlikId: yeni.id,
        yeniDeger: { ders: ders.kod, onayDurumu: 'ONAY_BEKLIYOR' }, ipAdresi: req.ip,
      }, tx);
      return yeni;
    });
    res.status(201).json({ plan });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ hata: 'Bu ders planınızda zaten var.' });
    next(e);
  }
});

// Koordinatörün onay kuyruğu (bölüm başkanı da görür)
router.get('/onay-bekleyenler', rolGerekli('KOORDINATOR', 'BOLUM_BASKANI'), async (req, res) => {
  const bekleyenler = await prisma.planDersi.findMany({
    where: { onayDurumu: 'ONAY_BEKLIYOR' },
    orderBy: { olusturma: 'asc' },
    select: {
      id: true, olusturma: true,
      ogrenci: { select: { id: true, ogrenciNo: true, adSoyad: true } },
      ders: { select: { kod: true, ad: true, akts: true } },
    },
  });
  res.json({ bekleyenler });
});

const kararSemasi = z.discriminatedUnion('karar', [
  z.object({ karar: z.literal('ONAYLA') }),
  z.object({ karar: z.literal('REDDET'), gerekce: z.string().trim().min(3, 'Ret gerekçesi yazın.').max(500) }),
]);

// Koordinatör onaylar veya gerekçeyle reddeder. Onaylanan ders kilitlenir (öğrenci değiştiremez).
router.post('/plan/:id/karar', rolGerekli('KOORDINATOR'), async (req, res, next) => {
  const sonuc = kararSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.issues[0].message });
  const onay = sonuc.data.karar === 'ONAYLA';

  try {
    const sonucKaydi = await prisma.$transaction(async (tx) => {
      const eski = await tx.planDersi.findUnique({ where: { id: req.params.id }, include: { ders: true } });
      if (!eski) return { durum: 404, hata: 'Kayıt bulunamadı.' };
      if (eski.onayDurumu !== 'ONAY_BEKLIYOR') return { durum: 409, hata: 'Bu kayıt zaten sonuçlandırılmış.' };
      const yeni = await tx.planDersi.update({
        where: { id: eski.id },
        data: onay
          ? { onayDurumu: 'ONAYLANDI', onaylayanId: req.kullanici.id, onayTarihi: new Date() }
          : { onayDurumu: 'REDDEDILDI', onaylayanId: req.kullanici.id, redGerekcesi: sonuc.data.gerekce },
      });
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: onay ? 'PLAN_ONAYLANDI' : 'PLAN_REDDEDILDI',
        varlik: 'PlanDersi', varlikId: eski.id,
        eskiDeger: { ders: eski.ders.kod, onayDurumu: eski.onayDurumu },
        yeniDeger: { ders: eski.ders.kod, onayDurumu: yeni.onayDurumu, redGerekcesi: yeni.redGerekcesi },
        ipAdresi: req.ip,
      }, tx);
      return { durum: 200, plan: yeni };
    });
    if (sonucKaydi.hata) return res.status(sonucKaydi.durum).json({ hata: sonucKaydi.hata });
    res.json({ plan: sonucKaydi.plan });
  } catch (e) {
    next(e);
  }
});

export default router;
