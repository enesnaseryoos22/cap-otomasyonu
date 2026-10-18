import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api istekleri Express sunucusuna yönlendirilir; böylece arayüz ve API aynı adresten çalışır
// ve çerezler SameSite=Strict ile güvenle gönderilir.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
