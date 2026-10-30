import { z } from 'zod';

export const girisSemasi = z.object({
  eposta: z.string().trim().toLowerCase().email('Geçerli bir e-posta girin.').max(254),
  sifre: z.string().min(1, 'Şifre boş olamaz.').max(200),
});
