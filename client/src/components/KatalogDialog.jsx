import { useEffect, useState } from 'react';
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material';
import { api } from '../api.js';
import { DERS_TURU } from '../etiketler.js';

// Öğrencinin ders kataloğundan ders seçtiği pencere. Katalog dışı ders girilemez.
export default function KatalogDialog({ acik, kapat, eklendi, plandakiKodlar }) {
  const [dersler, setDersler] = useState([]);
  const [arama, setArama] = useState('');
  const [yalnizProtokol, setYalnizProtokol] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');

  useEffect(() => {
    if (acik) api('/katalog').then((v) => setDersler(v.dersler)).catch((e) => setHata(e.message));
  }, [acik]);

  const aranan = arama.toLocaleLowerCase('tr-TR');
  const liste = dersler.filter((d) =>
    (!yalnizProtokol || d.protokolde)
    && (d.kod.includes(aranan) || d.ad.toLocaleLowerCase('tr-TR').includes(aranan)));

  async function ekle(d) {
    setHata('');
    setMesaj('');
    try {
      await api('/plan', { method: 'POST', govde: { dersId: d.id } });
      setMesaj(`${d.kod} ${d.ad} onaya gönderildi.`);
      eklendi();
    } catch (e) {
      setHata(e.message);
    }
  }

  return (
    <Dialog open={acik} onClose={kapat} fullWidth maxWidth="md">
      <DialogTitle>Ders Kataloğu</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 1 }} alignItems="center">
          <TextField label="Ders kodu veya adı" size="small" fullWidth value={arama} onChange={(e) => setArama(e.target.value)} />
          <FormControlLabel
            control={<Switch checked={yalnizProtokol} onChange={(e) => setYalnizProtokol(e.target.checked)} />}
            label="Yalnız protokoldeki dersler"
            sx={{ whiteSpace: 'nowrap' }}
          />
        </Stack>
        {hata && <Alert severity="error" sx={{ mb: 1 }}>{hata}</Alert>}
        {mesaj && <Alert severity="success" sx={{ mb: 1 }}>{mesaj}</Alert>}
        <Alert severity="info" sx={{ mb: 1 }}>
          Seçtiğiniz ders koordinatör onaylayana kadar "Onay bekliyor" durumunda kalır. Katalogda olmayan bir ders için koordinatöre yazın.
        </Alert>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Kod</TableCell>
              <TableCell>Ders</TableCell>
              <TableCell>Yarıyıl</TableCell>
              <TableCell>AKTS</TableCell>
              <TableCell>Tür</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {liste.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.kod}</TableCell>
                <TableCell>
                  {d.ad} {d.protokolde && <Chip size="small" label="Protokolde" variant="outlined" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>{d.yariyil}</TableCell>
                <TableCell>{d.akts}</TableCell>
                <TableCell>{DERS_TURU[d.tur]}</TableCell>
                <TableCell>
                  {plandakiKodlar.has(d.kod)
                    ? <Chip size="small" label="Planda" />
                    : <Button size="small" onClick={() => ekle(d)}>Seç</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={kapat}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}
