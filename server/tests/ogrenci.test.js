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

// Kayıtlar silinemediği için her çalıştırmada yeni numara ve e-posta kullanılır.
const ek = String(Date.now()).slice(-8);
let koordinator;
let yeniOgrenci;

async function ogrenciVerisi() {
  const { bolumler, donemler } = (await koordinator.ajan.get('/api/secenekler')).body;
  return {
    ogrenciNo: `9${ek}`, adSoyad: 'Deneme Öğrenci', eposta: `deneme${ek}@ornek.edu.tr`,
    programTuru: 'YDP', anadalBolumId: bolumler[0].id, kabulDonemId: donemler[0].id,
  };
}

beforeAll(async () => {
  await prisma.kullanici.updateMany({ data: { hataliGirisSayisi: 0, kilitliBitis: null } });
  koordinator = await girisYapan('koordinator@ornek.edu.tr');
});
afterAll(() => prisma.$disconnect());

describe('Öğrenci ekleme', () => {
  it('koordinatör öğrenci ekler ve işlem kaydına yazılır', async () => {
    const veri = await ogrenciVerisi();
    const yanit = await koordinator.ajan.post('/api/ogrenciler').set('X-CSRF-Token', koordinator.csrf).send(veri);
    expect(yanit.status).toBe(201);
    yeniOgrenci = yanit.body.ogrenci;
    expect(yeniOgrenci.kaynak).toBe('KOORDINATOR');
    const kayit = await prisma.islemKaydi.findFirst({ where: { eylem: 'OGRENCI_EKLENDI', varlikId: yeniOgrenci.id } });
    expect(kayit).not.toBeNull();
  });

  it('aynı öğrenci numarası ikinci kez eklenemez', async () => {
    const veri = await ogrenciVerisi();
    const yanit = await koordinator.ajan.post('/api/ogrenciler').set('X-CSRF-Token', koordinator.csrf).send(veri);
    expect(yanit.status).toBe(409);
  });

  it('hatalı bilgi reddedilir', async () => {
    const veri = { ...(await ogrenciVerisi()), ogrenciNo: '12ab' };
    const yanit = await koordinator.ajan.post('/api/ogrenciler').set('X-CSRF-Token', koordinator.csrf).send(veri);
    expect(yanit.status).toBe(400);
  });

  it('bölüm başkanı ve öğrenci öğrenci ekleyemez', async () => {
    const veri = await ogrenciVerisi();
    for (const eposta of ['baskan@ornek.edu.tr', 'ogrenci1@ornek.edu.tr']) {
      const { ajan, csrf } = await girisYapan(eposta);
      const yanit = await ajan.post('/api/ogrenciler').set('X-CSRF-Token', csrf).send(veri);
      expect(yanit.status).toBe(403);
    }
  });
});

describe('Hesap açma', () => {
  it('koordinatör hesap açar, öğrenci geçici şifreyle girer', async () => {
    const yanit = await koordinator.ajan.post(`/api/ogrenciler/${yeniOgrenci.id}/hesap`).set('X-CSRF-Token', koordinator.csrf);
    expect(yanit.status).toBe(201);
    expect(yanit.body.geciciSifre).toHaveLength(10);

    const { ajan } = await girisYapan(yeniOgrenci.eposta, yanit.body.geciciSifre);
    const panel = await ajan.get('/api/panel');
    expect(panel.body.ogrenci.ogrenciNo).toBe(yeniOgrenci.ogrenciNo);
  });

  it('açık hesap ikinci kez açılamaz', async () => {
    const yanit = await koordinator.ajan.post(`/api/ogrenciler/${yeniOgrenci.id}/hesap`).set('X-CSRF-Token', koordinator.csrf);
    expect(yanit.status).toBe(409);
  });
});
