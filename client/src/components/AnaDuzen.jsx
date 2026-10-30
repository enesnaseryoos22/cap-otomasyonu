import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { useOturum } from '../auth/Oturum.jsx';
import { ROL } from '../etiketler.js';

// Giriş sonrası tüm sayfaların ortak çerçevesi: üst çubuk ve içerik alanı
export default function AnaDuzen({ baslik, children }) {
  const { kullanici, cikisYap } = useOturum();
  const navigate = useNavigate();

  async function cikis() {
    await cikisYap();
    navigate('/giris', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ÇAP ve Yandal Takip Sistemi
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {kullanici.ogrenci?.adSoyad ?? kullanici.eposta} · {ROL[kullanici.rol]}
          </Typography>
          <Button color="inherit" onClick={cikis}>Çıkış</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>{baslik}</Typography>
        {children}
      </Container>
    </Box>
  );
}
