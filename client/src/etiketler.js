// Veritabanındaki sabit değerlerin arayüzdeki Türkçe karşılıkları
export const ROL = { KOORDINATOR: 'Koordinatör', OGRENCI: 'Öğrenci', BOLUM_BASKANI: 'Bölüm Başkanı' };
export const PROGRAM = { CAP: 'Çift Anadal', YDP: 'Yandal' };
export const DONEM = { GUZ: 'Güz', BAHAR: 'Bahar', YAZ: 'Yaz' };
export const OGRENCI_DURUMU = {
  AKTIF: 'Aktif', DONDURULMUS: 'Dondurulmuş', MEZUN: 'Mezun',
  SERTIFIKA_ALDI: 'Sertifika aldı', AYRILDI: 'Ayrıldı', KAYDI_SILINDI: 'Kaydı silindi',
};

export const DERS_TURU = { ZORUNLU: 'Zorunlu', TEKNIK_SECMELI: 'Teknik seçmeli', SOSYAL_SECMELI: 'Sosyal seçmeli' };
export const DERS_DURUMU = {
  PLANLANDI: 'Planlandı', ALINDI: 'Alındı', GECTI: 'Geçti', KALDI: 'Kaldı', MUAF: 'Muaf', CIKARILDI: 'Çıkarıldı',
};
// Onay durumu: etiket ve MUI renk adı
export const ONAY_DURUMU = {
  ONAY_BEKLIYOR: { etiket: 'Onay bekliyor', renk: 'warning' },
  ONAYLANDI: { etiket: 'Onaylandı', renk: 'success' },
  REDDEDILDI: { etiket: 'Reddedildi', renk: 'error' },
  IPTAL: { etiket: 'İptal', renk: 'default' },
};

export const donemAdi =(d) => (d ? `${d.akademikYil} ${DONEM[d.tur]}` : '');
