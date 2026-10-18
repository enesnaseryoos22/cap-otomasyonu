-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('KOORDINATOR', 'OGRENCI', 'BOLUM_BASKANI');

-- CreateEnum
CREATE TYPE "ProgramTuru" AS ENUM ('CAP', 'YDP');

-- CreateEnum
CREATE TYPE "OgrenciDurumu" AS ENUM ('AKTIF', 'DONDURULMUS', 'MEZUN', 'SERTIFIKA_ALDI', 'AYRILDI', 'KAYDI_SILINDI');

-- CreateEnum
CREATE TYPE "DonemTuru" AS ENUM ('GUZ', 'BAHAR', 'YAZ');

-- CreateEnum
CREATE TYPE "DersTuru" AS ENUM ('ZORUNLU', 'TEKNIK_SECMELI', 'SOSYAL_SECMELI');

-- CreateEnum
CREATE TYPE "DersDurumu" AS ENUM ('PLANLANDI', 'ALINDI', 'GECTI', 'KALDI', 'MUAF', 'CIKARILDI');

-- CreateEnum
CREATE TYPE "OnayDurumu" AS ENUM ('ONAY_BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "VeriKaynagi" AS ENUM ('OGRENCI', 'KOORDINATOR', 'GECMIS_AKTARIM');

-- CreateTable
CREATE TABLE "kullanici" (
    "id" UUID NOT NULL,
    "eposta" TEXT NOT NULL,
    "sifreHash" TEXT,
    "rol" "Rol" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "hataliGirisSayisi" INTEGER NOT NULL DEFAULT 0,
    "kilitliBitis" TIMESTAMP(3),
    "sonGiris" TIMESTAMP(3),
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kullanici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bolum" (
    "id" UUID NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,

    CONSTRAINT "bolum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donem" (
    "id" UUID NOT NULL,
    "akademikYil" TEXT NOT NULL,
    "tur" "DonemTuru" NOT NULL,
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
    "ulusalKredi" INTEGER,
    "yariyil" INTEGER NOT NULL,
    "tur" "DersTuru" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ogrenci" (
    "id" UUID NOT NULL,
    "ogrenciNo" TEXT NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "eposta" TEXT NOT NULL,
    "programTuru" "ProgramTuru" NOT NULL,
    "anadalBolumId" UUID NOT NULL,
    "kabulDonemId" UUID NOT NULL,
    "capOgrenciNo" TEXT,
    "durum" "OgrenciDurumu" NOT NULL DEFAULT 'AKTIF',
    "kullaniciId" UUID,
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ogrenci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protokol" (
    "id" UUID NOT NULL,
    "bolumId" UUID NOT NULL,
    "programTuru" "ProgramTuru" NOT NULL,
    "ad" TEXT NOT NULL,

    CONSTRAINT "protokol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protokol_satiri" (
    "id" UUID NOT NULL,
    "protokolId" UUID NOT NULL,
    "sira" INTEGER NOT NULL,
    "dersId" UUID,
    "yuvaAdi" TEXT,
    "yariyil" INTEGER NOT NULL,
    "akts" INTEGER NOT NULL,
    "ozelSartNo" INTEGER,

    CONSTRAINT "protokol_satiri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ozel_sart" (
    "id" UUID NOT NULL,
    "protokolId" UUID NOT NULL,
    "no" INTEGER NOT NULL,
    "anadalDersKodu" TEXT NOT NULL,
    "anadalDersAdi" TEXT NOT NULL,
    "bmDersId" UUID NOT NULL,

    CONSTRAINT "ozel_sart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_dersi" (
    "id" UUID NOT NULL,
    "ogrenciId" UUID NOT NULL,
    "dersId" UUID NOT NULL,
    "protokolSatiriId" UUID,
    "durum" "DersDurumu" NOT NULL DEFAULT 'PLANLANDI',
    "onayDurumu" "OnayDurumu" NOT NULL DEFAULT 'ONAY_BEKLIYOR',
    "kaynak" "VeriKaynagi" NOT NULL,
    "gerekce" TEXT,
    "redGerekcesi" TEXT,
    "cikarmaTarihi" TIMESTAMP(3),
    "cikarmaGerekcesi" TEXT,
    "onayTarihi" TIMESTAMP(3),
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_dersi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ders_denemesi" (
    "id" UUID NOT NULL,
    "planDersiId" UUID NOT NULL,
    "alinanDonemId" UUID NOT NULL,
    "harfNotu" TEXT,
    "sonuc" "DersDurumu" NOT NULL DEFAULT 'ALINDI',
    "gecilenDonemId" UUID,
    "onayDurumu" "OnayDurumu" NOT NULL DEFAULT 'ONAY_BEKLIYOR',
    "kaynak" "VeriKaynagi" NOT NULL,
    "redGerekcesi" TEXT,
    "onayTarihi" TIMESTAMP(3),
    "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ders_denemesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "islem_kaydi" (
    "id" UUID NOT NULL,
    "zaman" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kullaniciId" UUID,
    "eylem" TEXT NOT NULL,
    "varlik" TEXT,
    "varlikId" TEXT,
    "eskiDeger" JSONB,
    "yeniDeger" JSONB,
    "ipAdresi" TEXT,

    CONSTRAINT "islem_kaydi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kullanici_eposta_key" ON "kullanici"("eposta");

-- CreateIndex
CREATE UNIQUE INDEX "bolum_kod_key" ON "bolum"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "donem_akademikYil_tur_key" ON "donem"("akademikYil", "tur");

-- CreateIndex
CREATE UNIQUE INDEX "ders_kod_key" ON "ders"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_ogrenciNo_key" ON "ogrenci"("ogrenciNo");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_eposta_key" ON "ogrenci"("eposta");

-- CreateIndex
CREATE UNIQUE INDEX "ogrenci_kullaniciId_key" ON "ogrenci"("kullaniciId");

-- CreateIndex
CREATE UNIQUE INDEX "protokol_satiri_protokolId_sira_key" ON "protokol_satiri"("protokolId", "sira");

-- CreateIndex
CREATE UNIQUE INDEX "ozel_sart_protokolId_no_key" ON "ozel_sart"("protokolId", "no");

-- CreateIndex
CREATE INDEX "islem_kaydi_varlik_varlikId_idx" ON "islem_kaydi"("varlik", "varlikId");

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_anadalBolumId_fkey" FOREIGN KEY ("anadalBolumId") REFERENCES "bolum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_kabulDonemId_fkey" FOREIGN KEY ("kabulDonemId") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protokol" ADD CONSTRAINT "protokol_bolumId_fkey" FOREIGN KEY ("bolumId") REFERENCES "bolum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protokol_satiri" ADD CONSTRAINT "protokol_satiri_protokolId_fkey" FOREIGN KEY ("protokolId") REFERENCES "protokol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protokol_satiri" ADD CONSTRAINT "protokol_satiri_dersId_fkey" FOREIGN KEY ("dersId") REFERENCES "ders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ozel_sart" ADD CONSTRAINT "ozel_sart_protokolId_fkey" FOREIGN KEY ("protokolId") REFERENCES "protokol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ozel_sart" ADD CONSTRAINT "ozel_sart_bmDersId_fkey" FOREIGN KEY ("bmDersId") REFERENCES "ders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_ogrenciId_fkey" FOREIGN KEY ("ogrenciId") REFERENCES "ogrenci"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_dersId_fkey" FOREIGN KEY ("dersId") REFERENCES "ders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_dersi" ADD CONSTRAINT "plan_dersi_protokolSatiriId_fkey" FOREIGN KEY ("protokolSatiriId") REFERENCES "protokol_satiri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_planDersiId_fkey" FOREIGN KEY ("planDersiId") REFERENCES "plan_dersi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_alinanDonemId_fkey" FOREIGN KEY ("alinanDonemId") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ders_denemesi" ADD CONSTRAINT "ders_denemesi_gecilenDonemId_fkey" FOREIGN KEY ("gecilenDonemId") REFERENCES "donem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "islem_kaydi" ADD CONSTRAINT "islem_kaydi_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;
