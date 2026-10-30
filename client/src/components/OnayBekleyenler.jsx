import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Alert, Button, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { api } from '../api.js';
import { kararVer } from '../planKarari.js';
import { BELGE_TURU, boyutYaz } from '../etiketler.js';

// Koordinatörün onay kuyruğu: öğrencilerin seçtiği dersler ve yüklediği belgeler.
// Bölüm başkanı listeyi görür ama düğmeleri görmez.
export default function OnayBekleyenler({ onaylayabilir = false, degisti = () => {} }) {
  const [dersler, setDersler] = useState([]);
  const [belgeler, setBelgeler] = useState([]);
  const [hata, setHata] = useState('');

  function yukle() {
    api('/onay-bekleyenler').then((v) => setDersler(v.bekleyenler)).catch((e) => setHata(e.message));
    api('/onay-bekleyen-belgeler').then((v) => setBelgeler(v.belgeler)).catch((e) => setHata(e.message));
  }
  useEffect(() => { yukle(); }, []);

  async function karar(kaynak, id, tur) {
    setHata('');
    try {
      if (await kararVer(kaynak, id, tur)) {
        yukle();
        degisti();
      }
    } catch (e) {
      setHata(e.message);
    }
  }

  const ogrenciBaglantisi = (o) => (
    <Link component={RouterLink} to={`/ogrenci-karti/${o.id}`}>{o.ogrenciNo} {o.adSoyad}</Link>
  );
  const dugmeler = (kaynak, id) => onaylayabilir && (
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
      <Button size="small" color="success" onClick={() => karar(kaynak, id, 'ONAYLA')}>Onayla</Button>
      <Button size="small" color="error" onClick={() => karar(kaynak, id, 'REDDET')}>Reddet</Button>
    </TableCell>
  );

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2 }}>Onay Bekleyenler</Typography>
      {hata && <Alert severity="error" sx={{ mx: 2, mb: 2 }}>{hata}</Alert>}
      {dersler.length === 0 && belgeler.length === 0 && (
        <Alert severity="success" sx={{ m: 2 }}>Onay bekleyen kayıt yok.</Alert>
      )}

      {dersler.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ px: 2, pt: 1 }}>Ders seçimleri</Typography>
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
              {dersler.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.olusturma).toLocaleString('tr-TR')}</TableCell>
                  <TableCell>{ogrenciBaglantisi(b.ogrenci)}</TableCell>
                  <TableCell>{b.ders.kod} {b.ders.ad}</TableCell>
                  <TableCell>{b.ders.akts}</TableCell>
                  {dugmeler('/plan', b.id)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {belgeler.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ px: 2, pt: 2 }}>Belgeler</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Öğrenci</TableCell>
                <TableCell>Belge</TableCell>
                <TableCell>Dosya</TableCell>
                {onaylayabilir && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {belgeler.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.olusturma).toLocaleString('tr-TR')}</TableCell>
                  <TableCell>{ogrenciBaglantisi(b.ogrenci)}</TableCell>
                  <TableCell>{BELGE_TURU[b.tur]} (sürüm {b.surumNo})</TableCell>
                  <TableCell>
                    <Link href={`/api/belgeler/${b.id}/dosya`}>{b.orijinalAd}</Link> ({boyutYaz(b.boyut)})
                  </TableCell>
                  {dugmeler('/belgeler', b.id)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </TableContainer>
  );
}
