import { useEffect, useState } from 'react';
import { Alert, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../api.js';
import { PROGRAM, OGRENCI_DURUMU, donemAdi } from '../etiketler.js';

export default function OgrenciTablosu() {
  const [ogrenciler, setOgrenciler] = useState([]);
  const [hata, setHata] = useState('');

  useEffect(() => {
    api('/ogrenciler').then((v) => setOgrenciler(v.ogrenciler)).catch((e) => setHata(e.message));
  }, []);

  if (hata) return <Alert severity="error">{hata}</Alert>;

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2 }}>Öğrenciler</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Öğrenci No</TableCell>
            <TableCell>Ad Soyad</TableCell>
            <TableCell>Program</TableCell>
            <TableCell>Anadal</TableCell>
            <TableCell>Kabul Dönemi</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell>Hesap</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ogrenciler.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.ogrenciNo}</TableCell>
              <TableCell>{o.adSoyad}</TableCell>
              <TableCell>{PROGRAM[o.programTuru]}</TableCell>
              <TableCell>{o.anadalBolum.kod}</TableCell>
              <TableCell>{donemAdi(o.kabulDonemi)}</TableCell>
              <TableCell>{OGRENCI_DURUMU[o.durum]}</TableCell>
              <TableCell>
                {o.kullaniciId
                  ? <Chip label="Açık" color="success" size="small" />
                  : <Chip label="Açılmadı" size="small" />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
