-- =====================================================================
-- Veritabanı kuralları
-- Prisma şemasının ifade edemediği kısıtlar. Kaynak: koordinatör e-postası,
-- docs/TASLAK.md ve docs/PROJE-NOTLARI.md. Yönerge sayıları (eşikler, süreler)
-- burada DEĞİL, kural_ayari tablosundadır.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. CHECK kısıtları: alan değerleri
-- ---------------------------------------------------------------------

ALTER TABLE kullanici
  ADD CONSTRAINT kullanici_eposta_bicimi CHECK (eposta ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND eposta !~ '[A-Z]'),
  ADD CONSTRAINT kullanici_hatali_giris CHECK (hatali_giris_sayisi >= 0);

ALTER TABLE sifre_baglantisi
  ADD CONSTRAINT sifre_baglantisi_ozet CHECK (token_ozeti ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT sifre_baglantisi_sure CHECK (son_gecerlilik > olusturma);

ALTER TABLE bolum
  ADD CONSTRAINT bolum_kod CHECK (kod ~ '^[A-Z]{2,10}$');

ALTER TABLE donem
  ADD CONSTRAINT donem_akademik_yil CHECK (
    akademik_yil ~ '^[0-9]{4}-[0-9]{4}$'
    AND split_part(akademik_yil, '-', 2)::int = split_part(akademik_yil, '-', 1)::int + 1),
  ADD CONSTRAINT donem_tarihler CHECK (baslangic IS NULL OR bitis IS NULL OR bitis > baslangic);

ALTER TABLE ders
  ADD CONSTRAINT ders_kod CHECK (kod ~ '^[0-9A-Z]{3,12}$'),
  ADD CONSTRAINT ders_ad CHECK (length(trim(ad)) > 0),
  ADD CONSTRAINT ders_akts CHECK (akts BETWEEN 1 AND 30),
  ADD CONSTRAINT ders_ulusal_kredi CHECK (ulusal_kredi IS NULL OR ulusal_kredi >= 0),
  ADD CONSTRAINT ders_yariyil CHECK (yariyil BETWEEN 1 AND 8);

-- ÇAP protokolü bir anadal bölümüne bağlıdır; YDP ders listesi bölümden bağımsız olabilir.
ALTER TABLE protokol
  ADD CONSTRAINT protokol_bolum CHECK (program_turu = 'YDP' OR bolum_id IS NOT NULL);

-- Satır ya belirli bir derstir ya da seçmeli yuvasıdır; ikisi birden olamaz.
ALTER TABLE protokol_satiri
  ADD CONSTRAINT protokol_satiri_ders_veya_yuva CHECK (
    (ders_id IS NOT NULL AND yuva_adi IS NULL AND yuva_ders_turu IS NULL)
    OR (ders_id IS NULL AND yuva_adi IS NOT NULL AND yuva_ders_turu IS NOT NULL)),
  ADD CONSTRAINT protokol_satiri_sira CHECK (sira > 0),
  ADD CONSTRAINT protokol_satiri_akts CHECK (akts > 0),
  ADD CONSTRAINT protokol_satiri_yariyil CHECK (yariyil BETWEEN 1 AND 8),
  ADD CONSTRAINT protokol_satiri_ozel_sart CHECK (ozel_sart_no IS NULL OR ozel_sart_no > 0);

ALTER TABLE ozel_sart
  ADD CONSTRAINT ozel_sart_no CHECK (no > 0);

ALTER TABLE ogrenci
  ADD CONSTRAINT ogrenci_no_bicimi CHECK (ogrenci_no ~ '^[0-9]{6,12}$'),
  ADD CONSTRAINT ogrenci_ad_soyad CHECK (length(trim(ad_soyad)) >= 3),
  ADD CONSTRAINT ogrenci_eposta_bicimi CHECK (eposta ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND eposta !~ '[A-Z]');

ALTER TABLE izinli_donem
  ADD CONSTRAINT izinli_donem_iptal CHECK (NOT iptal OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL));

