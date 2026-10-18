import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { girisSemasi } from '../validation/kimlik.js';
import { girisYap, GirisHatasi, kullaniciBilgisi, tokenCoz } from '../services/kimlikServisi.js';
import { girisGerekli, csrfJetonuUret, OTURUM_CEREZI, CSRF_CEREZI } from '../middleware/kimlik.js';
import { islemKaydet } from '../lib/islemKaydi.js';
import { ayarlar } from '../ayarlar.js';

const router = Router();

// Aynı IP'den 15 dakikada en çok 20 giriş denemesi
const girisSiniri = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: 'Çok fazla giriş denemesi. Lütfen biraz sonra tekrar deneyin.' },
});

const cerezAyari = {
  sameSite: 'strict',
  secure: ayarlar.uretimde,
  maxAge: ayarlar.oturumSuresiSaat * 3600_000,
  path: '/',
};

router.post('/giris', girisSiniri, async (req, res, next) => {
  const sonuc = girisSemasi.safeParse(req.body);
  if (!sonuc.success) return res.status(400).json({ hata: sonuc.error.issues[0].message });

  try {
    const { token, kullanici } = await girisYap(sonuc.data.eposta, sonuc.data.sifre, req.ip);
    res.cookie(OTURUM_CEREZI, token, { ...cerezAyari, httpOnly: true });
    res.cookie(CSRF_CEREZI, csrfJetonuUret(), { ...cerezAyari, httpOnly: false });
    res.json({ kullanici });
  } catch (e) {
    if (e instanceof GirisHatasi) return res.status(401).json({ hata: e.message });
    next(e);
  }
});

router.post('/cikis', async (req, res) => {
  try {
    const { sub } = tokenCoz(req.cookies[OTURUM_CEREZI]);
    await islemKaydet({ kullaniciId: sub, eylem: 'CIKIS', varlik: 'Kullanici', varlikId: sub, ipAdresi: req.ip });
  } catch {
    // Oturum zaten geçersizse yalnız çerezler temizlenir.
  }
  res.clearCookie(OTURUM_CEREZI, { path: '/' });
  res.clearCookie(CSRF_CEREZI, { path: '/' });
  res.json({ tamam: true });
});

router.get('/ben', girisGerekli, async (req, res) => {
  const kullanici = await kullaniciBilgisi(req.kullanici.id);
  if (!kullanici) return res.status(401).json({ hata: 'Oturum açmanız gerekiyor.' });
  res.json({ kullanici });
});

export default router;
