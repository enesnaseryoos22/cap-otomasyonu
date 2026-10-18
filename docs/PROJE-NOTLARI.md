# Proje Notları: Uygulama İçin Referans

Bu dosya, `docs/belgeler/` altındaki belgelerin ve koordinatör e-postasının uygulamaya dönük özetidir. Tasarımın kendisi `docs/TASLAK.md` dosyasındadır. Çelişki olursa sıra şöyledir: yönerge > koordinatör e-postası > bu dosya.

## 1. Kaynak belgeler
| Dosya | İçerik |
| --- | --- |
| 00-Koordinator-Epostasi-Sistem-Cercevesi.txt | **Asıl gereksinim kaynağı.** Sistemin çerçevesi, roller, onay mantığı, teslim tarihi |
| 01-Cift-Ana-Dal-Yonergesi-2026.pdf | Çift Ana Dal Yönergesi (02.06.2026, E.1264957, Senato 20.05.2026) |
| 02-CAP-Rehberi-BM-2025.pdf | BM Çift Anadal Rehberi (Şubat 2025). Madde numaraları eski (bkz. §8) |
| 03-Protokol-EEM-to-BM.pdf | Elektrik-Elektronik → BM Kabul ve Ders Protokolü (28 satır, 135 AKTS, 8 özel şart) |
| 04-FORM01-Ders-Kayit-Formu.docx | ÇAP Ders Kayıt Formu (boş şablon) |
| 05-Yandal-Yonergesi-2023.pdf | Yan Dal Yönergesi (Senato 26.10.2023) |
| 06-Yandal-Formlari.pdf | Yan Dal Kabul ve Ders Protokol Formu ve Yan Dal Ders Kayıt Formu |

## 2. Gereksinim kontrol listesi (koordinatör e-postasından)
Bir özellik bitince kutusu işaretlenir. Demo kapsamındakiler **[30 Ekim]** ile gösterilmiştir.

**Kapsam ve veri**
- [ ] Sistem yalnız BM içindir; başvuru ve seçim yoktur. Koordinatör, kabul edilen öğrenciyi ekler **[30 Ekim]**
- [ ] Öğrenci, ÇAP veya YDP olarak kayıtlıdır; ikisi aynı sistemde yönetilir
- [ ] OBİS bağlantısı yok, ama tüm yazmalar tek servis katmanından geçer. Öğrenci no benzersiz anahtardır; CSV ile içe aktarılabilir

**Kullanıcılar ve giriş**
- [ ] Yalnız 3 rol vardır: Koordinatör, Öğrenci, Bölüm başkanı (salt okunur) **[30 Ekim]**
- [ ] Hesapları koordinatör açar; öğrenci kendi kendine kayıt olamaz. Giriş güvenlidir **[30 Ekim]**

**Koordinatör**
- [ ] Öğrenci ekler: öğrenci no, ad soyad, okul e-postası, ÇAP/YDP, kabul dönemi **[30 Ekim]**
- [ ] Belge ve kayıtları onaylar veya gerekçesiyle reddeder **[30 Ekim]**
- [ ] Öğrenciden ek belge veya bilgi ister; istek ve yanıt izlenir
- [ ] Öğrenci kartına öğrencinin göremediği özel not ekler
- [ ] Kuralları ve sistem ayarlarını girer ve günceller
- [ ] Kaydı gerekçesiyle düzeltir veya iptal eder
- [ ] Mezuniyet, sertifika ve kayıt silme kararını verir

**Öğrenci**
- [ ] İmzalı formları taratıp yükler **[30 Ekim]**
- [ ] Alacağı dersleri katalogdan seçer veya kodla arar. Serbest metin girilemez; katalog dışı ders için talep gönderir **[30 Ekim]**
- [ ] Her dönem aldığı dersleri girer
- [ ] Dönem sonunda notlarını girer ve transkript yükler. Transkript yüklenmeden notlar onaya gönderilemez
- [ ] Koordinatörle mesajlaşır
- [ ] Kendi durumunu görür: geçtiği ve kalan dersler, onay bekleyen işlemler **[30 Ekim]**

