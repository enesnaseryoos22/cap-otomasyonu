import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Alert, Button, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { api } from '../api.js';
import { planKarariVer } from '../planKarari.js';

// Koordinatörün onay kuyruğu: öğrencilerin seçtiği ve henüz sonuçlanmamış dersler.
// Bölüm başkanı listeyi görür ama düğmeleri görmez.
export default function OnayBekleyenler({ onaylayabilir = false, degisti = () => {} }) {
  const [bekleyenler, setBekleyenler] = useState([]);
  const [hata, setHata] = useState('');

  const yukle = () => api('/onay-bekleyenler').then((v) => setBekleyenler(v.bekleyenler)).catch((e) => setHata(e.message));
  useEffect(() => { yukle(); }, []);

  async function karar(id, tur) {
    setHata('');
    try {
      if (await planKarariVer(id, tur)) {
        yukle();
        degisti();
      }
    } catch (e) {
      setHata(e.message);
    }
  }

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2 }}>Onay Bekleyen Ders Seçimleri</Typography>
      {hata && <Alert severity="error" sx={{ mx: 2, mb: 2 }}>{hata}</Alert>}
      {bekleyenler.length === 0 ? (
        <Alert severity="success" sx={{ m: 2 }}>Onay bekleyen kayıt yok.</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Öğrenci</TableCell>
              <TableCell>Ders</TableCell>
              <TableCell>AKTS</TableCell>
              {onaylayabilir && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {bekleyenler.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{new Date(b.olusturma).toLocaleString('tr-TR')}</TableCell>
                <TableCell>
                  <Link component={RouterLink} to={`/ogrenci-karti/${b.ogrenci.id}`}>
                    {b.ogrenci.ogrenciNo} {b.ogrenci.adSoyad}
                  </Link>
                </TableCell>
                <TableCell>{b.ders.kod} {b.ders.ad}</TableCell>
                <TableCell>{b.ders.akts}</TableCell>
                {onaylayabilir && (
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Button size="small" color="success" onClick={() => karar(b.id, 'ONAYLA')}>Onayla</Button>
                    <Button size="small" color="error" onClick={() => karar(b.id, 'REDDET')}>Reddet</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
}
