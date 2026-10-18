# ÇAP ve Yandal Takip Otomasyonu

Selçuk Üniversitesi Teknoloji Fakültesi Bilgisayar Mühendisliği Bölümü için Çift Anadal (ÇAP) ve Yandal (YDP) öğrenci takip sistemi. Tasarım: [docs/TASLAK.md](docs/TASLAK.md).

## Gerekenler
- Node.js 24 LTS
- PostgreSQL 17

## İlk kurulum
1. Bağımlılıkları kurun: `npm run kurulum`
2. Veritabanını Türkçe dil desteğiyle oluşturun (postgres kullanıcısıyla):
   ```sql
   CREATE ROLE cap_app LOGIN CREATEDB PASSWORD '...';
   CREATE DATABASE cap_otomasyonu OWNER cap_app ENCODING 'UTF8'
     LOCALE_PROVIDER icu ICU_LOCALE 'tr-TR' LOCALE 'C' TEMPLATE template0;
   CREATE DATABASE cap_otomasyonu_test OWNER cap_app ENCODING 'UTF8'
     LOCALE_PROVIDER icu ICU_LOCALE 'tr-TR' LOCALE 'C' TEMPLATE template0;
   ```
3. `server/.env.example` dosyasını `server/.env` olarak kopyalayın ve veritabanı bağlantısını yazın.
4. Tabloları oluşturun ve örnek veriyi yükleyin:
   ```
   cd server
   npx prisma migrate deploy
   npm run db:seed
   ```

## Çalıştırma
```
npm run dev
```
Arayüz: http://localhost:5173 · API: http://localhost:3000

## Deneme hesapları (sentetik veri)
Tüm hesapların şifresi: `Demo.2026!`

| E-posta | Rol | Not |
| --- | --- | --- |
| koordinator@ornek.edu.tr | Koordinatör | |
| baskan@ornek.edu.tr | Bölüm Başkanı | Yalnız görüntüler |
| ogrenci1@ornek.edu.tr | Öğrenci | Ayşe Yılmaz, yeni ÇAP öğrencisi (EEM) |
| ogrenci2@ornek.edu.tr | Öğrenci | Mehmet Demir, mevcut ÇAP öğrencisi, geçmiş dönem notları var |
| ogrenci3@ornek.edu.tr | Öğrenci | Zeynep Kaya, YDP öğrencisi (Makine) |
| ogrenci4@ornek.edu.tr | — | Can Öztürk, hesabı henüz açılmamış |

## Testler
```
npm test
```
Testler ayrı bir veritabanında (`cap_otomasyonu_test`) çalışır.

## Klasörler
- `server/prisma/schema.prisma`: veritabanı şeması
- `server/prisma/veri/`: ders kataloğu ve EEM → BM protokolü (CSV)
- `server/src/routes/`: API uçları
- `server/src/services/`: iş mantığı; tüm veri yazma işlemleri buradan geçer
- `server/src/middleware/`: oturum, rol ve CSRF kontrolü
- `client/src/pages/`: rol bazlı sayfalar
