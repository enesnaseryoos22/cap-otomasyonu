import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { api } from '../api.js';
import { BELGE_TURU, OGRENCI_BELGE_TURLERI } from '../etiketler.js';

// Öğrencinin belge yüklediği pencere. Asıl tür ve güvenlik kontrolü sunucudadır.
export default function BelgeYukleDialog({ acik, kapat, yuklendi }) {
  const [tur, setTur] = useState('KABUL_VE_DERS_PROTOKOLU');
  const [dosya, setDosya] = useState(null);
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function gonder(e) {
    e.preventDefault();
    setHata('');
    if (!dosya) return setHata('Dosya seçin.');
    const form = new FormData();
    form.append('tur', tur);
    form.append('dosya', dosya);
    setGonderiliyor(true);
    try {
      await api('/belgeler', { method: 'POST', govde: form });
      setDosya(null);
      yuklendi();
    } catch (err) {
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <Dialog open={acik} onClose={kapat} fullWidth maxWidth="sm">
      <DialogTitle>Belge Yükle</DialogTitle>
      <DialogContent>
        <Stack component="form" id="belge-yukle" onSubmit={gonder} spacing={2} sx={{ mt: 1 }}>
          {hata && <Alert severity="error">{hata}</Alert>}
          <TextField select label="Belge türü" value={tur} onChange={(e) => setTur(e.target.value)}>
            {OGRENCI_BELGE_TURLERI.map((t) => <MenuItem key={t} value={t}>{BELGE_TURU[t]}</MenuItem>)}
          </TextField>
          <Button variant="outlined" component="label">
            Dosya Seç
            <input hidden type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDosya(e.target.files[0] ?? null)} />
          </Button>
          {dosya && <Typography variant="body2">Seçilen: {dosya.name}</Typography>}
          <Alert severity="info">
            PDF, PNG veya JPEG; en çok 5 MB. Belge koordinatör onaylayana kadar "Onay bekliyor" durumunda kalır.
            Yüklenen belgeler silinemez; düzeltme için yeni sürüm yüklenir.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={kapat}>Vazgeç</Button>
        <Button type="submit" form="belge-yukle" variant="contained" disabled={gonderiliyor}>Yükle</Button>
      </DialogActions>
    </Dialog>
  );
}