-- GANO 4'lük sistemdedir; "diğer" kaynakta açıklama zorunludur.
ALTER TABLE anadal_gano_kaydi
  ADD CONSTRAINT anadal_gano_deger CHECK (deger BETWEEN 0 AND 4),
  ADD CONSTRAINT anadal_gano_kaynak_aciklama CHECK (kaynak <> 'DIGER' OR kaynak_aciklama IS NOT NULL),
  ADD CONSTRAINT anadal_gano_iptal CHECK (NOT iptal OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL));

-- Ders planı
ALTER TABLE plan_dersi
  ADD CONSTRAINT plan_dersi_red_gerekcesi CHECK (onay_durumu <> 'REDDEDILDI' OR red_gerekcesi IS NOT NULL),
  ADD CONSTRAINT plan_dersi_iptal CHECK (onay_durumu <> 'IPTAL' OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL)),
  ADD CONSTRAINT plan_dersi_onay_tarihi CHECK (onay_durumu <> 'ONAYLANDI' OR onay_tarihi IS NOT NULL),
  -- Koordinatör ders eklerse gerekçe yazar; ders çıkarılırsa gerekçe ve tarih yazılır.
  ADD CONSTRAINT plan_dersi_ekleme_gerekcesi CHECK (kaynak <> 'KOORDINATOR' OR ekleme_gerekcesi IS NOT NULL),
  ADD CONSTRAINT plan_dersi_cikarma CHECK (durum <> 'CIKARILDI' OR (cikarma_gerekcesi IS NOT NULL AND cikarma_tarihi IS NOT NULL)),
  -- Muafiyet, koordinatörün onayladığı muafiyet formuna dayanır (geçmiş aktarım hariç).
  ADD CONSTRAINT plan_dersi_muafiyet CHECK (durum <> 'MUAF' OR muafiyet_belge_id IS NOT NULL OR kaynak IN ('GECMIS_AKTARIM', 'CSV_AKTARIM')),
  -- Geçmiş dönem aktarımı onay kuyruğuna girmez: doğrudan onaylıdır.
  ADD CONSTRAINT plan_dersi_gecmis_aktarim CHECK (kaynak <> 'GECMIS_AKTARIM' OR onay_durumu IN ('ONAYLANDI', 'IPTAL'));

-- Ders denemesi (her alış ayrı satır)
ALTER TABLE ders_denemesi
  ADD CONSTRAINT ders_denemesi_sonuc CHECK (sonuc IN ('ALINDI', 'GECTI', 'KALDI')),
  ADD CONSTRAINT ders_denemesi_gecilen_donem CHECK ((sonuc = 'GECTI') = (gecilen_donem_id IS NOT NULL)),
  ADD CONSTRAINT ders_denemesi_not_zorunlu CHECK (sonuc = 'ALINDI' OR harf_notu IS NOT NULL),
  -- Geçerli harf listesi kural ayarındadır (not.harf_katsayilari); burada yalnız biçim denetlenir.
  ADD CONSTRAINT ders_denemesi_harf_bicimi CHECK (harf_notu IS NULL OR harf_notu ~ '^[A-Z]{1,3}$'),
  -- S2: öğrencinin girdiği not, ÇAP/YDP transkripti olmadan kaydedilemez.
  ADD CONSTRAINT ders_denemesi_transkript CHECK (kaynak <> 'OGRENCI' OR harf_notu IS NULL OR transkript_belge_id IS NOT NULL),
  ADD CONSTRAINT ders_denemesi_red_gerekcesi CHECK (onay_durumu <> 'REDDEDILDI' OR red_gerekcesi IS NOT NULL),
  ADD CONSTRAINT ders_denemesi_iptal CHECK (onay_durumu <> 'IPTAL' OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL)),
  ADD CONSTRAINT ders_denemesi_onay_tarihi CHECK (onay_durumu <> 'ONAYLANDI' OR onay_tarihi IS NOT NULL),
  ADD CONSTRAINT ders_denemesi_gecmis_aktarim CHECK (kaynak <> 'GECMIS_AKTARIM' OR onay_durumu IN ('ONAYLANDI', 'IPTAL'));

