import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useOturum, ROL_SAYFASI } from '../auth/Oturum.jsx';

export default function GirisSayfasi() {
  const { kullanici, girisYap } = useOturum();
  const navigate = useNavigate();
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  if (kullanici) return <Navigate to={ROL_SAYFASI[kullanici.rol]} replace />;

  async function gonder(e) {
    e.preventDefault();
    setHata('');
    setGonderiliyor(true);
    try {
      const k = await girisYap(eposta, sifre);
      navigate(ROL_SAYFASI[k.rol], { replace: true });
    } catch (err) {
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
      <Paper component="form" onSubmit={gonder} sx={{ p: 4, width: 380 }}>
        <Typography variant="h5" gutterBottom>ÇAP ve Yandal Takip Sistemi</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selçuk Üniversitesi · Bilgisayar Mühendisliği
        </Typography>
        {hata && <Alert severity="error" sx={{ mb: 2 }}>{hata}</Alert>}
        <TextField
          label="Okul e-postası" type="email" fullWidth required autoFocus sx={{ mb: 2 }}
          value={eposta} onChange={(e) => setEposta(e.target.value)}
        />
        <TextField
          label="Şifre" type="password" fullWidth required sx={{ mb: 3 }}
          value={sifre} onChange={(e) => setSifre(e.target.value)}
        />
        <Button type="submit" variant="contained" fullWidth disabled={gonderiliyor}>
          Giriş Yap
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Hesaplar koordinatör tarafından açılır.
        </Typography>
      </Paper>
    </Box>
  );
}
