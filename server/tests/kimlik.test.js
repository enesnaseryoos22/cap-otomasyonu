import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const SIFRE = process.env.DEMO_SIFRE || 'Demo.2026!';

// Giriş yapar; oturum ve CSRF çerezlerini taşıyan bir istemci döndürür.
async function girisYapan(eposta) {
  const ajan = request.agent(app);
  const yanit = await ajan.post('/api/kimlik/giris').send({ eposta, sifre: SIFRE });
  expect(yanit.status).toBe(200);
  const csrf = yanit.headers['set-cookie'].find((c) => c.startsWith('csrf=')).split(';')[0].slice(5);
  return { ajan, csrf };
}

// Önceki test çalışmasından kalan hesap kilitleri açılır.
beforeAll(() => prisma.kullanici.updateMany({ data: { hataliGirisSayisi: 0, kilitliBitis: null } }));
afterAll(() => prisma.$disconnect());

describe('Giriş', () => {
  it('doğru bilgilerle giriş yapılır, oturum çerezi httpOnly olur', async () => {
    const yanit = await request(app).post('/api/kimlik/giris').send({ eposta: 'koordinator@ornek.edu.tr', sifre: SIFRE });
    expect(yanit.status).toBe(200);
    expect(yanit.body.kullanici.rol).toBe('KOORDINATOR');
    expect(yanit.body.kullanici.sifreHash).toBeUndefined();
    const oturum = yanit.headers['set-cookie'].find((c) => c.startsWith('oturum='));
    expect(oturum).toMatch(/HttpOnly/i);
    expect(oturum).toMatch(/SameSite=Strict/i);
  });

  it('yanlış şifre ve olmayan e-posta aynı mesajı alır', async () => {
    const a = await request(app).post('/api/kimlik/giris').send({ eposta: 'baskan@ornek.edu.tr', sifre: 'yanlis' });
    const b = await request(app).post('/api/kimlik/giris').send({ eposta: 'yok@ornek.edu.tr', sifre: 'yanlis' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.hata).toBe(b.body.hata);
  });

  it('geçersiz girdi reddedilir', async () => {
    const yanit = await request(app).post('/api/kimlik/giris').send({ eposta: "' OR 1=1 --", sifre: 'x' });
    expect(yanit.status).toBe(400);
  });

  it('5 hatalı denemeden sonra hesap kilitlenir, doğru şifre de kabul edilmez', async () => {
    const eposta = 'ogrenci3@ornek.edu.tr';
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/kimlik/giris').send({ eposta, sifre: 'yanlis' });
    }
    const yanit = await request(app).post('/api/kimlik/giris').send({ eposta, sifre: SIFRE });
    expect(yanit.status).toBe(401);
    expect(yanit.body.hata).toMatch(/kilitlendi/);
  });

  it('hesabı açılmamış öğrenci giriş yapamaz', async () => {
    const yanit = await request(app).post('/api/kimlik/giris').send({ eposta: 'ogrenci4@ornek.edu.tr', sifre: SIFRE });
    expect(yanit.status).toBe(401);
  });
});

describe('Yetki', () => {
  it('oturumsuz istek 401 alır', async () => {
    expect((await request(app).get('/api/panel')).status).toBe(401);
  });

  it('öğrenci öğrenci listesine erişemez (403)', async () => {
    const { ajan } = await girisYapan('ogrenci1@ornek.edu.tr');
    expect((await ajan.get('/api/ogrenciler')).status).toBe(403);
    expect((await ajan.get('/api/islem-kaydi')).status).toBe(403);
  });

  it('öğrenci panelinde yalnız kendi bilgisi gelir', async () => {
    const { ajan } = await girisYapan('ogrenci2@ornek.edu.tr');
    const yanit = await ajan.get('/api/panel');
    expect(yanit.body.ogrenci.ogrenciNo).toBe('214301002');
    expect(yanit.body.akts.tamamlanan).toBe(17); // 4 + 4 + 4 + 5
  });

  it('bölüm başkanı listeyi görür ama değişiklik isteği 403 alır', async () => {
    const { ajan, csrf } = await girisYapan('baskan@ornek.edu.tr');
    expect((await ajan.get('/api/ogrenciler')).status).toBe(200);
    const yazma = await ajan.post('/api/ogrenciler').set('X-CSRF-Token', csrf).send({});
    expect(yazma.status).toBe(403);
  });

  it('CSRF jetonu olmadan değiştirici istek reddedilir', async () => {
    const { ajan } = await girisYapan('koordinator@ornek.edu.tr');
    expect((await ajan.post('/api/kimlik/cikis')).status).toBe(403);
  });
});

describe('İşlem kaydı', () => {
  it('girişler kayda yazılır', async () => {
    const sayi = await prisma.islemKaydi.count({ where: { eylem: 'GIRIS_BASARILI' } });
    expect(sayi).toBeGreaterThan(0);
  });

  it('kayıt güncellenemez ve silinemez', async () => {
    const kayit = await prisma.islemKaydi.findFirst();
    await expect(prisma.islemKaydi.update({ where: { id: kayit.id }, data: { eylem: 'DEGISTI' } })).rejects.toThrow();
    await expect(prisma.islemKaydi.delete({ where: { id: kayit.id } })).rejects.toThrow();
  });
});
