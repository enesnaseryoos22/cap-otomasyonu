import { useEffect, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import AnaDuzen from '../components/AnaDuzen.jsx';
import OzetKarti from '../components/OzetKarti.jsx';
import OgrenciTablosu from '../components/OgrenciTablosu.jsx';
import IslemKaydiTablosu from '../components/IslemKaydiTablosu.jsx';
import { api } from '../api.js';

// Koordinatör ve bölüm başkanının ana paneli. Bölüm başkanı aynı bilgileri görür ama değiştiremez.
export default function YonetimPaneli({ baslik, saltOkunur = false }) {
  const [ozet, setOzet] = useState(null);

  useEffect(() => {
    api('/panel').then(setOzet).catch(() => {});
  }, []);

  return (
    <AnaDuzen baslik={baslik}>
      {saltOkunur && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Bu hesap yalnız görüntüleme yetkisine sahiptir; kayıtlarda değişiklik yapılamaz.
        </Alert>
      )}
      {ozet && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <OzetKarti etiket="Toplam öğrenci" deger={ozet.ogrenciSayisi.toplam} />
          <OzetKarti etiket="Çift Anadal" deger={ozet.ogrenciSayisi.cap} />
          <OzetKarti etiket="Yandal" deger={ozet.ogrenciSayisi.ydp} />
          <OzetKarti etiket="Onay bekleyen" deger={ozet.onayBekleyen} />
        </Stack>
      )}
      <Stack spacing={3}>
        <OgrenciTablosu />
        <IslemKaydiTablosu />
      </Stack>
    </AnaDuzen>
  );
}
