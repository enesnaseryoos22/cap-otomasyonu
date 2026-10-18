-- CreateEnum
CREATE TYPE "rol" AS ENUM ('KOORDINATOR', 'OGRENCI', 'BOLUM_BASKANI');

-- CreateEnum
CREATE TYPE "program_turu" AS ENUM ('CAP', 'YDP');

-- CreateEnum
CREATE TYPE "ogrenci_durumu" AS ENUM ('AKTIF', 'DONDURULMUS', 'MEZUN', 'SERTIFIKA_ALDI', 'AYRILDI', 'KAYDI_SILINDI');

-- CreateEnum
CREATE TYPE "donem_turu" AS ENUM ('GUZ', 'BAHAR', 'YAZ');

-- CreateEnum
CREATE TYPE "ders_turu" AS ENUM ('ZORUNLU', 'TEKNIK_SECMELI', 'SOSYAL_SECMELI');

-- CreateEnum
CREATE TYPE "ders_durumu" AS ENUM ('PLANLANDI', 'ALINDI', 'GECTI', 'KALDI', 'MUAF', 'CIKARILDI');

-- CreateEnum
CREATE TYPE "onay_durumu" AS ENUM ('ONAY_BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "veri_kaynagi" AS ENUM ('OGRENCI', 'KOORDINATOR', 'GECMIS_AKTARIM', 'CSV_AKTARIM');

-- CreateEnum
CREATE TYPE "gano_kaynagi" AS ENUM ('TRANSKRIPT', 'OGRENCI_ISLERI', 'DIGER');

-- CreateEnum
CREATE TYPE "belge_turu" AS ENUM ('KABUL_VE_DERS_PROTOKOLU', 'DERS_KAYIT_FORMU', 'CAP_YDP_TRANSKRIPTI', 'ANADAL_TRANSKRIPTI', 'MUAFIYET_FORMU', 'YONETIM_KURULU_YAZISI', 'RESMI_YAZI', 'EK_BELGE', 'MESAJ_EKI');

-- CreateEnum
CREATE TYPE "belge_talebi_durumu" AS ENUM ('BEKLIYOR', 'YUKLENDI', 'ONAYLANDI', 'REDDEDILDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "ders_talebi_durumu" AS ENUM ('BEKLIYOR', 'KABUL_EDILDI', 'REDDEDILDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "izin_turu" AS ENUM ('KAYIT_DONDURMA', 'MAZERET');

-- CreateEnum
CREATE TYPE "uyari_durumu" AS ENUM ('ACIK', 'KAPATILDI');

-- CreateEnum
CREATE TYPE "karar_turu" AS ENUM ('MEZUNIYET', 'SERTIFIKA', 'KAYIT_SILME');

-- CreateEnum
CREATE TYPE "bildirim_turu" AS ENUM ('YENI_MESAJ', 'ONAY_SONUCU', 'BELGE_TALEBI', 'UYARI', 'KARAR');

-- CreateEnum
CREATE TYPE "sifre_baglantisi_turu" AS ENUM ('HESAP_ACMA', 'SIFRE_SIFIRLAMA');

-- CreateTable
CREATE TABLE "kullanici" (
    "id" UUID NOT NULL,
    "eposta" TEXT NOT NULL,
    "sifre_hash" TEXT,
    "rol" "rol" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "hatali_giris_sayisi" INTEGER NOT NULL DEFAULT 0,
    "kilitli_bitis" TIMESTAMPTZ(6),
    "son_giris" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kullanici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sifre_baglantisi" (
    "id" UUID NOT NULL,
    "kullanici_id" UUID NOT NULL,
    "token_ozeti" CHAR(64) NOT NULL,
    "tur" "sifre_baglantisi_turu" NOT NULL,
    "son_gecerlilik" TIMESTAMPTZ(6) NOT NULL,
    "kullanilma" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sifre_baglantisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bolum" (
    "id" UUID NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bolum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donem" (
    "id" UUID NOT NULL,
    "akademik_yil" TEXT NOT NULL,
    "tur" "donem_turu" NOT NULL,
    "baslangic" DATE,
    "bitis" DATE,

    CONSTRAINT "donem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ders" (
    "id" UUID NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "akts" INTEGER NOT NULL,
    "ulusal_kredi" INTEGER,
    "yariyil" INTEGER NOT NULL,
    "tur" "ders_turu" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protokol" (
    "id" UUID NOT NULL,
    "bolum_id" UUID,
    "program_turu" "program_turu" NOT NULL,
    "ad" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protokol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protokol_satiri" (
    "id" UUID NOT NULL,
    "protokol_id" UUID NOT NULL,
    "sira" INTEGER NOT NULL,
    "ders_id" UUID,
    "yuva_adi" TEXT,
    "yuva_ders_turu" "ders_turu",
    "yariyil" INTEGER NOT NULL,
    "akts" INTEGER NOT NULL,
    "ozel_sart_no" INTEGER,

    CONSTRAINT "protokol_satiri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ozel_sart" (
    "id" UUID NOT NULL,
    "protokol_id" UUID NOT NULL,
    "no" INTEGER NOT NULL,
    "anadal_ders_kodu" TEXT NOT NULL,
    "anadal_ders_adi" TEXT NOT NULL,
    "bm_ders_id" UUID NOT NULL,

    CONSTRAINT "ozel_sart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ogrenci" (
    "id" UUID NOT NULL,
    "ogrenci_no" TEXT NOT NULL,
    "ad_soyad" TEXT NOT NULL,
    "eposta" TEXT NOT NULL,
    "program_turu" "program_turu" NOT NULL,
    "anadal_bolum_id" UUID NOT NULL,
    "kabul_donem_id" UUID NOT NULL,
    "cap_ogrenci_no" TEXT,
    "durum" "ogrenci_durumu" NOT NULL DEFAULT 'AKTIF',
    "kaynak" "veri_kaynagi" NOT NULL DEFAULT 'KOORDINATOR',
    "kullanici_id" UUID,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ogrenci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "izinli_donem" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "donem_id" UUID NOT NULL,
    "tur" "izin_turu" NOT NULL,
    "aciklama" TEXT,
    "belge_id" UUID,
    "giren_id" UUID NOT NULL,
    "iptal" BOOLEAN NOT NULL DEFAULT false,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "izinli_donem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anadal_gano_kaydi" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "donem_id" UUID NOT NULL,
    "deger" DECIMAL(3,2) NOT NULL,
    "kaynak" "gano_kaynagi" NOT NULL,
    "kaynak_aciklama" TEXT,
    "giren_id" UUID NOT NULL,
    "iptal" BOOLEAN NOT NULL DEFAULT false,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anadal_gano_kaydi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_dersi" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "ders_id" UUID NOT NULL,
    "protokol_satiri_id" UUID,
    "durum" "ders_durumu" NOT NULL DEFAULT 'PLANLANDI',
    "onay_durumu" "onay_durumu" NOT NULL DEFAULT 'ONAY_BEKLIYOR',
    "kaynak" "veri_kaynagi" NOT NULL,
    "ekleme_gerekcesi" TEXT,
    "cikarma_gerekcesi" TEXT,
    "cikarma_tarihi" TIMESTAMPTZ(6),
    "muafiyet_belge_id" UUID,
    "red_gerekcesi" TEXT,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "olusturan_id" UUID NOT NULL,
    "onaylayan_id" UUID,
    "onay_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_dersi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ders_denemesi" (
    "id" UUID NOT NULL,
    "plan_dersi_id" UUID NOT NULL,
    "alinan_donem_id" UUID NOT NULL,
    "harf_notu" TEXT,
    "sonuc" "ders_durumu" NOT NULL DEFAULT 'ALINDI',
    "gecilen_donem_id" UUID,
    "transkript_belge_id" UUID,
    "onay_durumu" "onay_durumu" NOT NULL DEFAULT 'ONAY_BEKLIYOR',
    "kaynak" "veri_kaynagi" NOT NULL,
    "red_gerekcesi" TEXT,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "olusturan_id" UUID NOT NULL,
    "onaylayan_id" UUID,
    "onay_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ders_denemesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "katalog_disi_ders_talebi" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "ders_kodu" TEXT,
    "ders_adi" TEXT NOT NULL,
    "akts" INTEGER,
    "aciklama" TEXT NOT NULL,
    "durum" "ders_talebi_durumu" NOT NULL DEFAULT 'BEKLIYOR',
    "yanit" TEXT,
    "yanitlayan_id" UUID,
    "yanit_tarihi" TIMESTAMPTZ(6),
    "eklenen_ders_id" UUID,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "katalog_disi_ders_talebi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belge" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "tur" "belge_turu" NOT NULL,
    "donem_id" UUID,
    "belge_talebi_id" UUID,
    "orijinal_ad" TEXT NOT NULL,
    "depo_adi" TEXT NOT NULL,
    "mime_turu" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "surum_no" INTEGER NOT NULL DEFAULT 1,
    "onceki_surum_id" UUID,
    "onay_durumu" "onay_durumu" NOT NULL DEFAULT 'ONAY_BEKLIYOR',
    "kaynak" "veri_kaynagi" NOT NULL,
    "red_gerekcesi" TEXT,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "yukleyen_id" UUID NOT NULL,
    "onaylayan_id" UUID,
    "onay_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "belge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belge_talebi" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "isteyen_id" UUID NOT NULL,
    "aciklama" TEXT NOT NULL,
    "belge_turu" "belge_turu",
    "son_tarih" DATE,
    "durum" "belge_talebi_durumu" NOT NULL DEFAULT 'BEKLIYOR',
    "yanit" TEXT,
    "kapanis" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "belge_talebi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yazisma" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "konu" TEXT NOT NULL,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yazisma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesaj" (
    "id" UUID NOT NULL,
    "yazisma_id" UUID NOT NULL,
    "gonderen_id" UUID NOT NULL,
    "metin" TEXT NOT NULL,
    "ek_belge_id" UUID,
    "okunma_zamani" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mesaj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bildirim" (
    "id" UUID NOT NULL,
    "alici_id" UUID NOT NULL,
    "tur" "bildirim_turu" NOT NULL,
    "baslik" TEXT NOT NULL,
    "metin" TEXT NOT NULL,
    "varlik" TEXT,
    "varlik_id" TEXT,
    "okunma" TIMESTAMPTZ(6),
    "eposta_gonderildi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bildirim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koordinator_notu" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "yazan_id" UUID NOT NULL,
    "metin" TEXT NOT NULL,
    "iptal" BOOLEAN NOT NULL DEFAULT false,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "koordinator_notu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kural_ayari" (
    "id" UUID NOT NULL,
    "anahtar" TEXT NOT NULL,
    "deger" JSONB NOT NULL,
    "aciklama" TEXT NOT NULL,
    "dayanak" TEXT,
    "gecerlilik_baslangic" TIMESTAMPTZ(6) NOT NULL,
    "giren_id" UUID NOT NULL,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kural_ayari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uyari" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "kural_kodu" TEXT NOT NULL,
    "mesaj" TEXT NOT NULL,
    "hesaplanan_deger" JSONB,
    "durum" "uyari_durumu" NOT NULL DEFAULT 'ACIK',
    "kapatan_id" UUID,
    "kapatma_aciklamasi" TEXT,
    "kapanis" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uyari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uyari_ayari" (
    "uyari_id" UUID NOT NULL,
    "kural_ayari_id" UUID NOT NULL,

    CONSTRAINT "uyari_ayari_pkey" PRIMARY KEY ("uyari_id","kural_ayari_id")
);

-- CreateTable
CREATE TABLE "karar" (
    "id" UUID NOT NULL,
    "ogrenci_id" UUID NOT NULL,
    "tur" "karar_turu" NOT NULL,
    "gerekce" TEXT NOT NULL,
    "karar_tarihi" DATE NOT NULL,
    "uyari_id" UUID,
    "belge_id" UUID,
    "veren_id" UUID NOT NULL,
    "iptal" BOOLEAN NOT NULL DEFAULT false,
    "iptal_gerekcesi" TEXT,
    "iptal_tarihi" TIMESTAMPTZ(6),
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "karar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "islem_kaydi" (
    "id" UUID NOT NULL,
    "zaman" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kullanici_id" UUID,
    "eylem" TEXT NOT NULL,
    "varlik" TEXT,
    "varlik_id" TEXT,
    "eski_deger" JSONB,
    "yeni_deger" JSONB,
    "ip_adresi" TEXT,

    CONSTRAINT "islem_kaydi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kullanici_eposta_key" ON "kullanici"("eposta");

-- CreateIndex
CREATE UNIQUE INDEX "sifre_baglantisi_token_ozeti_key" ON "sifre_baglantisi"("token_ozeti");

-- CreateIndex
CREATE INDEX "sifre_baglantisi_kullanici_id_idx" ON "sifre_baglantisi"("kullanici_id");

-- CreateIndex
CREATE UNIQUE INDEX "bolum_kod_key" ON "bolum"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "donem_akademik_yil_tur_key" ON "donem"("akademik_yil", "tur");

-- CreateIndex
CREATE UNIQUE INDEX "ders_kod_key" ON "ders"("kod");

-- CreateIndex
CREATE INDEX "protokol_bolum_id_idx" ON "protokol"("bolum_id");

-- CreateIndex
CREATE INDEX "protokol_satiri_ders_id_idx" ON "protokol_satiri"("ders_id");

-- CreateIndex
CREATE UNIQUE INDEX "protokol_satiri_protokol_id_sira_key" ON "protokol_satiri"("protokol_id", "sira");

-- CreateIndex
CREATE INDEX "ozel_sart_bm_ders_id_idx" ON "ozel_sart"("bm_ders_id");

-- CreateIndex
CREATE UNIQUE INDEX "ozel_sart_protokol_id_no_key" ON "ozel_sart"("protokol_id", "no");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_ogrenci_no_key" ON "ogrenci"("ogrenci_no");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_eposta_key" ON "ogrenci"("eposta");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_cap_ogrenci_no_key" ON "ogrenci"("cap_ogrenci_no");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_kullanici_id_key" ON "ogrenci"("kullanici_id");

-- CreateIndex
CREATE INDEX "ogrenci_anadal_bolum_id_idx" ON "ogrenci"("anadal_bolum_id");

-- CreateIndex
CREATE INDEX "ogrenci_kabul_donem_id_idx" ON "ogrenci"("kabul_donem_id");

-- CreateIndex
CREATE INDEX "izinli_donem_ogrenci_id_idx" ON "izinli_donem"("ogrenci_id");

-- CreateIndex
CREATE INDEX "anadal_gano_kaydi_ogrenci_id_idx" ON "anadal_gano_kaydi"("ogrenci_id");

-- CreateIndex
CREATE INDEX "plan_dersi_ogrenci_id_idx" ON "plan_dersi"("ogrenci_id");

-- CreateIndex
CREATE INDEX "plan_dersi_ders_id_idx" ON "plan_dersi"("ders_id");

-- CreateIndex
CREATE INDEX "ders_denemesi_plan_dersi_id_idx" ON "ders_denemesi"("plan_dersi_id");

-- CreateIndex
CREATE INDEX "ders_denemesi_alinan_donem_id_idx" ON "ders_denemesi"("alinan_donem_id");

-- CreateIndex
CREATE INDEX "katalog_disi_ders_talebi_ogrenci_id_idx" ON "katalog_disi_ders_talebi"("ogrenci_id");

-- CreateIndex
CREATE UNIQUE INDEX "belge_depo_adi_key" ON "belge"("depo_adi");

-- CreateIndex
CREATE UNIQUE INDEX "belge_onceki_surum_id_key" ON "belge"("onceki_surum_id");

-- CreateIndex
CREATE INDEX "belge_ogrenci_id_tur_idx" ON "belge"("ogrenci_id", "tur");

-- CreateIndex
CREATE INDEX "belge_talebi_ogrenci_id_idx" ON "belge_talebi"("ogrenci_id");

-- CreateIndex
CREATE INDEX "yazisma_ogrenci_id_idx" ON "yazisma"("ogrenci_id");

-- CreateIndex
CREATE INDEX "mesaj_yazisma_id_olusturma_idx" ON "mesaj"("yazisma_id", "olusturma");

-- CreateIndex
CREATE INDEX "bildirim_alici_id_okunma_idx" ON "bildirim"("alici_id", "okunma");

-- CreateIndex
CREATE INDEX "koordinator_notu_ogrenci_id_idx" ON "koordinator_notu"("ogrenci_id");

-- CreateIndex
CREATE UNIQUE INDEX "kural_ayari_anahtar_gecerlilik_baslangic_key" ON "kural_ayari"("anahtar", "gecerlilik_baslangic");

-- CreateIndex
CREATE INDEX "uyari_ogrenci_id_durum_idx" ON "uyari"("ogrenci_id", "durum");

-- CreateIndex
CREATE INDEX "karar_ogrenci_id_idx" ON "karar"("ogrenci_id");

-- CreateIndex
CREATE INDEX "islem_kaydi_varlik_varlik_id_idx" ON "islem_kaydi"("varlik", "varlik_id");

-- CreateIndex
CREATE INDEX "islem_kaydi_zaman_idx" ON "islem_kaydi"("zaman");

-- AddForeignKey
ALTER TABLE "sifre_baglantisi" ADD CONSTRAINT "sifre_baglantisi_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protokol" ADD CONSTRAINT "protokol_bolum_id_fkey" FOREIGN KEY ("bolum_id") REFERENCES "bolum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protokol_satiri" ADD CONSTRAINT "protokol_satiri_protokol_id_fkey" FOREIGN KEY ("protokol_id") REFERENCES "protokol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protokol_satiri" ADD CONSTRAINT "protokol_satiri_ders_id_fkey" FOREIGN KEY ("ders_id") REFERENCES "ders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ozel_sart" ADD CONSTRAINT "ozel_sart_protokol_id_fkey" FOREIGN KEY ("protokol_id") REFERENCES "protokol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ozel_sart" ADD CONSTRAINT "ozel_sart_bm_ders_id_fkey" FOREIGN KEY ("bm_ders_id") REFERENCES "ders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_anadal_bolum_id_fkey" FOREIGN KEY ("anadal_bolum_id") REFERENCES "bolum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_kabul_donem_id_fkey" FOREIGN KEY ("kabul_donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "izinli_donem" ADD CONSTRAINT "izinli_donem_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "izinli_donem" ADD CONSTRAINT "izinli_donem_donem_id_fkey" FOREIGN KEY ("donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "izinli_donem" ADD CONSTRAINT "izinli_donem_belge_id_fkey" FOREIGN KEY ("belge_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "izinli_donem" ADD CONSTRAINT "izinli_donem_giren_id_fkey" FOREIGN KEY ("giren_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anadal_gano_kaydi" ADD CONSTRAINT "anadal_gano_kaydi_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anadal_gano_kaydi" ADD CONSTRAINT "anadal_gano_kaydi_donem_id_fkey" FOREIGN KEY ("donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anadal_gano_kaydi" ADD CONSTRAINT "anadal_gano_kaydi_giren_id_fkey" FOREIGN KEY ("giren_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_ders_id_fkey" FOREIGN KEY ("ders_id") REFERENCES "ders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_protokol_satiri_id_fkey" FOREIGN KEY ("protokol_satiri_id") REFERENCES "protokol_satiri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_muafiyet_belge_id_fkey" FOREIGN KEY ("muafiyet_belge_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_onaylayan_id_fkey" FOREIGN KEY ("onaylayan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_plan_dersi_id_fkey" FOREIGN KEY ("plan_dersi_id") REFERENCES "plan_dersi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_alinan_donem_id_fkey" FOREIGN KEY ("alinan_donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_gecilen_donem_id_fkey" FOREIGN KEY ("gecilen_donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_transkript_belge_id_fkey" FOREIGN KEY ("transkript_belge_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_onaylayan_id_fkey" FOREIGN KEY ("onaylayan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "katalog_disi_ders_talebi" ADD CONSTRAINT "katalog_disi_ders_talebi_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "katalog_disi_ders_talebi" ADD CONSTRAINT "katalog_disi_ders_talebi_yanitlayan_id_fkey" FOREIGN KEY ("yanitlayan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "katalog_disi_ders_talebi" ADD CONSTRAINT "katalog_disi_ders_talebi_eklenen_ders_id_fkey" FOREIGN KEY ("eklenen_ders_id") REFERENCES "ders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge" ADD CONSTRAINT "belge_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge" ADD CONSTRAINT "belge_donem_id_fkey" FOREIGN KEY ("donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge" ADD CONSTRAINT "belge_belge_talebi_id_fkey" FOREIGN KEY ("belge_talebi_id") REFERENCES "belge_talebi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge" ADD CONSTRAINT "belge_onceki_surum_id_fkey" FOREIGN KEY ("onceki_surum_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge" ADD CONSTRAINT "belge_yukleyen_id_fkey" FOREIGN KEY ("yukleyen_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge" ADD CONSTRAINT "belge_onaylayan_id_fkey" FOREIGN KEY ("onaylayan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge_talebi" ADD CONSTRAINT "belge_talebi_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belge_talebi" ADD CONSTRAINT "belge_talebi_isteyen_id_fkey" FOREIGN KEY ("isteyen_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yazisma" ADD CONSTRAINT "yazisma_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesaj" ADD CONSTRAINT "mesaj_yazisma_id_fkey" FOREIGN KEY ("yazisma_id") REFERENCES "yazisma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesaj" ADD CONSTRAINT "mesaj_gonderen_id_fkey" FOREIGN KEY ("gonderen_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesaj" ADD CONSTRAINT "mesaj_ek_belge_id_fkey" FOREIGN KEY ("ek_belge_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bildirim" ADD CONSTRAINT "bildirim_alici_id_fkey" FOREIGN KEY ("alici_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koordinator_notu" ADD CONSTRAINT "koordinator_notu_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koordinator_notu" ADD CONSTRAINT "koordinator_notu_yazan_id_fkey" FOREIGN KEY ("yazan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kural_ayari" ADD CONSTRAINT "kural_ayari_giren_id_fkey" FOREIGN KEY ("giren_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyari" ADD CONSTRAINT "uyari_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyari" ADD CONSTRAINT "uyari_kapatan_id_fkey" FOREIGN KEY ("kapatan_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyari_ayari" ADD CONSTRAINT "uyari_ayari_uyari_id_fkey" FOREIGN KEY ("uyari_id") REFERENCES "uyari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyari_ayari" ADD CONSTRAINT "uyari_ayari_kural_ayari_id_fkey" FOREIGN KEY ("kural_ayari_id") REFERENCES "kural_ayari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karar" ADD CONSTRAINT "karar_ogrenci_id_fkey" FOREIGN KEY ("ogrenci_id") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karar" ADD CONSTRAINT "karar_uyari_id_fkey" FOREIGN KEY ("uyari_id") REFERENCES "uyari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karar" ADD CONSTRAINT "karar_belge_id_fkey" FOREIGN KEY ("belge_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karar" ADD CONSTRAINT "karar_veren_id_fkey" FOREIGN KEY ("veren_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "islem_kaydi" ADD CONSTRAINT "islem_kaydi_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