ALTER TABLE katalog_disi_ders_talebi
  ADD CONSTRAINT ders_talebi_akts CHECK (akts IS NULL OR akts BETWEEN 1 AND 30),
  ADD CONSTRAINT ders_talebi_ad CHECK (length(trim(ders_adi)) > 0),
  ADD CONSTRAINT ders_talebi_yanit CHECK (
    durum IN ('BEKLIYOR', 'IPTAL')
    OR (yanit IS NOT NULL AND yanitlayan_id IS NOT NULL AND yanit_tarihi IS NOT NULL)),
  ADD CONSTRAINT ders_talebi_kabul CHECK (durum <> 'KABUL_EDILDI' OR eklenen_ders_id IS NOT NULL);

-- Belge
ALTER TABLE belge
  ADD CONSTRAINT belge_boyut CHECK (boyut > 0),
  ADD CONSTRAINT belge_sha256 CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT belge_mime_bicimi CHECK (mime_turu ~ '^[a-z]+/[a-z0-9.+-]+$'),
  ADD CONSTRAINT belge_surum CHECK (surum_no >= 1 AND (surum_no = 1) = (onceki_surum_id IS NULL)),
  ADD CONSTRAINT belge_kendi_surumu_degil CHECK (onceki_surum_id IS NULL OR onceki_surum_id <> id),
  ADD CONSTRAINT belge_transkript_donemi CHECK (tur NOT IN ('CAP_YDP_TRANSKRIPTI', 'ANADAL_TRANSKRIPTI') OR donem_id IS NOT NULL),
  ADD CONSTRAINT belge_red_gerekcesi CHECK (onay_durumu <> 'REDDEDILDI' OR red_gerekcesi IS NOT NULL),
  ADD CONSTRAINT belge_iptal CHECK (onay_durumu <> 'IPTAL' OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL)),
  ADD CONSTRAINT belge_onay_tarihi CHECK (onay_durumu <> 'ONAYLANDI' OR onay_tarihi IS NOT NULL);

ALTER TABLE belge_talebi
  ADD CONSTRAINT belge_talebi_aciklama CHECK (length(trim(aciklama)) > 0),
  ADD CONSTRAINT belge_talebi_kapanis CHECK (durum IN ('BEKLIYOR', 'YUKLENDI') OR kapanis IS NOT NULL);

ALTER TABLE yazisma
  ADD CONSTRAINT yazisma_konu CHECK (length(trim(konu)) > 0);

ALTER TABLE mesaj
  ADD CONSTRAINT mesaj_metin CHECK (length(trim(metin)) > 0 AND length(metin) <= 10000),
  ADD CONSTRAINT mesaj_okunma CHECK (okunma_zamani IS NULL OR okunma_zamani >= olusturma);

ALTER TABLE koordinator_notu
  ADD CONSTRAINT koordinator_notu_metin CHECK (length(trim(metin)) > 0),
  ADD CONSTRAINT koordinator_notu_iptal CHECK (NOT iptal OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL));

ALTER TABLE kural_ayari
  ADD CONSTRAINT kural_ayari_anahtar CHECK (anahtar ~ '^[a-z]+(\.[a-z0-9_]+)+$'),
  ADD CONSTRAINT kural_ayari_aciklama CHECK (length(trim(aciklama)) > 0);

ALTER TABLE uyari
  ADD CONSTRAINT uyari_kural_kodu CHECK (kural_kodu ~ '^[ÇYS][0-9]{1,2}$'),
  ADD CONSTRAINT uyari_kapanis CHECK ((durum = 'KAPATILDI') = (kapanis IS NOT NULL AND kapatan_id IS NOT NULL));

ALTER TABLE karar
  ADD CONSTRAINT karar_gerekce CHECK (length(trim(gerekce)) > 0),
  ADD CONSTRAINT karar_iptal CHECK (NOT iptal OR (iptal_gerekcesi IS NOT NULL AND iptal_tarihi IS NOT NULL));

