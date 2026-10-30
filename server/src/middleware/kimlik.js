import crypto from 'node:crypto';
import { tokenCoz } from '../services/kimlikServisi.js';

export const OTURUM_CEREZI = 'oturum';
export const CSRF_CEREZI = 'csrf';

// Oturum çerezini doğrular ve req.kullanici'yi doldurur.
// Bölüm başkanı salt okunurdur: GET dışındaki her isteği sunucu reddeder.
export function girisGerekli(req, res, next) {
  const token = req.cookies[OTURUM_CEREZI];
  if (!token) return res.status(401).json({ hata: 'Oturum açmanız gerekiyor.' });
  try {
    const { sub, rol } = tokenCoz(token);
    req.kullanici = { id: sub, rol };
  } catch {
    return res.status(401).json({ hata: 'Oturumunuzun süresi doldu, tekrar giriş yapın.' });
  }
  if (req.kullanici.rol === 'BOLUM_BASKANI' && req.method !== 'GET') {
    return res.status(403).json({ hata: 'Bölüm başkanı hesabı yalnız görüntüleme yapabilir.' });
  }
  next();
}

// Kullanım: rolGerekli('KOORDINATOR', 'BOLUM_BASKANI')
export function rolGerekli(...roller) {
  return (req, res, next) => {
    if (!roller.includes(req.kullanici?.rol)) {
      return res.status(403).json({ hata: 'Bu işlem için yetkiniz yok.' });
    }
    next();
  };
}

// CSRF koruması (double-submit): girişte rastgele bir değer, JavaScript'in okuyabildiği
// bir çereze yazılır. Arayüz her değiştirici istekte bu değeri X-CSRF-Token başlığında gönderir.
// Başka bir site çerezi okuyamadığı için başlığı da üretemez.
export function csrfJetonuUret() {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfKontrol(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cerez = req.cookies[CSRF_CEREZI];
  const baslik = req.get('X-CSRF-Token');
  if (!cerez || !baslik || cerez.length !== baslik.length ||
      !crypto.timingSafeEqual(Buffer.from(cerez), Buffer.from(baslik))) {
    return res.status(403).json({ hata: 'Güvenlik doğrulaması başarısız (CSRF). Sayfayı yenileyin.' });
  }
  next();
}
