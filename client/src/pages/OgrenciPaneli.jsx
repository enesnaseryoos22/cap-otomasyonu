import { useEffect, useState } from 'react';
import { Alert, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import AnaDuzen from '../components/AnaDuzen.jsx';
import OzetKarti from '../components/OzetKarti.jsx';
import { api } from '../api.js';
import { PROGRAM, OGRENCI_DURUMU, donemAdi } from '../etiketler.js';

export default function OgrenciPaneli() {
  const [veri, setVeri] = useState(null);
  const [hata, setHata] = useState('');

  useEffect(() => {
    api('/panel').then(setVeri).catch((e) => setHata(e.message));
  }, []);

  if (hata) return <AnaDuzen baslik="Öğrenci Paneli"><Alert severity="error">{hata}</Alert></AnaDuzen>;
  if (!veri) return <AnaDuzen baslik="Öğrenci Paneli"><LinearProgress /></AnaDuzen>;

  const { ogrenci, akts, onayBekleyen } = veri;
  const yuzde = akts.planlanan ? Math.round((akts.tamamlanan / akts.planlanan) * 100) : 0;

  return (
    <AnaDuzen baslik="Öğrenci Paneli">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">{ogrenci.adSoyad}</Typography>
        <Typography color="text.secondary">
          {ogrenci.ogrenciNo} · {PROGRAM[ogrenci.programTuru]} · Anadal: {ogrenci.anadalBolum.ad}
        </Typography>
        <Typography color="text.secondary">
          Kabul dönemi: {donemAdi(ogrenci.kabulDonemi)} · Durum: {OGRENCI_DURUMU[ogrenci.durum]}
        </Typography>
      </Paper>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <OzetKarti etiket="Tamamlanan AKTS" deger={akts.tamamlanan} />
        <OzetKarti etiket="Ders planındaki AKTS" deger={akts.planlanan} />
        <OzetKarti etiket="Onay bekleyen" deger={onayBekleyen} />
      </Stack>
      {akts.planlanan > 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography gutterBottom>İlerleme: %{yuzde}</Typography>
          <LinearProgress variant="determinate" value={yuzde} sx={{ height: 10, borderRadius: 5 }} />
        </Paper>
      ) : (
        <Alert severity="info">Henüz onaylanmış bir ders planınız yok.</Alert>
      )}
    </AnaDuzen>
  );
}
