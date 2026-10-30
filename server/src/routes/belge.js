import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { islemKaydet } from '../lib/islemKaydi.js';
import { girisGerekli, rolGerekli } from '../middleware/kimlik.js';
import { dosyaKontrolEt, DosyaHatasi, MAKS_BOYUT } from '../lib/dosyaKontrolu.js';

const router = Router();
router.use(girisGerekli);

// Dosya belleğe alınır (diske yazılmaz), kontrol edilir, sonra veritabanına yazılır.
const yukleyici = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAKS_BOYUT, files: 1, fields: 5 },
  defParamCharset: 'utf8', // Türkçe dosya adları
});

// Öğrencinin yükleyebileceği belge türleri (transkript, not girişiyle birlikte sonraki aşamada)
const OGRENCI_BELGE_TURLERI = ['KABUL_VE_DERS_PROTOKOLU', 'DERS_KAYIT_FORMU', 'MUAFIYET_FORMU', 'EK_BELGE'];

function tekDosya(req, res, next) {
  yukleyici.single('dosya')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ hata: 'Dosya en çok 5 MB olabilir.' });
    if (err) return res.status(400).json({ hata: 'Dosya okunamadı.' });
    next();
  });
}

// Öğrenci belge yükler; belge koordinatör onaylayana kadar "onay bekliyor" kalır.
// Aynı türde yeni yükleme yeni sürümdür; eski sürüm silinmez.
router.post('/belgeler', rolGerekli('OGRENCI'), tekDosya, async (req, res, next) => {
  const tur = z.enum(OGRENCI_BELGE_TURLERI).safeParse(req.body?.tur);
  if (!tur.success) return res.status(400).json({ hata: 'Belge türü seçin.' });

  let kontrol;
  try {
    kontrol = dosyaKontrolEt(req.file);
  } catch (e) {
    if (e instanceof DosyaHatasi) {
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: 'BELGE_REDDEDILDI_GUVENLIK', varlik: 'Belge',
        yeniDeger: { dosya: req.file?.originalname, neden: e.message }, ipAdresi: req.ip,
      });
      return res.status(400).json({ hata: e.message });
    }
    return next(e);
  }

  try {
    const ogrenci = await prisma.ogrenci.findUnique({ where: { kullaniciId: req.kullanici.id } });
    const sonuc = await prisma.$transaction(async (tx) => {
      const onceki = await tx.belge.findFirst({
        where: { ogrenciId: ogrenci.id, tur: tur.data },
        orderBy: { surumNo: 'desc' },
      });
      if (onceki?.onayDurumu === 'ONAY_BEKLIYOR') return { hata: 'Bu türde onay bekleyen bir belgeniz var.' };

      const belge = await tx.belge.create({
        data: {
          ogrenciId: ogrenci.id, tur: tur.data, orijinalAd: kontrol.guvenliAd,
          depoAdi: crypto.randomUUID(), mimeTuru: kontrol.mime, boyut: req.file.size,
          sha256: crypto.createHash('sha256').update(req.file.buffer).digest('hex'),
          surumNo: onceki ? onceki.surumNo + 1 : 1, oncekiSurumId: onceki?.id ?? null,
          kaynak: 'OGRENCI', yukleyenId: req.kullanici.id,
          icerik: { create: { icerik: req.file.buffer } },
        },
        select: { id: true, tur: true, orijinalAd: true, surumNo: true, onayDurumu: true, sha256: true },
      });
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: 'BELGE_YUKLENDI', varlik: 'Belge', varlikId: belge.id,
        yeniDeger: { tur: belge.tur, dosya: belge.orijinalAd, surum: belge.surumNo, sha256: belge.sha256 },
        ipAdresi: req.ip,
      }, tx);
      return { belge };
    });
    if (sonuc.hata) return res.status(409).json({ hata: sonuc.hata });
    res.status(201).json({ belge: sonuc.belge });
  } catch (e) {
    next(e);
  }
});

