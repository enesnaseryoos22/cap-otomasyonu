import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import kimlikRotalari from './routes/kimlik.js';
import panelRotalari from './routes/panel.js';
import ogrenciRotalari from './routes/ogrenci.js';
import planRotalari from './routes/plan.js';
import { csrfKontrol } from './middleware/kimlik.js';
import { ayarlar } from './ayarlar.js';

export const app = express();

// Derlenmiş arayüz (npm run build). Canlı ortamda arayüz ve API aynı adresten sunulur.
const arayuzKlasoru = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

app.disable('x-powered-by');
// Gerçek istemci IP'si (giriş sınırı ve işlem kaydı için). Render'da istek üç vekilden geçer
// (istemci → Cloudflare → Render iç ağı), bu yüzden sağdan 3 adım güvenilir; istemcinin
// sahte X-Forwarded-For başlığı bu üç adımın soluna düşer ve kullanılmaz.
// Yerelde yalnız Vite geliştirme sunucusuna güvenilir.
app.set('trust proxy', ayarlar.uretimde ? 3 : 'loopback');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Giriş isteği hariç tüm değiştirici isteklerde CSRF jetonu aranır
// (girişte henüz jeton yoktur; SameSite=Strict çerez burada korur).
app.use('/api', (req, res, next) => (req.path === '/kimlik/giris' ? next() : csrfKontrol(req, res, next)));

app.use('/api/kimlik', kimlikRotalari);
app.use('/api', panelRotalari);
app.use('/api', ogrenciRotalari);
app.use('/api', planRotalari);

app.use('/api', (req, res) => res.status(404).json({ hata: 'Bulunamadı.' }));

// Arayüz dosyaları; diğer tüm sayfa adresleri (/giris, /koordinator ...) index.html'e gider,
// sayfa yönlendirmesini React Router yapar.
app.use(express.static(arayuzKlasoru));
app.get('/{*sayfa}', (req, res) => res.sendFile(path.join(arayuzKlasoru, 'index.html')));

// Beklenmeyen hata: ayrıntı kullanıcıya gösterilmez, sunucu günlüğüne yazılır.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ hata: 'Beklenmeyen bir hata oluştu.' });
});
