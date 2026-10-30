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

// Her çalıştırmada yeni bir EEM ÇAP öğrencisi açılır (kayıtlar silinemez).
let koordinator;
let ogrenci;
let ogrenciId;
let protokolDersi;

beforeAll(async () => {
  await prisma.kullanici.updateMany({ data: { hataliGirisSayisi: 0, kilitliBitis: null } });
  koordinator = await girisYapan('koordinator@ornek.edu.tr');
  const { bolumler, donemler } = (await koordinator.ajan.get('/api/secenekler')).body;
  const ek = String(Date.now()).slice(-8);
  const eklenen = await post(koordinator, '/api/ogrenciler', {
    ogrenciNo: `8${ek}`, adSoyad: 'Plan Deneme', eposta: `plan${ek}@ornek.edu.tr`, programTuru: 'CAP',
    anadalBolumId: bolumler.find((b) => b.kod === 'EEM').id, kabulDonemId: donemler[0].id,
  });
  ogrenciId = eklenen.body.ogrenci.id;
  const hesap = await post(koordinator, `/api/ogrenciler/${ogrenciId}/hesap`);
  ogrenci = await girisYapan(eklenen.body.ogrenci.eposta, hesap.body.geciciSifre);
});
afterAll(() => prisma.$disconnect());

describe('Katalog ve ders seçimi', () => {
  it('öğrenci kataloğu görür, protokoldeki dersler işaretlidir', async () => {
    const { dersler } = (await ogrenci.ajan.get('/api/katalog')).body;
    expect(dersler.length).toBeGreaterThan(100);
    protokolDersi = dersler.find((d) => d.protokolde);
    expect(protokolDersi).toBeDefined();
  });

  it('öğrenci ders seçer, kayıt onay bekliyor başlar; aynı ders ikinci kez seçilemez', async () => {
    const yanit = await post(ogrenci, '/api/plan', { dersId: protokolDersi.id });
    expect(yanit.status).toBe(201);
    expect(yanit.body.plan.onayDurumu).toBe('ONAY_BEKLIYOR');
    expect((await post(ogrenci, '/api/plan', { dersId: protokolDersi.id })).status).toBe(409);
  });

  it('katalogda olmayan ders seçilemez', async () => {
    const yanit = await post(ogrenci, '/api/plan', { dersId: '00000000-0000-4000-8000-000000000000' });
    expect(yanit.status).toBe(400);
  });

  it('kartta her ders denemesi dönemi ve notuyla görünür (tekrar alınan ders iki deneme)', async () => {
    const mehmet = await prisma.ogrenci.findUnique({ where: { ogrenciNo: '214301002' } });
    const { kart } = (await koordinator.ajan.get(`/api/ogrenciler/${mehmet.id}/kart`)).body;
    const tekrar = kart.planDersleri.find((p) => p.ders.kod === '3301352');
    expect(tekrar.denemeler.map((d) => `${d.alinanDonem.akademikYil} ${d.harfNotu} ${d.sonuc}`))
      .toEqual(['2025-2026 FF KALDI', '2026-2027 null ALINDI']);
    const gecen = kart.planDersleri.find((p) => p.ders.kod === '3301156');
    expect(gecen.denemeler[0].gecilenDonem).toEqual({ akademikYil: '2025-2026', tur: 'GUZ' });
  });

  it('öğrenci başkasının kartını göremez', async () => {
    const yanit = await ogrenci.ajan.get(`/api/ogrenciler/${ogrenciId}/kart`);
    expect(yanit.status).toBe(403);
  });
});

describe('Onay', () => {
  async function bekleyenKayit() {
    const { bekleyenler } = (await koordinator.ajan.get('/api/onay-bekleyenler')).body;
    return bekleyenler.find((b) => b.ogrenci.id === ogrenciId);
  }

  it('öğrenci ve bölüm başkanı onay veremez', async () => {
    const kayit = await bekleyenKayit();
    expect((await post(ogrenci, `/api/plan/${kayit.id}/karar`, { karar: 'ONAYLA' })).status).toBe(403);
    const baskan = await girisYapan('baskan@ornek.edu.tr');
    expect((await post(baskan, `/api/plan/${kayit.id}/karar`, { karar: 'ONAYLA' })).status).toBe(403);
  });

  it('ret gerekçesiz olmaz; reddedilen ders yeniden istenebilir', async () => {
    const kayit = await bekleyenKayit();
    expect((await post(koordinator, `/api/plan/${kayit.id}/karar`, { karar: 'REDDET' })).status).toBe(400);
    const ret = await post(koordinator, `/api/plan/${kayit.id}/karar`, { karar: 'REDDET', gerekce: 'Önkoşul eksik' });
    expect(ret.body.plan.onayDurumu).toBe('REDDEDILDI');
    expect((await post(ogrenci, '/api/plan', { dersId: protokolDersi.id })).status).toBe(201);
  });

  it('onaylanan ders kilitlenir ve AKTS özetine girer', async () => {
    const kayit = await bekleyenKayit();
    const onay = await post(koordinator, `/api/plan/${kayit.id}/karar`, { karar: 'ONAYLA' });
    expect(onay.body.plan.onayDurumu).toBe('ONAYLANDI');
    expect((await post(koordinator, `/api/plan/${kayit.id}/karar`, { karar: 'REDDET', gerekce: 'deneme' })).status).toBe(409);

    const { kart } = (await ogrenci.ajan.get('/api/kartim')).body;
    expect(kart.akts.planlanan).toBe(protokolDersi.akts);
    expect(kart.akts.gerekli).toBeGreaterThan(0);
    expect(kart.planDersleri.map((p) => p.onayDurumu).sort()).toEqual(['ONAYLANDI', 'REDDEDILDI']);
    const islem = await prisma.islemKaydi.findFirst({ where: { eylem: 'PLAN_ONAYLANDI', varlikId: kayit.id } });
    expect(islem.eskiDeger.onayDurumu).toBe('ONAY_BEKLIYOR');
  });
});
