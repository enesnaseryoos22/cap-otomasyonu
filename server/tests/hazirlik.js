import { execSync } from 'node:child_process';

// Test veritabanına tablolar uygulanır ve örnek veri (yoksa) yüklenir. Hiçbir veri silinmez.
export default function () {
  const testAdresi = (adres) => adres.replace(/\/cap_otomasyonu(\?|$)/, '/cap_otomasyonu_test$1');
  const env = {
    ...process.env,
    DATABASE_URL: testAdresi(process.env.DATABASE_URL),
    DIRECT_URL: testAdresi(process.env.DIRECT_URL),
  };
  execSync('npx prisma migrate deploy', { env, stdio: 'ignore' });
  execSync('node prisma/seed.js', { env, stdio: 'ignore' });
}
