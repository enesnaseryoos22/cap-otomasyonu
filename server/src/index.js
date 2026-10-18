import { app } from './app.js';
import { ayarlar } from './ayarlar.js';

app.listen(ayarlar.port, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${ayarlar.port}`);
});
