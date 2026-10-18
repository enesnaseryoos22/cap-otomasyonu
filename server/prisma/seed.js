// Örnek (sentetik) veri. Gerçek öğrenci verisi kullanılmaz.
// Çalıştırma: npm run db:seed  (veri zaten varsa atlanır)
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

  // --- Kullanıcılar (3 rol) ---
  const sifreHash = await argon2.hash(process.env.DEMO_SIFRE || 'Demo.2026!');
  const kullanici = (eposta, rol) => prisma.kullanici.create({ data: { eposta, rol, sifreHash } });

  const koordinator = await kullanici('koordinator@ornek.edu.tr', 'KOORDINATOR');
  await kullanici('baskan@ornek.edu.tr', 'BOLUM_BASKANI');

  // --- Kural ayarları (docs/PROJE-NOTLARI.md §3). Değerler yönergeden; koordinatör sonradan yeni sürüm ekler. ---
  const capYonergesi = new Date('2026-06-02T00:00:00+03:00');
  const ydpYonergesi = new Date('2023-10-26T00:00:00+03:00');
  const ayarlar = [
    ['cap.anadal_gano_esik', 2.72, 'ÇAP: anadal GANO alt eşiği', 'ÇAP Yön. Md. 9/1-e, 8/1-c', capYonergesi],
    ['cap.anadal_gano_alt_sinir', 2.5, 'ÇAP: bir defaya mahsus düşülebilecek alt sınır', 'ÇAP Yön. Md. 9/1-e', capYonergesi],
    ['cap.ders_almama_donem', 2, 'ÇAP: üst üste ders almama sınırı (dönem)', 'ÇAP Yön. Md. 9/1-d', capYonergesi],
    ['cap.azami_sure_yil_4yillik', 7, 'ÇAP: 4 yıllık programda azami süre (yıl)', 'ÇAP Yön. Md. 8/1-d; 2547/44-c', capYonergesi],
    ['cap.azami_sure_uyari_donem', 2, 'ÇAP: azami süre dolmadan önce uyarı (son dönem sayısı)', 'Tasarım kararı', capYonergesi],
    ['ydp.min_akts', 30, 'YDP: ders planında en az AKTS', 'YDP Yön. Md. 5/1-g', ydpYonergesi],
    ['ydp.min_ders', 6, 'YDP: ders planında en az ders sayısı', 'YDP Yön. Md. 5/1-g', ydpYonergesi],
    ['ydp.anadal_gano_esik', 2.3, 'YDP: anadal GANO alt eşiği', 'YDP Yön. Md. 7/5', ydpYonergesi],
    ['ydp.gano_esik', 2.0, 'YDP: yandal ortalaması alt eşiği', 'YDP Yön. Md. 7/6, 7/8', ydpYonergesi],
    ['ydp.gano_esik_donem', 2, 'YDP: eşik altında üst üste dönem sınırı', 'YDP Yön. Md. 7/6', ydpYonergesi],
    ['ydp.ders_almama_donem', 2, 'YDP: üst üste ders almama sınırı (dönem)', 'YDP Yön. Md. 7/4', ydpYonergesi],
    ['ydp.ek_sure_yariyil', 2, 'YDP: anadal mezuniyetinden sonra ek süre (yarıyıl)', 'YDP Yön. Md. 7/9', ydpYonergesi],
    ['not.harf_katsayilari', { AA: 4.0, BA: 3.5, BB: 3.0, CB: 2.5, CC: 2.0, DC: 1.5, DD: 1.0, FD: 0.5, FF: 0.0 },
      'Harf notu katsayıları (koordinatöre teyit ettirilecek)', 'Sınav Yönetmeliği', capYonergesi],
    ['not.tekrar_gecerli_deneme', 'SON', 'Tekrarlanan derste ortalamaya giren deneme (teyit edilecek)', 'Sınav Yönetmeliği', capYonergesi],
    ['not.ortalama_agirlik', 'AKTS', 'Ortalama hesabında ağırlık', 'Tasarım kararı', capYonergesi],
    ['dosya.izinli_turler', ['application/pdf', 'image/jpeg', 'image/png'], 'Yüklenebilecek dosya türleri', 'Tasarım kararı', capYonergesi],
    ['dosya.max_mb', 10, 'En büyük dosya boyutu (MB)', 'Tasarım kararı', capYonergesi],
  ];
  for (const [anahtar, deger, aciklama, dayanak, gecerlilikBaslangic] of ayarlar) {
    await prisma.kuralAyari.create({
      data: { anahtar, deger, aciklama, dayanak, gecerlilikBaslangic, girenId: koordinator.id },
    });
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
  await prisma.donem.update({
    where: { id: donem['2026-2027 GUZ'].id },
    data: { baslangic: new Date('2026-09-14'), bitis: new Date('2027-01-17') },
  });

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
        yuvaDersTuru: s.yuvaAdi ? 'TEKNIK_SECMELI' : null,
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
      capOgrenciNo: 'C25001', kaynak: 'GECMIS_AKTARIM',
      kullaniciId: (await kullanici('ogrenci2@ornek.edu.tr', 'OGRENCI')).id,
    },
  });
  const simdi = new Date();
  const aktarim = { onayDurumu: 'ONAYLANDI', kaynak: 'GECMIS_AKTARIM', olusturanId: koordinator.id, onaylayanId: koordinator.id, onayTarihi: simdi };

  // Protokoldeki belirli derslerin hepsi plana eklenir (seçmeli yuvaları henüz boş)
  const plan = {};
  for (const s of Object.values(protokolSatiri).filter((s) => s.dersId)) {
    plan[s.dersId] = await prisma.planDersi.create({
      data: { ogrenciId: mehmet.id, dersId: s.dersId, protokolSatiriId: s.id, ...aktarim },
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
        ...aktarim,
      },
    });
  }
  // Plan satırının durumu son denemeye göre
  for (const kod of ['3301156', '3301351', '3301452', '3301454']) {
    await prisma.planDersi.update({ where: { id: plan[ders[kod].id].id }, data: { durum: 'GECTI' } });
  }
  await prisma.planDersi.update({ where: { id: plan[ders['3301352'].id].id }, data: { durum: 'ALINDI' } });

  // Anadal GANO'su (koordinatör, kaynağıyla)
  await prisma.anadalGanoKaydi.create({
    data: {
      ogrenciId: mehmet.id, donemId: donem['2025-2026 BAHAR'].id, deger: 2.95,
      kaynak: 'TRANSKRIPT', girenId: koordinator.id,
    },
  });

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
