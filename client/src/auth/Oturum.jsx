import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { api } from '../api.js';

const OturumContext = createContext(null);

// Giriş yapan kullanıcıyı tüm sayfalara sağlar.
export function OturumSaglayici({ children }) {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    api('/kimlik/ben')
      .then((v) => setKullanici(v.kullanici))
      .catch(() => setKullanici(null))
      .finally(() => setYukleniyor(false));
  }, []);

  async function girisYap(eposta, sifre) {
    const v = await api('/kimlik/giris', { method: 'POST', govde: { eposta, sifre } });
    setKullanici(v.kullanici);
    return v.kullanici;
  }

  async function cikisYap() {
    await api('/kimlik/cikis', { method: 'POST' }).catch(() => {});
    setKullanici(null);
  }

  return (
    <OturumContext.Provider value={{ kullanici, yukleniyor, girisYap, cikisYap }}>
      {children}
    </OturumContext.Provider>
  );
}

export const useOturum = () => useContext(OturumContext);

export const ROL_SAYFASI = {
  KOORDINATOR: '/koordinator',
  OGRENCI: '/ogrenci',
  BOLUM_BASKANI: '/bolum-baskani',
};

// Sayfayı yalnız izin verilen role gösterir; diğerlerini kendi sayfasına yönlendirir.
// (Asıl yetki kontrolü sunucudadır; bu yalnız kullanıcıyı doğru sayfaya götürür.)
export function RolKorumasi({ rol, children }) {
  const { kullanici, yukleniyor } = useOturum();
  if (yukleniyor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!kullanici) return <Navigate to="/giris" replace />;
  if (kullanici.rol !== rol) return <Navigate to={ROL_SAYFASI[kullanici.rol]} replace />;
  return children;
}
