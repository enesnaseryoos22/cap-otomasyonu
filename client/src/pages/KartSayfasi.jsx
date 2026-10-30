import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Button, LinearProgress } from '@mui/material';
import AnaDuzen from '../components/AnaDuzen.jsx';
import OgrenciKarti from '../components/OgrenciKarti.jsx';
import { useOturum } from '../auth/Oturum.jsx';
import { api } from '../api.js';

// Koordinatör ve bölüm başkanının açtığı öğrenci kartı. Onay düğmeleri yalnız koordinatörde.
export default function KartSayfasi() {
  const { id } = useParams();
  const { kullanici } = useOturum();
  const navigate = useNavigate();
  const [kart, setKart] = useState(null);
  const [hata, setHata] = useState('');

  const yukle = () => api(`/ogrenciler/${id}/kart`).then((v) => setKart(v.kart)).catch((e) => setHata(e.message));
  useEffect(() => { yukle(); }, [id]);

  const geri = <Button sx={{ mb: 2 }} onClick={() => navigate(-1)}>← Geri</Button>;
  if (hata) return <AnaDuzen baslik="Öğrenci Kartı">{geri}<Alert severity="error">{hata}</Alert></AnaDuzen>;
  if (!kart) return <AnaDuzen baslik="Öğrenci Kartı"><LinearProgress /></AnaDuzen>;

  return (
    <AnaDuzen baslik="Öğrenci Kartı">
      {geri}
      <OgrenciKarti kart={kart} yenile={yukle} onaylayabilir={kullanici.rol === 'KOORDINATOR'} />
    </AnaDuzen>
  );
}