**Onay ve ders takibi**
- [ ] Girilen kayıt "onay bekliyor" durumunda başlar ve onaylanınca kilitlenir. Düzeltmeyi yalnız koordinatör yapar ve düzeltme kaydedilir **[30 Ekim]**
- [ ] Her ders için alındığı ve geçildiği dönem, not ve durum görülür. Her deneme ayrı tutulur
- [ ] Tamamlanan ve kalan dersler AKTS ile tek bakışta görülür **[30 Ekim]**
- [ ] Koordinatör öğrencinin ders listesine ders ekler veya çıkarır; gerekçe ve tarih kaydedilir. Geçilmiş dersler etkilenmez
- [ ] Koordinatör ders kataloğunu düzenler: ekleme, güncelleme, pasife alma **[30 Ekim]**

**Belgeler, mesajlar, denetim**
- [ ] Belge arşivinde tür ve durum (bekliyor, onaylandı, reddedildi) tutulur. Eski sürümler kalır; öğrenci belge silemez **[30 Ekim]**
- [ ] Dosya kontrolü: tür, boyut, bozuk veya zararlı dosya. Öğrenci yalnız kendi kartına yükler ve yalnız kendi belgelerini görür **[30 Ekim]**
- [ ] Mesajlar kalıcıdır, ek alır ve bildirim gönderir
- [ ] İşlem kaydı tutulur: kim, ne zaman, ne, eski ve yeni değer. Değiştirilemez; bölüm başkanı görebilir **[30 Ekim: temel hali]**
- [ ] Hiçbir veri fiziksel olarak silinmez ("iptal")

**Kurallar, mevcut öğrenciler, güvenlik**
- [ ] Sayısal kurallar ayarlardadır ve sürümlüdür; geçmiş kontroller yeniden yazılmaz
- [ ] Uyarılar koordinatöre ve öğrenciye gider. Yalnız onaylı kayıtlar hesaplanır; uyarı karar değildir
- [ ] Anadal GANO'yu yalnız koordinatör girer ve kaynağını yazar
- [ ] Geçmiş dönem verisi onay kilidine takılmadan girilir
- [ ] Yalnız sentetik veri kullanılır; sızma testleri yapılır ve tasarım açıklamasında kısaca raporlanır

## 3. Kural parametreleri (önerilen ayar adları ve varsayılanlar)
| Ayar | Varsayılan | Dayanak |
| --- | --- | --- |
| cap.anadal_gano_esik | 2,72 | ÇAP Md. 9/1-e, 8/1-c |
| cap.anadal_gano_alt_sinir | 2,50 | ÇAP Md. 9/1-e (bkz. §7) |
| cap.ders_almama_donem | 2 | ÇAP Md. 9/1-d |
| cap.azami_sure_yil_4yillik | 7 | ÇAP Md. 8/1-d; 2547/44-c |
| cap.azami_sure_uyari_donem | 2 (son iki dönem) | Tasarım kararı |
| ydp.min_akts | 30 | YDP Md. 5/1-g |
| ydp.min_ders | 6 | YDP Md. 5/1-g |
| ydp.anadal_gano_esik | 2,30 | YDP Md. 7/5 |
| ydp.gano_esik | 2,00 | YDP Md. 7/6, 7/8 |
| ydp.gano_esik_donem | 2 | YDP Md. 7/6 |
| ydp.ders_almama_donem | 2 | YDP Md. 7/4 |
| ydp.ek_sure_yariyil | 2 | YDP Md. 7/9 |
| not.harf_katsayilari | AA, BA, BB, CB, CC, DC, DD, FD, FF → katsayı (onaylanacak) | Sınav Yönetmeliği |
| not.tekrar_gecerli_deneme | son deneme (onaylanacak) | Sınav Yönetmeliği |
| not.ortalama_agirlik | AKTS | Tasarım kararı |
| dosya.izinli_turler / dosya.max_mb | PDF, JPG, PNG / 10 | Tasarım kararı |

Her ayar değişikliği yeni bir sürüm satırı olarak eklenir (geçerlilik başlangıcıyla). Her uyarı, hesaplandığı sürümün kimliğini saklar.

