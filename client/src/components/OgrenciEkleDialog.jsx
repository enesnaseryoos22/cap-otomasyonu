import { useEffect, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField,
} from '@mui/material';
import { api } from '../api.js';
import { PROGRAM, donemAdi } from '../etiketler.js';

const BOS_FORM = { ogrenciNo: '', adSoyad: '', eposta: '', programTuru: 'CAP', anadalBolumId: '', kabulDonemId: '', capOgrenciNo: '' };

// Koordinatörün kabul edilen öğrenciyi sisteme eklediği form
export default function OgrenciEkleDialog({ acik, kapat, eklendi }) {
  const [form, setForm] = useState(BOS_FORM);
  const [secenekler, setSecenekler] = useState({ bolumler: [], donemler: [] });
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    if (acik) api('/secenekler').then(setSecenekler).catch((e) => setHata(e.message));
  }, [acik]);

  const alan = (ad) => ({ value: form[ad], onChange: (e) => setForm({ ...form, [ad]: e.target.value }) });

  async function gonder(e) {
    e.preventDefault();
    setHata('');
    setGonderiliyor(true);
    try {
      await api('/ogrenciler', { method: 'POST', govde: form });
      setForm(BOS_FORM);
      eklendi();
    } catch (err) {
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <Dialog open={acik} onClose={kapat} fullWidth maxWidth="sm">
      <DialogTitle>Öğrenci Ekle</DialogTitle>
      <DialogContent>
        <Stack component="form" id="ogrenci-ekle" onSubmit={gonder} spacing={2} sx={{ mt: 1 }}>
          {hata && <Alert severity="error">{hata}</Alert>}
          <TextField label="Öğrenci No (anadal)" required {...alan('ogrenciNo')} />
          <TextField label="Ad Soyad" required {...alan('adSoyad')} />
          <TextField label="Okul e-postası" type="email" required {...alan('eposta')} />
          <TextField select label="Program" required {...alan('programTuru')}>
            {Object.entries(PROGRAM).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField select label="Anadal bölümü" required {...alan('anadalBolumId')}>
            {secenekler.bolumler.map((b) => <MenuItem key={b.id} value={b.id}>{b.ad}</MenuItem>)}
          </TextField>
          <TextField select label="Kabul dönemi" required {...alan('kabulDonemId')}>
            {secenekler.donemler.map((d) => <MenuItem key={d.id} value={d.id}>{donemAdi(d)}</MenuItem>)}
          </TextField>
          <TextField label="ÇAP/YDP öğrenci no (varsa)" {...alan('capOgrenciNo')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={kapat}>Vazgeç</Button>
        <Button type="submit" form="ogrenci-ekle" variant="contained" disabled={gonderiliyor}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  );
}