ALTER TABLE islem_kaydi
  ADD CONSTRAINT islem_kaydi_eylem CHECK (length(trim(eylem)) > 0);


-- ---------------------------------------------------------------------
-- 2. Kısmi tekil indeksler: "etkin" kayıtlar arasında tekrar olmaz
--    (iptal, ret ve çıkarılan kayıtlar arşivde kalır, tekrar sayılmaz)
-- ---------------------------------------------------------------------

-- Bir ders, öğrencinin etkin planında bir kez bulunur.
CREATE UNIQUE INDEX plan_dersi_etkin_tekil ON plan_dersi (ogrenci_id, ders_id)
  WHERE onay_durumu IN ('ONAY_BEKLIYOR', 'ONAYLANDI') AND durum <> 'CIKARILDI';

-- Bir protokol satırını (seçmeli yuvasını) etkin planda tek ders karşılar.
CREATE UNIQUE INDEX plan_dersi_yuva_tekil ON plan_dersi (ogrenci_id, protokol_satiri_id)
  WHERE protokol_satiri_id IS NOT NULL AND onay_durumu IN ('ONAY_BEKLIYOR', 'ONAYLANDI') AND durum <> 'CIKARILDI';

-- Bir ders aynı dönemde bir kez alınır.
CREATE UNIQUE INDEX ders_denemesi_donem_tekil ON ders_denemesi (plan_dersi_id, alinan_donem_id)
  WHERE onay_durumu IN ('ONAY_BEKLIYOR', 'ONAYLANDI');

-- Her dönem için tek geçerli anadal GANO'su ve tek izin kaydı
CREATE UNIQUE INDEX anadal_gano_donem_tekil ON anadal_gano_kaydi (ogrenci_id, donem_id) WHERE NOT iptal;
CREATE UNIQUE INDEX izinli_donem_tekil ON izinli_donem (ogrenci_id, donem_id) WHERE NOT iptal;

-- Bir öğrenci için her türden tek geçerli karar
CREATE UNIQUE INDEX karar_tur_tekil ON karar (ogrenci_id, tur) WHERE NOT iptal;


-- ---------------------------------------------------------------------
-- 3. Fiziksel silme yok: tüm tablolarda DELETE ve TRUNCATE engellenir
-- ---------------------------------------------------------------------

CREATE FUNCTION silme_engeli() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% tablosunda kayıt silinemez; kaydı iptal olarak işaretleyin', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION silme_engeli()', t || '_silme_engeli', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION silme_engeli()', t || '_bosaltma_engeli', t);
  END LOOP;
END $$;
-- NOT: Sonraki migration'larda eklenen her yeni tabloya bu iki tetikleyici de eklenmelidir.


-- ---------------------------------------------------------------------
-- 4. Yalnız eklenen tablolar: işlem kaydı ve kural ayarı sürümleri
-- ---------------------------------------------------------------------

CREATE FUNCTION guncelleme_engeli() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% tablosundaki kayıtlar değiştirilemez; yeni kayıt ekleyin', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER islem_kaydi_guncelleme_engeli BEFORE UPDATE ON islem_kaydi
  FOR EACH ROW EXECUTE FUNCTION guncelleme_engeli();
CREATE TRIGGER kural_ayari_guncelleme_engeli BEFORE UPDATE ON kural_ayari
  FOR EACH ROW EXECUTE FUNCTION guncelleme_engeli();
CREATE TRIGGER uyari_ayari_guncelleme_engeli BEFORE UPDATE ON uyari_ayari
  FOR EACH ROW EXECUTE FUNCTION guncelleme_engeli();


-- ---------------------------------------------------------------------
-- 5. Rol kontrolü: bir alana yalnız belirli roldeki kullanıcı yazılabilir
--    Kullanım: rol_kontrol('<kolon>', '<ROL>', ['<ROL>' ...])
-- ---------------------------------------------------------------------

