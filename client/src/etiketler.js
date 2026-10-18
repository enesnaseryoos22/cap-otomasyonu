// Veritabanındaki sabit değerlerin arayüzdeki Türkçe karşılıkları
export const ROL = { KOORDINATOR: 'Koordinatör', OGRENCI: 'Öğrenci', BOLUM_BASKANI: 'Bölüm Başkanı' };
export const PROGRAM = { CAP: 'Çift Anadal', YDP: 'Yandal' };
export const DONEM = { GUZ: 'Güz', BAHAR: 'Bahar', YAZ: 'Yaz' };
export const OGRENCI_DURUMU = {
  AKTIF: 'Aktif', DONDURULMUS: 'Dondurulmuş', MEZUN: 'Mezun',
  SERTIFIKA_ALDI: 'Sertifika aldı', AYRILDI: 'Ayrıldı', KAYDI_SILINDI: 'Kaydı silindi',
};

export const donemAdi = (d) => (d ? `${d.akademikYil} ${DONEM[d.tur]}` : '');
