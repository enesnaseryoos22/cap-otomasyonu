import crypto from 'node:crypto';
import { Router } from 'express';
import argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';
import { islemKaydet } from '../lib/islemKaydi.js';
import { girisGerekli, rolGerekli } from '../middleware/kimlik.js';
import { ogrenciEklemeSemasi } from '../validation/ogrenci.js';

const router = Router();
router.use(girisGerekli);

// Formlardaki seçim listeleri (bölümler ve dönemler)
router.get('/secenekler', rolGerekli('KOORDINATOR', 'BOLUM_BASKANI'), async (req, res) => {
  const [bolumler, donemler] = await Promise.all([
    prisma.bolum.findMany({ where: { aktif: true }, orderBy: { ad: 'asc' }, select: { id: true, kod: true, ad: true } }),
    prisma.donem.findMany({ orderBy: [{ akademikYil: 'desc' }, { tur: 'asc' }], select: { id: true, akademikYil: true, tur: true } }),
  ]);
  res.json({ bolumler, donemler });
});

// Koordinatör kabul edilen öğrenciyi sisteme ekler (başvuru ve seçim dekanlıktadır).
router.post('/ogrenciler', rolGerekli('KOORDINATOR'), async (req, res, next) => {
  const sonuc = ogrenciEklemeSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.issues[0].message });

  try {
    const ogrenci = await prisma.$transaction(async (tx) => {
      const yeni = await tx.ogrenci.create({ data: { ...sonuc.data, kaynak: 'KOORDINATOR' } });
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: 'OGRENCI_EKLENDI', varlik: 'Ogrenci', varlikId: yeni.id,
        yeniDeger: sonuc.data, ipAdresi: req.ip,
      }, tx);
      return yeni;
    });
    res.status(201).json({ ogrenci });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ hata: 'Bu öğrenci numarası veya e-posta zaten kayıtlı.' });
    next(e);
  }
});

// Koordinatör öğrenciye hesap açar. Kendi kendine kayıt yoktur.
// E-posta gönderimi henüz kurulmadığı için geçici şifre bir kez koordinatöre gösterilir.
router.post('/ogrenciler/:id/hesap', rolGerekli('KOORDINATOR'), async (req, res, next) => {
  try {
    const ogrenci = await prisma.ogrenci.findUnique({ where: { id: req.params.id } });
    if (!ogrenci) return res.status(404).json({ hata: 'Öğrenci bulunamadı.' });
    if (ogrenci.kullaniciId) return res.status(409).json({ hata: 'Bu öğrencinin hesabı zaten açık.' });

    const geciciSifre = geciciSifreUret();
    const sifreHash = await argon2.hash(geciciSifre);
    await prisma.$transaction(async (tx) => {
      const kullanici = await tx.kullanici.create({ data: { eposta: ogrenci.eposta, rol: 'OGRENCI', sifreHash } });
      await tx.ogrenci.update({ where: { id: ogrenci.id }, data: { kullaniciId: kullanici.id } });
      await islemKaydet({
        kullaniciId: req.kullanici.id, eylem: 'HESAP_ACILDI', varlik: 'Ogrenci', varlikId: ogrenci.id,
        yeniDeger: { eposta: ogrenci.eposta }, ipAdresi: req.ip,
      }, tx);
    });
    res.status(201).json({ eposta: ogrenci.eposta, geciciSifre });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ hata: 'Bu e-posta ile açılmış bir hesap zaten var.' });
    next(e);
  }
});

// Karışan harfler (0/O, 1/l/I) olmadan 10 karakterlik geçici şifre
function geciciSifreUret() {
  const harfler = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(10), (b) => harfler[b % harfler.length]).join('');
}

export default router;
