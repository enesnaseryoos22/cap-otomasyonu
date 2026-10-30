// Yüklenen dosyanın güvenlik kontrolü. Tarayıcının bildirdiği tür ve dosya uzantısına güvenilmez;
// tür, dosyanın ilk baytlarından (magic number) belirlenir.

export const MAKS_BOYUT = 5 * 1024 * 1024; // 5 MB

const IMZALAR = [
  { mime: 'application/pdf', uzantilar: ['pdf'], imza: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // %PDF-
  { mime: 'image/png', uzantilar: ['png'], imza: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', uzantilar: ['jpg', 'jpeg'], imza: [0xff, 0xd8, 0xff] },
];

// PDF içinde çalıştırılabilir içerik işaretleri (betik, dosya açma, gömülü dosya).
// İmzalı başvuru formlarında bulunmaz; bulunursa dosya reddedilir.
const TEHLIKELI_PDF = [/\/JavaScript\b/, /\/JS\b/, /\/Launch\b/, /\/EmbeddedFile\b/, /\/RichMedia\b/, /\/XFA\b/];

export class DosyaHatasi extends Error {}

// Geçerliyse { mime, guvenliAd } döner, değilse DosyaHatasi fırlatır.
export function dosyaKontrolEt(dosya) {
  if (!dosya?.buffer?.length) throw new DosyaHatasi('Dosya seçin.');
  if (dosya.size > MAKS_BOYUT) throw new DosyaHatasi('Dosya en çok 5 MB olabilir.');

  const tur = IMZALAR.find((t) => t.imza.every((bayt, i) => dosya.buffer[i] === bayt));
  if (!tur) throw new DosyaHatasi('Yalnız PDF, PNG veya JPEG dosyası yüklenebilir.');

  const uzanti = dosya.originalname.split('.').pop().toLowerCase();
  if (!tur.uzantilar.includes(uzanti)) {
    throw new DosyaHatasi('Dosya uzantısı içeriğiyle uyuşmuyor.');
  }

  if (tur.mime === 'application/pdf') {
    const metin = dosya.buffer.toString('latin1');
    if (TEHLIKELI_PDF.some((d) => d.test(metin))) {
      throw new DosyaHatasi('PDF dosyasında betik veya gömülü içerik var; güvenlik nedeniyle kabul edilmedi.');
    }
  }

  return { mime: tur.mime, guvenliAd: guvenliAd(dosya.originalname) };
}

// Görünen ad: klasör yolu ve denetim karakterleri atılır, uzunluk sınırlanır.
function guvenliAd(ad) {
  const temiz = ad.split(/[\\/]/).pop().replace(/[\x00-\x1f"<>|:*?]/g, '_').trim();
  return (temiz || 'belge').slice(-120);
}
