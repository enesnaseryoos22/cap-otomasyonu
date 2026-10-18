// Veritabanı kurallarının (CHECK, tetikleyici, tekil indeks) gerçekten çalıştığını sınar.
// Her deneme bir transaction içinde yapılır ve geri alınır; test veritabanında iz bırakmaz.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class GeriAl extends Error {}

// fn başarılı olursa bile değişiklikleri geri alır.
async function geriAlarakCalistir(fn) {
  await expect(
    prisma.$transaction(async (tx) => {
      await fn(tx);
      throw new GeriAl();
    }),
  ).rejects.toBeInstanceOf(GeriAl);
}

// fn'in veritabanı tarafından reddedilmesini bekler (hata mesajı desene uymalı).
async function reddedilmeli(fn, desen) {
  await expect(prisma.$transaction(fn)).rejects.toThrow(desen);
}

let k; // örnek veriden kimlikler

beforeAll(async () => {
  const kullanici = (eposta) => prisma.kullanici.findUniqueOrThrow({ where: { eposta } });
  const ogrenci = (ogrenciNo) => prisma.ogrenci.findUniqueOrThrow({ where: { ogrenciNo } });
  k = {
    koordinator: await kullanici('koordinator@ornek.edu.tr'),
    baskan: await kullanici('baskan@ornek.edu.tr'),
    ayseHesap: await kullanici('ogrenci1@ornek.edu.tr'),
    ayse: await ogrenci('224301001'),
    mehmet: await ogrenci('214301002'),
    ders: await prisma.ders.findUniqueOrThrow({ where: { kod: '3301561' } }),
    donem: await prisma.donem.findFirstOrThrow({ where: { akademikYil: '2026-2027', tur: 'GUZ' } }),
  };
});
afterAll(() => prisma.$disconnect());

// Ayşe'nin kendi planına öğrenci olarak ders eklemesi
const ogrenciPlani = (ek = {}) => ({
  ogrenciId: k.ayse.id, dersId: k.ders.id, kaynak: 'OGRENCI', olusturanId: k.ayseHesap.id, ...ek,
});

describe('Silme yok', () => {
  it('hiçbir tablodan kayıt silinemez', async () => {
    await reddedilmeli((tx) => tx.ders.delete({ where: { id: k.ders.id } }), /silinemez/);
    await reddedilmeli((tx) => tx.kullanici.delete({ where: { id: k.baskan.id } }), /silinemez/);
  });

  it('tablo boşaltılamaz (TRUNCATE)', async () => {
    await reddedilmeli((tx) => tx.$executeRawUnsafe('TRUNCATE ders CASCADE'), /silinemez/);
  });

  it('kural ayarı güncellenemez, yeni sürüm eklenir', async () => {
    await reddedilmeli((tx) => tx.kuralAyari.updateMany({ data: { aciklama: 'değişti' } }), /değiştirilemez/);
  });
});

describe('Onay mantığı', () => {
  it('öğrencinin girdiği kayıt onay bekliyor başlar', async () => {
    await geriAlarakCalistir(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      expect(p.onayDurumu).toBe('ONAY_BEKLIYOR');
    });
  });

  it('öğrenci kaydını onaylı olarak giremez', async () => {
    await reddedilmeli((tx) => tx.planDersi.create({ data: ogrenciPlani({ onayDurumu: 'ONAYLANDI', onayTarihi: new Date() }) }),
      /onay bekliyor durumunda başlar/);
  });

  it('öğrenci başka öğrencinin kartına kayıt ekleyemez', async () => {
    await reddedilmeli((tx) => tx.planDersi.create({ data: ogrenciPlani({ ogrenciId: k.mehmet.id }) }), /kendi kartına/);
  });

  it('bölüm başkanı kayıt oluşturamaz', async () => {
    await reddedilmeli((tx) => tx.planDersi.create({ data: ogrenciPlani({ kaynak: 'KOORDINATOR', eklemeGerekcesi: 'x', olusturanId: k.baskan.id }) }),
      /BOLUM_BASKANI/);
  });

  it('onaylı kayıt yeniden onay beklemeye dönemez', async () => {
    await reddedilmeli(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.planDersi.update({ where: { id: p.id }, data: { onayDurumu: 'ONAYLANDI', onayTarihi: new Date(), onaylayanId: k.koordinator.id } });
      await tx.planDersi.update({ where: { id: p.id }, data: { onayDurumu: 'ONAY_BEKLIYOR' } });
    }, /geçişine izin verilmez/);
  });

  it('onaylayan yalnız koordinatör olabilir', async () => {
    await reddedilmeli(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.planDersi.update({ where: { id: p.id }, data: { onayDurumu: 'ONAYLANDI', onayTarihi: new Date(), onaylayanId: k.ayseHesap.id } });
    }, /onaylayan_id/);
  });

  it('ret gerekçesiz olamaz', async () => {
    await reddedilmeli(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.planDersi.update({ where: { id: p.id }, data: { onayDurumu: 'REDDEDILDI' } });
    }, /plan_dersi_red_gerekcesi/);
  });

  it('iptal edilen kayıt arşivdedir, değiştirilemez', async () => {
    await reddedilmeli(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.planDersi.update({ where: { id: p.id }, data: { onayDurumu: 'IPTAL', iptalGerekcesi: 'yanlış giriş', iptalTarihi: new Date() } });
      await tx.planDersi.update({ where: { id: p.id }, data: { durum: 'GECTI' } });
    }, /arşivdedir/);
  });

  it('aynı ders etkin planda iki kez olamaz, iptal edilince yeniden eklenebilir', async () => {
    await reddedilmeli(async (tx) => {
      await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.planDersi.create({ data: ogrenciPlani() });
    }, /Unique constraint/);
    await geriAlarakCalistir(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.planDersi.update({ where: { id: p.id }, data: { onayDurumu: 'IPTAL', iptalGerekcesi: 'yanlış', iptalTarihi: new Date() } });
      await tx.planDersi.create({ data: ogrenciPlani() });
    });
  });

  it('geçmiş aktarım onay beklemez', async () => {
    await reddedilmeli((tx) => tx.planDersi.create({ data: ogrenciPlani({ kaynak: 'GECMIS_AKTARIM', olusturanId: k.koordinator.id }) }),
      /plan_dersi_gecmis_aktarim/);
  });
});

