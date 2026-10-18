# ÇAP ve Yandal Takip Otomasyonu

Selçuk Üniversitesi Teknoloji Fakültesi Bilgisayar Mühendisliği Bölümü için Çift Anadal (ÇAP) ve Yandal (YDP) öğrenci takip sistemi. Tasarım: [docs/TASLAK.md](docs/TASLAK.md).

**Şu anki aşama:** veritabanı (şema, kurallar, örnek veri). Sunucu ve arayüz henüz yok.

## Gerekenler
- Node.js 24 LTS
- PostgreSQL 17

## İlk kurulum
1. Bağımlılıkları kurun:
   ```
   cd server
   npm install
   ```
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
   npx prisma migrate deploy
   npm run db:seed
   ```

## Veritabanını görüntüleme
```
cd server
npm run db:studio
```
http://localhost:5555 adresinde tablolar açılır.

## Örnek veri (sentetik)
Deneme hesapları veritabanında hazırdır (giriş ekranı sonraki aşamada). Şifreleri: `Demo.2026!`

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
cd server
npm test
```
Veritabanı kurallarını sınar; ayrı bir veritabanında (`cap_otomasyonu_test`) çalışır ve iz bırakmaz.

## Klasörler
- `server/prisma/schema.prisma`: veritabanı şeması (25 tablo)
- `server/prisma/migrations/`: tabloları oluşturan ve veritabanı kurallarını (CHECK, tetikleyiciler) ekleyen SQL
- `server/prisma/seed.js`: örnek veri
- `server/prisma/veri/`: ders kataloğu ve EEM → BM protokolü (CSV)
- `server/tests/veritabani.test.js`: veritabanı kuralı testleri
