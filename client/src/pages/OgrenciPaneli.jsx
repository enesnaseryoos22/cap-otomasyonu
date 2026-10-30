import { useEffect, useState } from 'react';
import { Alert, Button, LinearProgress } from '@mui/material';
import AnaDuzen from '../components/AnaDuzen.jsx';
import OgrenciKarti from '../components/OgrenciKarti.jsx';
import KatalogDialog from '../components/KatalogDialog.jsx';
import BelgeYukleDialog from '../components/BelgeYukleDialog.jsx';
import { api } from '../api.js';

// Öğrenci yalnız kendi kartını görür, katalogdan ders seçer ve belge yükler.
export default function OgrenciPaneli() {
  const [kart, setKart] = useState(null);
  const [hata, setHata] = useState('');
  const [katalogAcik, setKatalogAcik] = useState(false);
  const [belgeAcik, setBelgeAcik] = useState(false);

  const yukle = () => api('/kartim').then((v) => setKart(v.kart)).catch((e) => setHata(e.message));
  useEffect(() => { yukle(); }, []);

  if (hata) return <AnaDuzen baslik="Öğrenci Paneli"><Alert severity="error">{hata}</Alert></AnaDuzen>;
  if (!kart) return <AnaDuzen baslik="Öğrenci Paneli"><LinearProgress /></AnaDuzen>;

  // Reddedilen dersler yeniden seçilebilir; diğerleri katalogda "Planda" görünür.
  const plandakiKodlar = new Set(kart.planDersleri.filter((p) => p.onayDurumu !== 'REDDEDILDI').map((p) => p.ders.kod));

  return (
    <AnaDuzen baslik="Öğrenci Paneli">
      <OgrenciKarti
        kart={kart}
        yenile={yukle}
        ustDugme={<Button variant="contained" onClick={() => setKatalogAcik(true)}>Katalogdan Ders Seç</Button>}
        belgeDugmesi={<Button variant="contained" onClick={() => setBelgeAcik(true)}>Belge Yükle</Button>}
      />
      <KatalogDialog acik={katalogAcik} kapat={() => setKatalogAcik(false)} eklendi={yukle} plandakiKodlar={plandakiKodlar} />
      <BelgeYukleDialog acik={belgeAcik} kapat={() => setBelgeAcik(false)} yuklendi={() => { setBelgeAcik(false); yukle(); }} />
    </AnaDuzen>
  );
}
