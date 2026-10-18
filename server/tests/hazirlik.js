import { execSync } from 'node:child_process';

// Test veritabanına tablolar uygulanır ve örnek veri (yoksa) yüklenir. Hiçbir veri silinmez.
export default function () {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL.replace(/\/cap_otomasyonu(\?|$)/, '/cap_otomasyonu_test$1') };
  execSync('npx prisma migrate deploy', { env, stdio: 'ignore' });
  execSync('node prisma/seed.js', { env, stdio: 'ignore' });
}
