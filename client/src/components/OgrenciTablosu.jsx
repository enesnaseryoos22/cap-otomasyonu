import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { api } from '../api.js';
import { PROGRAM, OGRENCI_DURUMU, donemAdi } from '../etiketler.js';
import OgrenciEkleDialog from './OgrenciEkleDialog.jsx';

// yonetebilir: yalnız koordinatör öğrenci ekler ve hesap açar (bölüm başkanı yalnız görür).
export default function OgrenciTablosu({ yonetebilir = false, degisti = () => {} }) {
  const [ogrenciler, setOgrenciler] = useState([]);
  const [hata, setHata] = useState('');
  const [ekleAcik, setEkleAcik] = useState(false);
  const [hesap, setHesap] = useState(null); // yeni açılan hesabın geçici şifresi

  const yukle = () => api('/ogrenciler').then((v) => setOgrenciler(v.ogrenciler)).catch((e) => setHata(e.message));
  useEffect(() => { yukle(); }, []);

  async function hesapAc(o) {
    if (!window.confirm(`${o.adSoyad} için hesap açılsın mı?`)) return;
    try {
      setHesap(await api(`/ogrenciler/${o.id}/hesap`, { method: 'POST' }));
      yukle();
      degisti();
    } catch (e) {
      setHata(e.message);
    }
  }

  return (
    <TableContainer component={Paper}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Öğrenciler</Typography>
        {yonetebilir && <Button variant="contained" onClick={() => setEkleAcik(true)}>Öğrenci Ekle</Button>}
      </Box>
      {hata && <Alert severity="error" sx={{ mx: 2, mb: 2 }} onClose={() => setHata('')}>{hata}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Öğrenci No</TableCell>
            <TableCell>Ad Soyad</TableCell>
            <TableCell>Program</TableCell>
            <TableCell>Anadal</TableCell>
            <TableCell>Kabul Dönemi</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell>Hesap</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ogrenciler.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.ogrenciNo}</TableCell>
              <TableCell>{o.adSoyad}</TableCell>
              <TableCell>{PROGRAM[o.programTuru]}</TableCell>
              <TableCell>{o.anadalBolum.kod}</TableCell>
              <TableCell>{donemAdi(o.kabulDonemi)}</TableCell>
              <TableCell>{OGRENCI_DURUMU[o.durum]}</TableCell>
              <TableCell>
                {o.kullaniciId && <Chip label="Açık" color="success" size="small" />}
                {!o.kullaniciId && yonetebilir && <Button size="small" onClick={() => hesapAc(o)}>Hesap Aç</Button>}
                {!o.kullaniciId && !yonetebilir && <Chip label="Açılmadı" size="small" />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <OgrenciEkleDialog
        acik={ekleAcik}
        kapat={() => setEkleAcik(false)}
        eklendi={() => { setEkleAcik(false); yukle(); degisti(); }}
      />

      <Dialog open={!!hesap} onClose={() => setHesap(null)}>
        <DialogTitle>Hesap açıldı</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>E-posta: <b>{hesap?.eposta}</b></Typography>
          <Typography gutterBottom>Geçici şifre: <b style={{ fontFamily: 'monospace', fontSize: 18 }}>{hesap?.geciciSifre}</b></Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Bu şifre yalnız şimdi gösterilir. Öğrenciye iletin.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHesap(null)}>Tamam</Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
}
