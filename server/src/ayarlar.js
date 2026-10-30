import 'dotenv/config';

// Uygulamanın teknik ayarları. Yönerge kuralları burada değil, veritabanındaki sürümlü ayarlarda tutulacak.
function zorunlu(ad) {
  const deger = process.env[ad];
  if (!deger) throw new Error(`${ad} ortam değişkeni tanımlı değil (.env dosyasına bakın)`);
  return deger;
}

export const ayarlar = {
  port: Number(process.env.PORT || 3000),
  uretimde: process.env.NODE_ENV === 'production',
  jwtSecret: zorunlu('JWT_SECRET'),
  oturumSuresiSaat: 2,
  maksHataliGiris: 5,
  kilitSuresiDakika: 15,
};
