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

export const BELGE_TURU = {
  KABUL_VE_DERS_PROTOKOLU: 'Kabul ve ders protokolü (imzalı)',
  DERS_KAYIT_FORMU: 'Ders kayıt formu',
  CAP_YDP_TRANSKRIPTI: 'ÇAP/YDP transkripti',
  ANADAL_TRANSKRIPTI: 'Anadal transkripti',
  MUAFIYET_FORMU: 'Muafiyet formu',
  YONETIM_KURULU_YAZISI: 'Yönetim kurulu yazısı',
  RESMI_YAZI: 'Resmi yazı',
  EK_BELGE: 'Ek belge',
  MESAJ_EKI: 'Mesaj eki',
};
// Öğrencinin yükleyebileceği türler (sunucudaki liste ile aynı)
export const OGRENCI_BELGE_TURLERI = ['KABUL_VE_DERS_PROTOKOLU', 'DERS_KAYIT_FORMU', 'MUAFIYET_FORMU', 'EK_BELGE'];

export const boyutYaz = (bayt) => (bayt < 1024 * 1024 ? `${Math.ceil(bayt / 1024)} KB` : `${(bayt / 1024 / 1024).toFixed(1)} MB`);

export const donemAdi = (d) => (d ? `${d.akademikYil} ${DONEM[d.tur]}` : '');
