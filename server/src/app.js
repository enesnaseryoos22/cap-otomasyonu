import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import kimlikRotalari from './routes/kimlik.js';
import panelRotalari from './routes/panel.js';
import { csrfKontrol } from './middleware/kimlik.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback'); // Vite geliştirme sunucusu üzerinden gelen istekler
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Giriş isteği hariç tüm değiştirici isteklerde CSRF jetonu aranır
// (girişte henüz jeton yoktur; SameSite=Strict çerez burada korur).
app.use('/api', (req, res, next) => (req.path === '/kimlik/giris' ? next() : csrfKontrol(req, res, next)));

app.use('/api/kimlik', kimlikRotalari);
app.use('/api', panelRotalari);

app.use('/api', (req, res) => res.status(404).json({ hata: 'Bulunamadı.' }));

// Beklenmeyen hata: ayrıntı kullanıcıya gösterilmez, sunucu günlüğüne yazılır.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ hata: 'Beklenmeyen bir hata oluştu.' });
});
