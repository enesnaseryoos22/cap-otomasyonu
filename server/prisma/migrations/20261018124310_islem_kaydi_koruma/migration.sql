-- İşlem kaydı yalnız eklenir: güncelleme ve silme veritabanı seviyesinde engellenir.
CREATE OR REPLACE FUNCTION islem_kaydi_degistirilemez() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'islem_kaydi tablosu degistirilemez ve silinemez';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER islem_kaydi_guncelleme_engeli
  BEFORE UPDATE OR DELETE ON "islem_kaydi"
  FOR EACH ROW EXECUTE FUNCTION islem_kaydi_degistirilemez();

-- TRUNCATE de engellenir.
CREATE TRIGGER islem_kaydi_bosaltma_engeli
  BEFORE TRUNCATE ON "islem_kaydi"
  FOR EACH STATEMENT EXECUTE FUNCTION islem_kaydi_degistirilemez();
