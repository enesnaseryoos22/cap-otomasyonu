import { prisma } from './prisma.js';

// İşlem kaydına yeni satır ekler. Bu tabloda güncelleme ve silme yoktur
// (veritabanındaki tetikleyici de engeller).
// db: transaction içinde çağrılırsa tx verilir, böylece kayıt ve işlem birlikte yazılır.
export function islemKaydet({ kullaniciId, eylem, varlik, varlikId, eskiDeger, yeniDeger, ipAdresi }, db = prisma) {
  return db.islemKaydi.create({
    data: { kullaniciId, eylem, varlik, varlikId, eskiDeger, yeniDeger, ipAdresi },
  });
}
