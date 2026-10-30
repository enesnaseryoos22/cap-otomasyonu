-- CreateTable
CREATE TABLE "belge_icerigi" (
    "belge_id" UUID NOT NULL,
    "icerik" BYTEA NOT NULL,
    "olusturma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "belge_icerigi_pkey" PRIMARY KEY ("belge_id")
);

-- AddForeignKey
ALTER TABLE "belge_icerigi" ADD CONSTRAINT "belge_icerigi_belge_id_fkey" FOREIGN KEY ("belge_id") REFERENCES "belge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Veritabanı kuralları (bkz. *_veritabani_kurallari):
-- dosya boş olamaz; eklenen dosya değiştirilemez, silinemez, tablo boşaltılamaz.
ALTER TABLE belge_icerigi
  ADD CONSTRAINT belge_icerigi_bos_degil CHECK (octet_length(icerik) > 0);

CREATE TRIGGER belge_icerigi_silme_engeli BEFORE DELETE ON belge_icerigi
  FOR EACH ROW EXECUTE FUNCTION silme_engeli();
CREATE TRIGGER belge_icerigi_bosaltma_engeli BEFORE TRUNCATE ON belge_icerigi
  FOR EACH STATEMENT EXECUTE FUNCTION silme_engeli();
CREATE TRIGGER belge_icerigi_guncelleme_engeli BEFORE UPDATE ON belge_icerigi
  FOR EACH ROW EXECUTE FUNCTION guncelleme_engeli();
