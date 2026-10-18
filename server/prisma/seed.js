// Örnek (sentetik) veri. Gerçek öğrenci verisi kullanılmaz.
// Çalıştırma: npm run db:reset  (veritabanını sıfırlar ve bu dosyayı çalıştırır)
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function csvOku(dosya) {
  const metin = readFileSync(new URL(`./veri/${dosya}`, import.meta.url), 'utf8').replace(/^﻿/, '');
  const [baslik, ...satirlar] = metin.trim().split(/\r?\n/);
  const alanlar = baslik.split(';');
  return satirlar.map((s) => Object.fromEntries(s.split(';').map((d, i) => [alanlar[i], d.trim()])));
}

async function main() {
  if (await prisma.bolum.count()) {
    console.log('Örnek veri zaten yüklü, atlandı.');
    return;
  }

  // --- Bölümler ---
  const eem = await prisma.bolum.create({ data: { kod: 'EEM', ad: 'Elektrik-Elektronik Mühendisliği' } });
  const mak = await prisma.bolum.create({ data: { kod: 'MAK', ad: 'Makine Mühendisliği' } });

  // --- Dönemler ---
  const donem = {};
  for (const yil of ['2024-2025', '2025-2026', '2026-2027']) {
    for (const tur of ['GUZ', 'BAHAR']) {
      donem[`${yil} ${tur}`] = await prisma.donem.create({ data: { akademikYil: yil, tur } });
    }
  }

  // --- Ders kataloğu (Bologna sayfasından) ---
  const ders = {};
  for (const d of csvOku('dersler.csv')) {
    ders[d.kod] = await prisma.ders.create({
      data: { kod: d.kod, ad: d.ad, yariyil: Number(d.yariyil), tur: d.tur, akts: Number(d.akts) },
    });
  }
  console.log(`${Object.keys(ders).length} ders eklendi`);

  // --- EEM → BM ÇAP protokolü ---
  const protokol = await prisma.protokol.create({
    data: { bolumId: eem.id, programTuru: 'CAP', ad: 'Elektrik-Elektronik Müh. → Bilgisayar Müh. ÇAP Protokolü' },
  });
  const protokolSatiri = {};
  for (const s of csvOku('protokol-eem.csv')) {
    protokolSatiri[s.sira] = await prisma.protokolSatiri.create({
      data: {
        protokolId: protokol.id,
        sira: Number(s.sira),
        dersId: s.dersKodu ? ders[s.dersKodu].id : null,
        yuvaAdi: s.yuvaAdi || null,
        yariyil: Number(s.yariyil),
        akts: Number(s.akts),
        ozelSartNo: s.ozelSartNo ? Number(s.ozelSartNo) : null,
      },
    });
  }
  for (const o of csvOku('ozel-sartlar-eem.csv')) {
    await prisma.ozelSart.create({
      data: {
        protokolId: protokol.id,
        no: Number(o.no),
        anadalDersKodu: o.anadalDersKodu,
        anadalDersAdi: o.anadalDersAdi,
        bmDersId: ders[o.bmDersKodu].id,
      },
    });
  }

  // --- Kullanıcılar (3 rol) ---
  const sifreHash = await argon2.hash(process.env.DEMO_SIFRE || 'Demo.2026!');
  const kullanici = (eposta, rol) => prisma.kullanici.create({ data: { eposta, rol, sifreHash } });

  const koordinator = await kullanici('koordinator@ornek.edu.tr', 'KOORDINATOR');
  await kullanici('baskan@ornek.edu.tr', 'BOLUM_BASKANI');

  // --- Öğrenciler ---
  // 1) Yeni ÇAP öğrencisi: henüz ders seçmedi
  await prisma.ogrenci.create({
    data: {
      ogrenciNo: '224301001', adSoyad: 'Ayşe Yılmaz', eposta: 'ogrenci1@ornek.edu.tr',
      programTuru: 'CAP', anadalBolumId: eem.id, kabulDonemId: donem['2026-2027 GUZ'].id,
      kullaniciId: (await kullanici('ogrenci1@ornek.edu.tr', 'OGRENCI')).id,
    },
  });

  // 2) Mevcut ÇAP öğrencisi: geçmiş dönem verisi koordinatörce aktarıldı (doğrudan onaylı)
  const mehmet = await prisma.ogrenci.create({
    data: {
      ogrenciNo: '214301002', adSoyad: 'Mehmet Demir', eposta: 'ogrenci2@ornek.edu.tr',
      programTuru: 'CAP', anadalBolumId: eem.id, kabulDonemId: donem['2025-2026 GUZ'].id,
      capOgrenciNo: 'C25001',
      kullaniciId: (await kullanici('ogrenci2@ornek.edu.tr', 'OGRENCI')).id,
    },
  });
  // Protokoldeki belirli derslerin hepsi plana eklenir (seçmeli yuvaları henüz boş)
  const plan = {};
  for (const s of Object.values(protokolSatiri).filter((s) => s.dersId)) {
    plan[s.dersId] = await prisma.planDersi.create({
      data: {
        ogrenciId: mehmet.id, dersId: s.dersId, protokolSatiriId: s.id,
        onayDurumu: 'ONAYLANDI', kaynak: 'GECMIS_AKTARIM', onayTarihi: new Date(),
      },
    });
  }
  // Denemeler: [ders kodu, alınan dönem, harf notu, sonuç]
  const denemeler = [
    ['3301156', '2025-2026 GUZ', 'BA', 'GECTI'],
    ['3301351', '2025-2026 GUZ', 'BB', 'GECTI'],
    ['3301352', '2025-2026 GUZ', 'FF', 'KALDI'],
    ['3301452', '2025-2026 BAHAR', 'CB', 'GECTI'],
    ['3301454', '2025-2026 BAHAR', 'AA', 'GECTI'],
    ['3301352', '2026-2027 GUZ', null, 'ALINDI'], // kaldığı dersi tekrar alıyor
  ];
  for (const [kod, donemAdi, harfNotu, sonuc] of denemeler) {
    await prisma.dersDenemesi.create({
      data: {
        planDersiId: plan[ders[kod].id].id, alinanDonemId: donem[donemAdi].id, harfNotu, sonuc,
        gecilenDonemId: sonuc === 'GECTI' ? donem[donemAdi].id : null,
        onayDurumu: 'ONAYLANDI', kaynak: 'GECMIS_AKTARIM', onayTarihi: new Date(),
      },
    });
  }
  // Plan satırının durumu son denemeye göre
  for (const kod of ['3301156', '3301351', '3301452', '3301454']) {
    await prisma.planDersi.update({ where: { id: plan[ders[kod].id].id }, data: { durum: 'GECTI' } });
  }
  await prisma.planDersi.update({ where: { id: plan[ders['3301352'].id].id }, data: { durum: 'ALINDI' } });

  // 3) YDP öğrencisi (Makine)
  await prisma.ogrenci.create({
    data: {
      ogrenciNo: '234302003', adSoyad: 'Zeynep Kaya', eposta: 'ogrenci3@ornek.edu.tr',
      programTuru: 'YDP', anadalBolumId: mak.id, kabulDonemId: donem['2026-2027 GUZ'].id,
      kullaniciId: (await kullanici('ogrenci3@ornek.edu.tr', 'OGRENCI')).id,
    },
  });

  // 4) Eklenmiş ama hesabı henüz açılmamış öğrenci
  await prisma.ogrenci.create({
    data: {
      ogrenciNo: '224301004', adSoyad: 'Can Öztürk', eposta: 'ogrenci4@ornek.edu.tr',
      programTuru: 'CAP', anadalBolumId: eem.id, kabulDonemId: donem['2026-2027 GUZ'].id,
    },
  });

  await prisma.islemKaydi.create({
    data: { kullaniciId: koordinator.id, eylem: 'ORNEK_VERI_YUKLENDI', yeniDeger: { aciklama: 'Sentetik başlangıç verisi' } },
  });

  console.log('Örnek veri yüklendi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