CREATE FUNCTION rol_kontrol() RETURNS trigger AS $$
DECLARE
  kullanici_id uuid := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
  kullanici_rol rol;
BEGIN
  IF kullanici_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT k.rol INTO kullanici_rol FROM kullanici k WHERE k.id = kullanici_id;
  IF NOT (kullanici_rol::text = ANY (TG_ARGV[1:])) THEN
    RAISE EXCEPTION '%.% alanına % rolündeki kullanıcı yazılamaz', TG_TABLE_NAME, TG_ARGV[0], kullanici_rol
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Öğrenci kaydı yalnız öğrenci hesabına bağlanır.
CREATE TRIGGER ogrenci_kullanici_rol BEFORE INSERT OR UPDATE OF kullanici_id ON ogrenci
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('kullanici_id', 'OGRENCI');

-- Yalnız koordinatörün yapabildiği işlemler
CREATE TRIGGER anadal_gano_giren_rol BEFORE INSERT OR UPDATE OF giren_id ON anadal_gano_kaydi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('giren_id', 'KOORDINATOR');
CREATE TRIGGER izinli_donem_giren_rol BEFORE INSERT OR UPDATE OF giren_id ON izinli_donem
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('giren_id', 'KOORDINATOR');
CREATE TRIGGER koordinator_notu_yazan_rol BEFORE INSERT OR UPDATE OF yazan_id ON koordinator_notu
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('yazan_id', 'KOORDINATOR');
CREATE TRIGGER kural_ayari_giren_rol BEFORE INSERT ON kural_ayari
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('giren_id', 'KOORDINATOR');
CREATE TRIGGER karar_veren_rol BEFORE INSERT OR UPDATE OF veren_id ON karar
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('veren_id', 'KOORDINATOR');
CREATE TRIGGER belge_talebi_isteyen_rol BEFORE INSERT OR UPDATE OF isteyen_id ON belge_talebi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('isteyen_id', 'KOORDINATOR');
CREATE TRIGGER ders_talebi_yanitlayan_rol BEFORE INSERT OR UPDATE OF yanitlayan_id ON katalog_disi_ders_talebi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('yanitlayan_id', 'KOORDINATOR');
CREATE TRIGGER uyari_kapatan_rol BEFORE INSERT OR UPDATE OF kapatan_id ON uyari
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('kapatan_id', 'KOORDINATOR');
CREATE TRIGGER plan_dersi_onaylayan_rol BEFORE INSERT OR UPDATE OF onaylayan_id ON plan_dersi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('onaylayan_id', 'KOORDINATOR');
CREATE TRIGGER ders_denemesi_onaylayan_rol BEFORE INSERT OR UPDATE OF onaylayan_id ON ders_denemesi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('onaylayan_id', 'KOORDINATOR');
CREATE TRIGGER belge_onaylayan_rol BEFORE INSERT OR UPDATE OF onaylayan_id ON belge
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('onaylayan_id', 'KOORDINATOR');

-- Bölüm başkanı salt okunurdur: hiçbir kaydın oluşturanı veya göndereni olamaz.
CREATE TRIGGER plan_dersi_olusturan_rol BEFORE INSERT ON plan_dersi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('olusturan_id', 'KOORDINATOR', 'OGRENCI');
CREATE TRIGGER ders_denemesi_olusturan_rol BEFORE INSERT ON ders_denemesi
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('olusturan_id', 'KOORDINATOR', 'OGRENCI');
CREATE TRIGGER belge_yukleyen_rol BEFORE INSERT ON belge
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('yukleyen_id', 'KOORDINATOR', 'OGRENCI');
CREATE TRIGGER mesaj_gonderen_rol BEFORE INSERT ON mesaj
  FOR EACH ROW EXECUTE FUNCTION rol_kontrol('gonderen_id', 'KOORDINATOR', 'OGRENCI');


