import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { OturumSaglayici, RolKorumasi } from './auth/Oturum.jsx';
import GirisSayfasi from './pages/GirisSayfasi.jsx';
import YonetimPaneli from './pages/YonetimPaneli.jsx';
import OgrenciPaneli from './pages/OgrenciPaneli.jsx';

const tema = createTheme({ palette: { primary: { main: '#1a3d6d' } } });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <BrowserRouter>
        <OturumSaglayici>
          <Routes>
            <Route path="/giris" element={<GirisSayfasi />} />
            <Route path="/koordinator" element={
              <RolKorumasi rol="KOORDINATOR"><YonetimPaneli baslik="Koordinatör Paneli" /></RolKorumasi>
            } />
            <Route path="/ogrenci" element={
              <RolKorumasi rol="OGRENCI"><OgrenciPaneli /></RolKorumasi>
            } />
            <Route path="/bolum-baskani" element={
              <RolKorumasi rol="BOLUM_BASKANI"><YonetimPaneli baslik="Bölüm Başkanı Paneli" saltOkunur /></RolKorumasi>
            } />
            <Route path="*" element={<Navigate to="/giris" replace />} />
          </Routes>
        </OturumSaglayici>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
