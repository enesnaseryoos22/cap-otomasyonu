-- AlterTable
ALTER TABLE "ogrenci" ADD COLUMN     "anadal_mezuniyet_donem_id" UUID;

-- AddForeignKey
ALTER TABLE "ogrenci" ADD CONSTRAINT "ogrenci_anadal_mezuniyet_donem_id_fkey" FOREIGN KEY ("anadal_mezuniyet_donem_id") REFERENCES "donem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Koordinatör e-postası: "Daha önce geçilmiş dersler ve notlar bundan etkilenmemeli."
-- Geçilmiş veya muaf sayılmış ders, ders listesinden çıkarılamaz.
-- (Hatalı kayıt düzeltmesi ve gerekçeli iptal bu kuraldan etkilenmez.)
CREATE FUNCTION gecilen_ders_cikarilamaz() RETURNS trigger AS $$
BEGIN
  IF OLD.durum IN ('GECTI', 'MUAF') AND NEW.durum = 'CIKARILDI' THEN
    RAISE EXCEPTION 'Geçilmiş veya muaf sayılmış ders listeden çıkarılamaz' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_dersi_gecilen_ders BEFORE UPDATE OF durum ON plan_dersi
  FOR EACH ROW EXECUTE FUNCTION gecilen_ders_cikarilamaz();
