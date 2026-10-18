import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { girisGerekli, rolGerekli } from '../middleware/kimlik.js';

const router = Router();
router.use(girisGerekli);

// Ana panel: her rol kendi özetini görür.
router.get('/panel', async (req, res) => {
  if (req.kullanici.rol === 'OGRENCI') return res.json(await ogrenciOzeti(req.kullanici.id));

  const [toplam, cap, ydp, onayBekleyen] = await Promise.all([
    prisma.ogrenci.count(),
    prisma.ogrenci.count({ where: { programTuru: 'CAP' } }),
    prisma.ogrenci.count({ where: { programTuru: 'YDP' } }),
    prisma.planDersi.count({ where: { onayDurumu: 'ONAY_BEKLIYOR' } }),
  ]);
  res.json({ ogrenciSayisi: { toplam, cap, ydp }, onayBekleyen });
});

// Öğrenci yalnız kendi kaydını görür: kimlik oturumdan alınır, adresten değil.
async function ogrenciOzeti(kullaniciId) {
  const ogrenci = await prisma.ogrenci.findUnique({
    where: { kullaniciId },
    select: {
      ogrenciNo: true, adSoyad: true, programTuru: true, durum: true,
      anadalBolum: { select: { ad: true } },
      kabulDonemi: { select: { akademikYil: true, tur: true } },
      planDersleri: {
        where: { onayDurumu: { in: ['ONAYLANDI', 'ONAY_BEKLIYOR'] } },
        select: { durum: true, onayDurumu: true, ders: { select: { akts: true } } },
      },
    },
  });
  const onayli = ogrenci.planDersleri.filter((p) => p.onayDurumu === 'ONAYLANDI');
  const toplamAkts = (liste) => liste.reduce((t, p) => t + p.ders.akts, 0);
  const { planDersleri, ...kimlik } = ogrenci;
  return {
    ogrenci: kimlik,
    akts: {
      tamamlanan: toplamAkts(onayli.filter((p) => ['GECTI', 'MUAF'].includes(p.durum))),
      planlanan: toplamAkts(onayli),
    },
    onayBekleyen: planDersleri.length - onayli.length,
  };
}

// Öğrenci listesi: koordinatör ve bölüm başkanı (salt okunur)
router.get('/ogrenciler', rolGerekli('KOORDINATOR', 'BOLUM_BASKANI'), async (req, res) => {
  const ogrenciler = await prisma.ogrenci.findMany({
    orderBy: { ogrenciNo: 'asc' },
    select: {
      id: true, ogrenciNo: true, adSoyad: true, eposta: true, programTuru: true, durum: true,
      kullaniciId: true,
      anadalBolum: { select: { kod: true } },
      kabulDonemi: { select: { akademikYil: true, tur: true } },
    },
  });
  res.json({ ogrenciler });
});

// İşlem kaydı: koordinatör ve bölüm başkanı
router.get('/islem-kaydi', rolGerekli('KOORDINATOR', 'BOLUM_BASKANI'), async (req, res) => {
  const kayitlar = await prisma.islemKaydi.findMany({
    orderBy: { zaman: 'desc' },
    take: 50,
    include: { kullanici: { select: { eposta: true, rol: true } } },
  });
  res.json({ kayitlar });
});

export default router;
