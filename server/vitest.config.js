import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Testler ayrı bir veritabanında çalışır; geliştirme verisi bozulmaz.
const testDbUrl = process.env.DATABASE_URL.replace(/\/cap_otomasyonu(\?|$)/, '/cap_otomasyonu_test$1');

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDbUrl },
    globalSetup: './tests/hazirlik.js',
    fileParallelism: false,
  },
});
