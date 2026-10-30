import { z } from 'zod';

// Koordinatörün yeni öğrenci eklerken girdiği bilgiler
export const ogrenciEklemeSemasi = z.object({
  ogrenciNo: z.string().trim().regex(/^[0-9]{6,12}$/, 'Öğrenci numarası 6-12 haneli olmalıdır.'),
  adSoyad: z.string().trim().min(3, 'Ad soyad en az 3 karakter olmalıdır.').max(100),
  eposta: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin.').max(254),
  programTuru: z.enum(['CAP', 'YDP'], { message: 'Program türü seçin.' }),
  anadalBolumId: z.string().uuid('Anadal bölümü seçin.'),
  kabulDonemId: z.string().uuid('Kabul dönemi seçin.'),
  capOgrenciNo: z
    .string().trim().regex(/^[0-9]{6,12}$/, 'ÇAP/YDP numarası 6-12 haneli olmalıdır.')
    .optional().or(z.literal('').transform(() => undefined)),
});