-- ---------------------------------------------------------------------
-- 6. Onay mantığı (plan_dersi, ders_denemesi, belge)
--    - Öğrencinin girdiği kayıt ONAY_BEKLIYOR başlar ve yalnız kendi kartına yazılır.
--    - Koordinatör dışı kaynaklar (geçmiş aktarım, CSV) yalnız koordinatörce girilir.
--    - İzinli geçişler: ONAY_BEKLIYOR → ONAYLANDI | REDDEDILDI | IPTAL,  ONAYLANDI → IPTAL.
--      Onaylı kayıt düzeltilebilir (durumu ONAYLANDI kalır; düzeltme işlem kaydına yazılır).
--    - REDDEDILDI ve IPTAL kayıtlar arşivdir, değiştirilemez. Kaynak alanı değiştirilemez.
-- ---------------------------------------------------------------------

CREATE FUNCTION onay_kontrol() RETURNS trigger AS $$
DECLARE
  yazan_id uuid;
  yazan_rol rol;
  kayit_ogrenci_id uuid;
  yazan_ogrenci_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Kaydı oluşturan kullanıcı ve kaydın ait olduğu öğrenci
    IF TG_TABLE_NAME = 'plan_dersi' THEN
      yazan_id := NEW.olusturan_id;
      kayit_ogrenci_id := NEW.ogrenci_id;
    ELSIF TG_TABLE_NAME = 'ders_denemesi' THEN
      yazan_id := NEW.olusturan_id;
      SELECT p.ogrenci_id INTO kayit_ogrenci_id FROM plan_dersi p WHERE p.id = NEW.plan_dersi_id;
    ELSE -- belge
      yazan_id := NEW.yukleyen_id;
      kayit_ogrenci_id := NEW.ogrenci_id;
    END IF;
    SELECT k.rol INTO yazan_rol FROM kullanici k WHERE k.id = yazan_id;

    IF NEW.kaynak = 'OGRENCI' THEN
      IF yazan_rol <> 'OGRENCI' THEN
        RAISE EXCEPTION 'Kaynağı OGRENCI olan kaydı yalnız öğrenci oluşturabilir' USING ERRCODE = 'check_violation';
      END IF;
      SELECT o.id INTO yazan_ogrenci_id FROM ogrenci o WHERE o.kullanici_id = yazan_id;
      IF yazan_ogrenci_id IS DISTINCT FROM kayit_ogrenci_id THEN
        RAISE EXCEPTION 'Öğrenci yalnız kendi kartına kayıt ekleyebilir' USING ERRCODE = 'check_violation';
      END IF;
      IF NEW.onay_durumu <> 'ONAY_BEKLIYOR' THEN
        RAISE EXCEPTION 'Öğrencinin girdiği kayıt onay bekliyor durumunda başlar' USING ERRCODE = 'check_violation';
      END IF;
    ELSIF yazan_rol <> 'KOORDINATOR' THEN
      RAISE EXCEPTION 'Kaynağı % olan kaydı yalnız koordinatör oluşturabilir', NEW.kaynak USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.onay_durumu IN ('REDDEDILDI', 'IPTAL') THEN
    RAISE EXCEPTION '% durumundaki kayıt arşivdedir, değiştirilemez', OLD.onay_durumu USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.kaynak IS DISTINCT FROM OLD.kaynak THEN
    RAISE EXCEPTION 'Kaydın kaynağı değiştirilemez' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.onay_durumu <> OLD.onay_durumu AND NOT (
       (OLD.onay_durumu = 'ONAY_BEKLIYOR' AND NEW.onay_durumu IN ('ONAYLANDI', 'REDDEDILDI', 'IPTAL'))
    OR (OLD.onay_durumu = 'ONAYLANDI' AND NEW.onay_durumu = 'IPTAL')) THEN
    RAISE EXCEPTION 'Onay durumu % → % geçişine izin verilmez', OLD.onay_durumu, NEW.onay_durumu
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_dersi_onay BEFORE INSERT OR UPDATE ON plan_dersi
  FOR EACH ROW EXECUTE FUNCTION onay_kontrol();
