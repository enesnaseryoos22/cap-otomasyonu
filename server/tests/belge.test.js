import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const SIFRE = process.env.DEMO_SIFRE || 'Demo.2026!';

async function girisYapan(eposta, sifre = SIFRE) {
  const ajan = request.agent(app);
  const yanit = await ajan.post('/api/kimlik/giris').send({ eposta, sifre });
  expect(yanit.status).toBe(200);
  const csrf = yanit.headers['set-cookie'].find((c) => c.startsWith('csrf=')).split(';')[0].slice(5);
  return { ajan, csrf };
}

const post = (k, yol, govde = {}) => k.ajan.post(yol).set('X-CSRF-Token', k.csrf).send(govde);
const yukle = (k, icerik, ad, tur = 'KABUL_VE_DERS_PROTOKOLU') =>
  k.ajan.post('/api/belgeler').set('X-CSRF-Token', k.csrf).field('tur', tur).attach('dosya', icerik, ad);

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n%%EOF\n');

let koordinator;
let ogrenci;
let ilkBelgeId;

beforeAll(async () => {
  await prisma.kullanici.updateMany({ data: { hataliGirisSayisi: 0, kilitliBitis: null } });
  koordinator = await girisYapan('koordinator@ornek.edu.tr');
  const { bolumler, donemler } = (await koordinator.ajan.get('/api/secenekler')).body;
  const ek = String(Date.now()).slice(-8);
  const eklenen = await post(koordinator, '/api/ogrenciler', {
    ogrenciNo: `7${ek}`, adSoyad: 'Belge Deneme', eposta: `belge${ek}@ornek.edu.tr`, programTuru: 'CAP',
    anadalBolumId: bolumler[0].id, kabulDonemId: donemler[0].id,
  });
  const hesap = await post(koordinator, `/api/ogrenciler/${eklenen.body.ogrenci.id}/hesap`);
  ogrenci = await girisYapan(eklenen.body.ogrenci.eposta, hesap.body.geciciSifre);
});
afterAll(() => prisma.$disconnect());

describe('Dosya güvenlik kontrolü', () => {
  it('uzantısı .pdf olan çalıştırılabilir dosya reddedilir (magic number)', async () => {
    const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(100)]);
    const yanit = await yukle(ogrenci, exe, 'form.pdf');
    expect(yanit.status).toBe(400);
  });

  it('içeriği PDF ama uzantısı farklı olan dosya reddedilir', async () => {
    expect((await yukle(ogrenci, PDF, 'form.html')).status).toBe(400);
  });

  it('betik içeren PDF reddedilir', async () => {
    const zararli = Buffer.from('%PDF-1.4\n1 0 obj << /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >> endobj\n%%EOF');
    const yanit = await yukle(ogrenci, zararli, 'form.pdf');
    expect(yanit.status).toBe(400);
    expect(yanit.body.hata).toMatch(/betik/);
  });

  it('5 MB üstü dosya reddedilir', async () => {
    const buyuk = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)]);
    expect((await yukle(ogrenci, buyuk, 'form.pdf')).status).toBe(413);
  });
});

describe('Belge yükleme ve onay', () => {
  it('öğrenci PDF yükler, belge onay bekliyor başlar; onay beklerken aynı tür tekrar yüklenemez', async () => {
    const yanit = await yukle(ogrenci, PDF, 'imzalı başvuru formu.pdf');
    expect(yanit.status).toBe(201);
    expect(yanit.body.belge.onayDurumu).toBe('ONAY_BEKLIYOR');
    expect(yanit.body.belge.orijinalAd).toBe('imzalı başvuru formu.pdf');
    ilkBelgeId = yanit.body.belge.id;
    expect((await yukle(ogrenci, PDF, 'ikinci.pdf')).status).toBe(409);
  });

  it('öğrenci kendi belgesini indirir; içerik aynıdır', async () => {
    const yanit = await ogrenci.ajan.get(`/api/belgeler/${ilkBelgeId}/dosya`).buffer(true).parse((r, cb) => {
      const parcalar = [];
      r.on('data', (p) => parcalar.push(p));
      r.on('end', () => cb(null, Buffer.concat(parcalar)));
    });
    expect(yanit.status).toBe(200);
    expect(yanit.headers['content-disposition']).toMatch(/attachment/);
    expect(Buffer.compare(yanit.body, PDF)).toBe(0);
  });

  it('başka öğrenci belgeyi indiremez; bölüm başkanı indirir ama onaylayamaz', async () => {
    const baska = await girisYapan('ogrenci1@ornek.edu.tr');
    expect((await baska.ajan.get(`/api/belgeler/${ilkBelgeId}/dosya`)).status).toBe(403);
    const baskan = await girisYapan('baskan@ornek.edu.tr');
    expect((await baskan.ajan.get(`/api/belgeler/${ilkBelgeId}/dosya`)).status).toBe(200);
    expect((await post(baskan, `/api/belgeler/${ilkBelgeId}/karar`, { karar: 'ONAYLA' })).status).toBe(403);
  });

  it('koordinatör gerekçeyle reddeder; öğrenci yeni sürüm yükler, eski sürüm kalır', async () => {
    const ret = await post(koordinator, `/api/belgeler/${ilkBelgeId}/karar`, { karar: 'REDDET', gerekce: 'İmza eksik' });
    expect(ret.body.belge.onayDurumu).toBe('REDDEDILDI');

    const yeni = await yukle(ogrenci, PDF, 'imzalı form v2.pdf');
    expect(yeni.status).toBe(201);
    expect(yeni.body.belge.surumNo).toBe(2);

    const onay = await post(koordinator, `/api/belgeler/${yeni.body.belge.id}/karar`, { karar: 'ONAYLA' });
    expect(onay.body.belge.onayDurumu).toBe('ONAYLANDI');

    const { kart } = (await ogrenci.ajan.get('/api/kartim')).body;
    expect(kart.belgeler.map((b) => `${b.surumNo}:${b.onayDurumu}`)).toEqual(['2:ONAYLANDI', '1:REDDEDILDI']);
  });

  it('dosya içeriği veritabanında değiştirilemez ve silinemez', async () => {
    await expect(prisma.belgeIcerigi.update({ where: { belgeId: ilkBelgeId }, data: { icerik: Buffer.from('x') } })).rejects.toThrow();
    await expect(prisma.belgeIcerigi.delete({ where: { belgeId: ilkBelgeId } })).rejects.toThrow();
  });
});
