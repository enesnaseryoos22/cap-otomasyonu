import { useEffect, useState } from 'react';
import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../api.js';

export default function IslemKaydiTablosu() {
  const [kayitlar, setKayitlar] = useState([]);
  const [hata, setHata] = useState('');

  useEffect(() => {
    api('/islem-kaydi').then((v) => setKayitlar(v.kayitlar)).catch((e) => setHata(e.message));
  }, []);

  if (hata) return <Alert severity="error">{hata}</Alert>;

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2 }}>İşlem Kaydı (son 50)</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Zaman</TableCell>
            <TableCell>Kullanıcı</TableCell>
            <TableCell>İşlem</TableCell>
            <TableCell>Kayıt</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {kayitlar.map((k) => (
            <TableRow key={k.id}>
              <TableCell>{new Date(k.zaman).toLocaleString('tr-TR')}</TableCell>
              <TableCell>{k.kullanici?.eposta ?? k.yeniDeger?.eposta ?? '—'}</TableCell>
              <TableCell>{k.eylem}</TableCell>
              <TableCell>{k.varlik ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