## 4. Uygulama notları
- **Silme yok:** tablolarda `durum` alanı vardır; silme yerine `iptal` yazılır. Fiziksel DELETE yalnız test verisi için kullanılır.
- **İşlem kaydı:** yalnız INSERT yapılır. Uygulama veritabanı kullanıcısından UPDATE ve DELETE yetkisi kaldırılır; ya da bir trigger engeller. Kayıtta kim, ne zaman, varlık, kimlik, eski ve yeni değer (JSON) tutulur.
- **Onay kilidi:** `onay_durumu = onaylandi` olan kayıtta öğrencinin yazma isteği reddedilir. Koordinatörün düzeltmesi işlem kaydına yazılır.
- **Geçmiş aktarım:** `kaynak = gecmis_aktarim` olan kayıtlar doğrudan onaylı başlar. Yalnız koordinatör girebilir.
- **Ders denemesi:** her alış ayrı satırdır. Ders planı satırı "alınacak ders"tir, deneme ise "alış"tır.
- **Belge sürümü:** yeni yükleme yeni satır açar (`onceki_surum_id`). Eskisi silinmez.
- **Dosya güvenliği:** uzantı değil dosya imzası (magic number) kontrol edilir. Dosya rastgele adla, web kökü dışında saklanır. İndirme yetki kontrolünden geçer.
- **Yetki:** her uçta rol ve sahiplik kontrolü yapılır. Bölüm başkanının yazma uçlarına erişimi yoktur. Kimlikler UUID'dir.
- **Kod ve veritabanı adları Türkçedir.** Kodda camelCase (`Ogrenci.ogrenciNo`), veritabanında snake_case (`ogrenci.ogrenci_no`).
- **Veritabanı dili:** `cap_otomasyonu` ICU `tr-TR` ile oluşturulur (`LOCALE_PROVIDER icu ICU_LOCALE 'tr-TR'`). Türkçe sıralama (C < Ç < I < İ) ve büyük/küçük harf (i → İ, I → ı) doğru çalışır.
- **Veritabanı kuralları** (`migrations/*_veritabani_kurallari`): uygulama hatalı olsa bile veritabanı reddeder.
  - Tüm tablolarda DELETE ve TRUNCATE yasak. Yeni tabloya da bu tetikleyiciler eklenmelidir.
  - `islem_kaydi`, `kural_ayari`, `uyari_ayari` yalnız eklenir.
  - Onay geçişleri: ONAY_BEKLIYOR → ONAYLANDI/REDDEDILDI/IPTAL, ONAYLANDI → IPTAL. Reddedilen ve iptal edilen kayıt değişmez. Ret ve iptal gerekçe ister.
  - Öğrenci yalnız kendi kartına, onay bekliyor durumunda kayıt ekler. Geçmiş aktarımı yalnız koordinatör yapar ve kayıt onaylı başlar.
  - Rol kontrolü: GANO, karar, not, ayar, onay ve izin kayıtlarını yalnız koordinatör yazar. Bölüm başkanı hiçbir kaydın sahibi olamaz.
  - S2: öğrencinin notu transkript belgesine bağlanmadan kaydedilemez.
  - Belgenin dosyası, mesajın metni ve uyarının içeriği değişmez.
  - Geçilmiş veya muaf ders listeden çıkarılamaz (e-posta: "geçilmiş dersler ve notlar etkilenmemeli").
  - Anadal mezuniyet dönemi `ogrenci.anadal_mezuniyet_donem_id` alanındadır (Ç6, Y5, Y6).
  - Kısmi tekil indeksler: aynı ders etkin planda bir kez; dönem başına tek GANO ve tek izin; tür başına tek geçerli karar.
  - Testler: `server/tests/veritabani.test.js` (her deneme geri alınan bir transaction içinde).
