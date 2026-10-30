import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Testler ayrı bir veritabanında çalışır; geliştirme verisi bozulmaz.
const testAdresi = (adres) => adres.replace(/\/cap_otomasyonu(\?|$)/, '/cap_otomasyonu_test$1');

export default defineConfig({
  test: {
    env: { DATABASE_URL: testAdresi(process.env.DATABASE_URL), DIRECT_URL: testAdresi(process.env.DIRECT_URL) },
    globalSetup: './tests/hazirlik.js',
    fileParallelism: false,
  },
});