// Dosyayı indirme: öğrenci yalnız kendi belgesini, koordinatör ve bölüm başkanı tüm belgeleri.
// Dosya her zaman indirme olarak gönderilir (tarayıcıda sayfa olarak çalıştırılmaz).
router.get('/belgeler/:id/dosya', async (req, res) => {
  const belge = await prisma.belge.findUnique({
    where: { id: req.params.id },
    include: { ogrenci: { select: { kullaniciId: true } }, icerik: true },
  });
  if (!belge?.icerik) return res.status(404).json({ hata: 'Belge bulunamadı.' });
  if (req.kullanici.rol === 'OGRENCI' && belge.ogrenci.kullaniciId !== req.kullanici.id) {
    return res.status(403).json({ hata: 'Bu işlem için yetkiniz yok.' });
  }
  res.set('Content-Type', belge.mimeTuru);
  res.set('Content-Security-Policy', "default-src 'none'; sandbox");
  res.attachment(belge.orijinalAd);
  res.send(Buffer.from(belge.icerik.icerik));
});

// Koordinatörün onay kuyruğundaki belgeler (bölüm başkanı da görür)
router.get('/onay-bekleyen-belgeler', rolGerekli('KOORDINATOR', 'BOLUM_BASKANI'), async (req, res) => {
  const belgeler = await prisma.belge.findMany({
    where: { onayDurumu: 'ONAY_BEKLIYOR' },
    orderBy: { olusturma: 'asc' },
    select: {
      id: true, tur: true, orijinalAd: true, boyut: true, surumNo: true, olusturma: true,
      ogrenci: { select: { id: true, ogrenciNo: true, adSoyad: true } },
    },
  });
  res.json({ belgeler });
});

const kararSemasi = z.discriminatedUnion('karar', [
  z.object({ karar: z.literal('ONAYLA') }),
  z.object({ karar: z.literal('REDDET'), gerekce: z.string().trim().min(3, 'Ret gerekçesi yazın.').max(500) }),
]);

// Koordinatör belgeyi onaylar veya gerekçeyle reddeder. Reddedilen belgenin yerine öğrenci yeni sürüm yükler.
router.post('/belgeler/:id/karar', rolGerekli('KOORDINATOR'), async (req, res, next) => {
  const sonuc = kararSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.issues[0].message });
  const onay = sonuc.data.karar === 'ONAYLA';

  try {
    const s = await prisma.$transaction(async (tx) => {
      const eski = await tx.belge.findUnique({ where: { id: req.params.id } });
      if (!eski) return { durum: 404, hata: 'Belge bulunamadı.' };
      if (eski.onayDurumu !== 'ONAY_BEKLIYOR') return { durum: 409, hata: 'Bu belge zaten sonuçlandırılmış.' };
      const yeni = await tx.belge.update({
        where: { id: eski.id },
        data: onay
          ? { onayDurumu: 'ONAYLANDI', onaylayanId: req.kullanici.id, onayTarihi: new Date() }
          : { onayDurumu: 'REDDEDILDI', onaylayanId: req.kullanici.id, redGerekcesi: sonuc.data.gerekce },
        select: { id: true, onayDurumu: true, redGerekcesi: true },
      });
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: onay ? 'BELGE_ONAYLANDI' : 'BELGE_REDDEDILDI',
        varlik: 'Belge', varlikId: eski.id,
        eskiDeger: { dosya: eski.orijinalAd, onayDurumu: eski.onayDurumu },
        yeniDeger: { dosya: eski.orijinalAd, onayDurumu: yeni.onayDurumu, redGerekcesi: yeni.redGerekcesi },
        ipAdresi: req.ip,
      }, tx);
      return { durum: 200, belge: yeni };
    });
    if (s.hata) return res.status(s.durum).json({ hata: s.hata });
    res.json({ belge: s.belge });
  } catch (e) {
    next(e);
  }
});

export default router;