describe('Not ve belge kuralları', () => {
  it('S2: öğrenci transkript olmadan not giremez', async () => {
    await reddedilmeli(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.dersDenemesi.create({
        data: { planDersiId: p.id, alinanDonemId: k.donem.id, harfNotu: 'BB', sonuc: 'GECTI', gecilenDonemId: k.donem.id, kaynak: 'OGRENCI', olusturanId: k.ayseHesap.id },
      });
    }, /ders_denemesi_transkript/);
  });

  it('geçilen dersin geçildiği dönem boş olamaz', async () => {
    await reddedilmeli(async (tx) => {
      const p = await tx.planDersi.create({ data: ogrenciPlani() });
      await tx.dersDenemesi.create({
        data: { planDersiId: p.id, alinanDonemId: k.donem.id, harfNotu: 'BB', sonuc: 'GECTI', kaynak: 'KOORDINATOR', olusturanId: k.koordinator.id },
      });
    }, /ders_denemesi_gecilen_donem/);
  });

  it('anadal GANO 0–4 arasında olmalı ve yalnız koordinatör girer', async () => {
    const gano = (ek) => ({ ogrenciId: k.ayse.id, donemId: k.donem.id, deger: 3, kaynak: 'TRANSKRIPT', girenId: k.koordinator.id, ...ek });
    await reddedilmeli((tx) => tx.anadalGanoKaydi.create({ data: gano({ deger: 4.5 }) }), /anadal_gano_deger|out of range/);
    await reddedilmeli((tx) => tx.anadalGanoKaydi.create({ data: gano({ girenId: k.ayseHesap.id }) }), /giren_id/);
  });

  it('belgenin dosyası değiştirilemez', async () => {
    await reddedilmeli(async (tx) => {
      const b = await tx.belge.create({
        data: {
          ogrenciId: k.ayse.id, tur: 'DERS_KAYIT_FORMU', orijinalAd: 'form.pdf', depoAdi: 'test-dosya', mimeTuru: 'application/pdf',
          boyut: 1000, sha256: 'a'.repeat(64), kaynak: 'OGRENCI', yukleyenId: k.ayseHesap.id,
        },
      });
      await tx.belge.update({ where: { id: b.id }, data: { sha256: 'b'.repeat(64) } });
    }, /yeni sürüm/);
  });
});

describe('Mesaj ve işlem kaydı', () => {
  it('mesaj gönderildikten sonra değiştirilemez', async () => {
    await reddedilmeli(async (tx) => {
      const y = await tx.yazisma.create({ data: { ogrenciId: k.ayse.id, konu: 'Deneme' } });
      const m = await tx.mesaj.create({ data: { yazismaId: y.id, gonderenId: k.ayseHesap.id, metin: 'Merhaba' } });
      await tx.mesaj.update({ where: { id: m.id }, data: { metin: 'Değişti' } });
    }, /kalıcıdır/);
  });

  it('öğrenci başkasının yazışmasına mesaj yazamaz', async () => {
    await reddedilmeli(async (tx) => {
      const y = await tx.yazisma.create({ data: { ogrenciId: k.mehmet.id, konu: 'Deneme' } });
      await tx.mesaj.create({ data: { yazismaId: y.id, gonderenId: k.ayseHesap.id, metin: 'Merhaba' } });
    }, /kendi yazışmasına/);
  });

  it('işlem kaydı güncellenemez', async () => {
    await reddedilmeli((tx) => tx.islemKaydi.updateMany({ data: { eylem: 'X' } }), /değiştirilemez/);
  });
});

describe('Türkçe', () => {
  it('sıralama ve büyük harf Türkçe kurallarına uyar', async () => {
    const [satir] = await prisma.$queryRaw`
      SELECT upper('istanbul') AS buyuk,
             string_agg(ad, ',' ORDER BY ad) AS sirali
      FROM (VALUES ('Zeynep'), ('Çelik'), ('Can'), ('İlker'), ('Ilgaz')) t(ad)`;
    expect(satir.buyuk).toBe('İSTANBUL');
    expect(satir.sirali).toBe('Can,Çelik,Ilgaz,İlker,Zeynep');
  });
});