- **Oturum (planlanan; ilk sürümü commit `db5da49`'da):** 2 saatlik JWT, httpOnly + SameSite=Strict çerezde. 5 hatalı denemede hesap 15 dk kilitlenir; IP başına 15 dk'da 20 giriş denemesi. CSRF: double-submit jeton (`csrf` çerezi + `X-CSRF-Token` başlığı).
- **Bilinen bağımlılık uyarısı:** `npm audit`, Prisma 6'nın yapılandırma paketindeki `deepmerge-ts` için yüksek seviye uyarı verir. Yalnız bizim yazdığımız yapılandırmayı işler, dışarıdan girdi almaz. Prisma 7'ye geçişte giderilecek; güvenlik raporuna eklenecek.
- **Windows kurulum notu:** Sistem dili Türkçe olunca PostgreSQL kurulum programının `initdb` adımı başarısız olur. Çözüm: sunucuyu `initdb --locale=C --encoding=UTF8` ile elle başlatıp `pg_ctl register` ile servis olarak kaydetmek; Türkçe dil desteği veritabanı düzeyinde ICU `tr-TR` ile verilir.

## 5. Örnek veri: EEM → BM protokolü (135 AKTS)
| Ders Kodu | AKTS | Ders Adı | Özel şart |
| --- | --- | --- | --- |
| 3301156 | 4 | Bilgisayar Mühendisliğine Giriş | |
| 3301351 | 4 | Nesneye Yönelik Prog. Dili | |
| 3301352 | 4 | İşletim Sistemleri | |
| 3301354 | 4 | Veri Yapıları ve Uygulamaları | 1 |
| 3301452 | 4 | Programlama Dili-2 | |
| 3301454 | 5 | Veri Tabanı Yönetim Sistemleri | |
| 3301455 | 4 | Yazılım Mühendisliği | |
| 3301456 | 4 | Mobil Programlama | |
| 3301552 | 5 | Programlama Dili-3 | |
| 3301553 | 5 | Veri Haberleşmesi ve Ağlar | |
| — | 4 | 5. Yarıyıl Teknik Seçmeli | 2 |
| — | 4 | 5. Yarıyıl Teknik Seçmeli | 3 |
| — | 4 | 5. Yarıyıl Teknik Seçmeli | |
| 3301651 | 4 | Yapay Zeka | 4 |
| 3301652 | 4 | Otomata Teorisi ve Biçimsel Diller | |
| 3301653 | 4 | Görüntü İşleme | 5 |
| 3301654 | 6 | Mühendislik Tasarımı | |
| — | 4 | 6. Yarıyıl Teknik Seçmeli | 6 |
| — | 4 | 6. Yarıyıl Teknik Seçmeli | 7 |
| — | 4 | 6. Yarıyıl Teknik Seçmeli | |
| 3301751 | 4 | Bilgisayar Mühendisliği Uygulamaları | |
| 3301752 | 4 | Bilgisayar Mimarisi ve Organizasyonu | |
| 3301753 | 4 | Veri Bilimi | |
| — | 4 | 7. Yarıyıl Teknik Seçmeli | 8 |
| — | 4 | 7. Yarıyıl Teknik Seçmeli | |
| 3301851 | 20 | İşletmede Mesleki Eğitim | |
| 3301852 | 5 | Staj 1 | |
| 3301853 | 5 | Staj 2 | |

Toplam: 17 zorunlu ders 73 AKTS, 8 seçmeli yuvası 32 AKTS, İME ve staj 30 AKTS, toplam 135 AKTS. Her iki bölümde ortak olan dersler protokolde yer almaz.

**Özel şartlar.** EEM'de alınan ders başarılırsa BM'deki ders muaf sayılır:
1. 3302458 Veri Yapıları (4. yy TS) → 3301354 Veri Yapıları ve Uygulamaları
2. 3302758 Sayısal Sinyal İşleme (7. yy TS) → 3301561 Sinyal İşleme (5. yy TS)
3. 3302459 Mühendislik Veri Madenciliği (4. yy TS) → 3301568 Veri Madenciliği (5. yy TS)
4. 3302561 Makine Öğrenmesi ve Yapay Zekâ (5. yy TS) → 3301651 Yapay Zeka
5. 3302659 Görüntü İşleme (6. yy TS) → 3301653 Görüntü İşleme
6. 3302656 Gömülü Sistemler (6. yy TS) → 3301663 Gömülü Sistemler (6. yy TS)
7. 3302563 Robotik Sistemlere Giriş (5. yy TS) → 3301665 Robotik (6. yy TS)
8. 3302556 Veri İletişim Teknikleri (5. yy TS) → 3301770 Veri İletişim Teknikleri (7. yy TS)

Muafiyet sistemde, koordinatörün onayladığı Özel Şartlı Derslerin Muafiyeti Formu ile işaretlenir; ana dal dersleri sistemde takip edilmez.

Ders kodu yapısı (gözlem): 3301 = BM, 3302 = EEM. 5. hane yarıyılı gösterir; örneğin 3301**3**51 3. yarıyıl dersidir.

Bölüm sayfasında bir de Makine → BM protokolü var, ama dosyasına erişilemedi. Örnek veride yalnız EEM → BM kullanılır; öğrenci ve not verisi sentetiktir.

## 6. Akademik takvim 2026–2027 (Güz)
- Dersler: 14 Eylül – 25 Aralık 2026
- **İlk ara demo: 30 Ekim 2026 Cuma (kodla birlikte, bilgisayarda sunum)**
- Ara sınavlar (vize): 31 Ekim – 8 Kasım 2026
- Final sınavları: 26 Aralık 2026 – 3 Ocak 2027
- Bütünleme: 9 – 17 Ocak 2027

## 7. Belirsizlikler ve kullanılan varsayımlar
- **Md. 9/1-e ifadesi:** Yönerge "bir defaya mahsus 2,50'nin altına düşebilir" der; YÖK Yönetmeliği "65'e kadar" der (65 = 2,50; 2,72 = 70,13). Varsayılan: Yönetmelik yorumu, yani ilk düşüşte 2,50'nin altı kayıt silme uyarısıdır.
- **Muafiyet formu** form setinde yok; sistemde belge türü olarak tanımlanır.
- **ÇAP öğrenci no:** benzersiz anahtar anadal öğrenci numarasıdır; ÇAP numarası ek alandır.
- **Harf notu katsayıları ve tekrar kuralı** Sınav Yönetmeliği'ne bağlıdır. Ayardan girilir, koordinatöre teyit ettirilir.
- **Özel notlar:** e-posta "öğrenci görmez" diyor. Bölüm başkanı için açık değil; varsayılan olarak notları yalnız koordinatör görür.
- **YDP izinli öğrenci (YDP Md. 7/2):** Ana dalda izinli (mazeretli) sayılan öğrenci yan dalda da izinli sayılır. Taslakta ÇAP için Ç4 var, YDP için karşılığı yok. Uygulamada Ç4 mantığı YDP'ye de uygulanır: izinli dönemler Y4 (iki dönem ders almama) hesabına girmez.
- **Seçmeli ders türleri:** Bologna sayfası seçmelileri ayırmaz. Örnek veride 4. yarıyıl seçmelileri ve 7. yarıyılın 2 AKTS'lik seçmelileri `SOSYAL_SECMELI`, diğerleri `TEKNIK_SECMELI` sayıldı (protokoldeki "Teknik Seçmeli" yuvalarını bunlar doldurur). Koordinatöre teyit ettirilecek. Bologna sayfasında ulusal kredi yok; alan boş bırakıldı.
- **BM yan dal ders listesi (YDP Md. 5/1-g):** Bölüm en az 60 AKTS'lik yan dal ders listesi ilan eder; öğrenci bu listeden en az 30 AKTS ve 6 ders seçer. Bu liste elimizdeki belgelerde yok. Demo için YDP öğrencisi genel BM kataloğundan seçer; liste koordinatörden istenecek.

## 8. Rehberdeki eski madde numaraları
Rehber (Şubat 2025) eski yönergeye atıf yapar. Güncel karşılıkları:

| Rehberdeki numara | 2026 yönergesindeki numara |
| --- | --- |
| Md. 4/b | Md. 5/1-b |
| Md. 4/d | Md. 5/1-d |
| Md. 4/e | Md. 5/1-f |
| Md. 4/g | Md. 5/1-ğ |
| Md. 4/ı | Md. 5/1-i |
| Md. 8/d | Md. 9/1-d |
| Md. 8/ı | Md. 9/1-e |
