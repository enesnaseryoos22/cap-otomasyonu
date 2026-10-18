import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { islemKaydet } from '../lib/islemKaydi.js';
import { ayarlar } from '../ayarlar.js';

// Kullanıcı bulunamasa da şifre kontrolü yapılır; böylece yanıt süresinden
// e-postanın sistemde olup olmadığı anlaşılamaz.
const sahteHash = await argon2.hash('kullanilmayan-sahte-sifre');

export class GirisHatasi extends Error {}

export async function girisYap(eposta, sifre, ipAdresi) {
  const kullanici = await prisma.kullanici.findUnique({ where: { eposta } });
  const simdi = new Date();

  if (kullanici?.kilitliBitis && kullanici.kilitliBitis > simdi) {
    await islemKaydet({ kullaniciId: kullanici.id, eylem: 'GIRIS_KILITLI_HESAP', varlik: 'Kullanici', varlikId: kullanici.id, ipAdresi });
    throw new GirisHatasi('Çok fazla hatalı deneme. Hesap geçici olarak kilitlendi, daha sonra tekrar deneyin.');
  }

  const sifreDogru = await argon2.verify(kullanici?.sifreHash || sahteHash, sifre);

  if (!kullanici || !kullanici.sifreHash || !kullanici.aktif || !sifreDogru) {
    if (kullanici) await hataliGirisIsle(kullanici, ipAdresi);
    else await islemKaydet({ eylem: 'GIRIS_BASARISIZ', yeniDeger: { eposta }, ipAdresi });
    throw new GirisHatasi('E-posta veya şifre hatalı.');
  }

  await prisma.kullanici.update({
    where: { id: kullanici.id },
    data: { hataliGirisSayisi: 0, kilitliBitis: null, sonGiris: simdi },
  });
  await islemKaydet({ kullaniciId: kullanici.id, eylem: 'GIRIS_BASARILI', varlik: 'Kullanici', varlikId: kullanici.id, ipAdresi });

  const token = jwt.sign({ sub: kullanici.id, rol: kullanici.rol }, ayarlar.jwtSecret, {
    expiresIn: `${ayarlar.oturumSuresiSaat}h`,
  });
  return { token, kullanici: await kullaniciBilgisi(kullanici.id) };
}

async function hataliGirisIsle(kullanici, ipAdresi) {
  const sayi = kullanici.hataliGirisSayisi + 1;
  const kilitlenecek = sayi >= ayarlar.maksHataliGiris;
  await prisma.kullanici.update({
    where: { id: kullanici.id },
    data: kilitlenecek
      ? { hataliGirisSayisi: 0, kilitliBitis: new Date(Date.now() + ayarlar.kilitSuresiDakika * 60_000) }
      : { hataliGirisSayisi: sayi },
  });
  await islemKaydet({
    kullaniciId: kullanici.id,
    eylem: kilitlenecek ? 'HESAP_KILITLENDI' : 'GIRIS_BASARISIZ',
    varlik: 'Kullanici',
    varlikId: kullanici.id,
    ipAdresi,
  });
}

// Arayüze gönderilen kullanıcı bilgisi (şifre özeti gibi alanlar gönderilmez)
export function kullaniciBilgisi(id) {
  return prisma.kullanici.findUnique({
    where: { id },
    select: {
      id: true,
      eposta: true,
      rol: true,
      ogrenci: { select: { id: true, ogrenciNo: true, adSoyad: true, programTuru: true } },
    },
  });
}

export function tokenCoz(token) {
  return jwt.verify(token, ayarlar.jwtSecret);
}