CREATE TRIGGER ders_denemesi_onay BEFORE INSERT OR UPDATE ON ders_denemesi
  FOR EACH ROW EXECUTE FUNCTION onay_kontrol();
CREATE TRIGGER belge_onay BEFORE INSERT OR UPDATE ON belge
  FOR EACH ROW EXECUTE FUNCTION onay_kontrol();


-- ---------------------------------------------------------------------
-- 7. Değişmez alanlar
-- ---------------------------------------------------------------------

-- Belgenin dosyası değişmez: yeni dosya yeni sürüm satırıdır.
CREATE FUNCTION belge_dosya_degismez() RETURNS trigger AS $$
BEGIN
  IF (NEW.ogrenci_id, NEW.tur, NEW.orijinal_ad, NEW.depo_adi, NEW.mime_turu, NEW.boyut, NEW.sha256,
      NEW.surum_no, NEW.onceki_surum_id, NEW.yukleyen_id, NEW.olusturma)
     IS DISTINCT FROM
     (OLD.ogrenci_id, OLD.tur, OLD.orijinal_ad, OLD.depo_adi, OLD.mime_turu, OLD.boyut, OLD.sha256,
      OLD.surum_no, OLD.onceki_surum_id, OLD.yukleyen_id, OLD.olusturma) THEN
    RAISE EXCEPTION 'Belgenin dosya bilgileri değiştirilemez; yeni sürüm yükleyin' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER belge_dosya_degismez BEFORE UPDATE ON belge
  FOR EACH ROW EXECUTE FUNCTION belge_dosya_degismez();

-- Mesajlar kalıcıdır: yalnız okunma zamanı bir kez yazılır.
-- Gönderen, koordinatör ya da yazışmanın ait olduğu öğrencidir.
CREATE FUNCTION mesaj_kontrol() RETURNS trigger AS $$
DECLARE
  gonderen_rol rol;
  yazisma_ogrenci_kullanici uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT k.rol INTO gonderen_rol FROM kullanici k WHERE k.id = NEW.gonderen_id;
    IF gonderen_rol = 'OGRENCI' THEN
      SELECT o.kullanici_id INTO yazisma_ogrenci_kullanici
      FROM yazisma y JOIN ogrenci o ON o.id = y.ogrenci_id WHERE y.id = NEW.yazisma_id;
      IF yazisma_ogrenci_kullanici IS DISTINCT FROM NEW.gonderen_id THEN
        RAISE EXCEPTION 'Öğrenci yalnız kendi yazışmasına mesaj gönderebilir' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.okunma_zamani IS NOT NULL
     OR (NEW.yazisma_id, NEW.gonderen_id, NEW.metin, NEW.ek_belge_id, NEW.olusturma)
        IS DISTINCT FROM (OLD.yazisma_id, OLD.gonderen_id, OLD.metin, OLD.ek_belge_id, OLD.olusturma) THEN
    RAISE EXCEPTION 'Mesajlar kalıcıdır, değiştirilemez' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mesaj_kontrol BEFORE INSERT OR UPDATE ON mesaj
  FOR EACH ROW EXECUTE FUNCTION mesaj_kontrol();

-- Geçmiş kontroller yeniden yazılmaz: uyarının içeriği değişmez, yalnız bir kez kapatılır.
CREATE FUNCTION uyari_degismez() RETURNS trigger AS $$
BEGIN
  IF OLD.durum = 'KAPATILDI'
     OR (NEW.ogrenci_id, NEW.kural_kodu, NEW.mesaj, NEW.hesaplanan_deger, NEW.olusturma)
        IS DISTINCT FROM (OLD.ogrenci_id, OLD.kural_kodu, OLD.mesaj, OLD.hesaplanan_deger, OLD.olusturma) THEN
    RAISE EXCEPTION 'Uyarının içeriği değiştirilemez; yalnız açık uyarı kapatılabilir' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uyari_degismez BEFORE UPDATE ON uyari
  FOR EACH ROW EXECUTE FUNCTION uyari_degismez();
