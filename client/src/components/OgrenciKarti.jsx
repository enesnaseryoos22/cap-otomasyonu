import { useState } from 'react';
import {
  Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import OzetKarti from './OzetKarti.jsx';
import { PROGRAM, OGRENCI_DURUMU, DERS_DURUMU, ONAY_DURUMU, donemAdi } from '../etiketler.js';
import { planKarariVer } from '../planKarari.js';

// Öğrenci kartı: kimlik, AKTS özeti ve ders planı. Üç rol de aynı kartı görür;
// yalnız koordinatör (onaylayabilir) onay/ret düğmelerini görür.
export default function OgrenciKarti({ kart, onaylayabilir = false, yenile, ustDugme }) {
  const [hata, setHata] = useState('');
  const { akts } = kart;
  const yuzde = akts.gerekli ? Math.min(Math.round((akts.tamamlanan / akts.gerekli) * 100), 100) : 0;

  async function karar(planId, tur) {
    setHata('');
    try {
      if (await planKarariVer(planId, tur)) yenile();
    } catch (e) {
      setHata(e.message);
    }
  }

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">{kart.adSoyad}</Typography>
        <Typography color="text.secondary">
          {kart.ogrenciNo} · {PROGRAM[kart.programTuru]} · Anadal: {kart.anadalBolum.ad}
        </Typography>
        <Typography color="text.secondary">
          Kabul dönemi: {donemAdi(kart.kabulDonemi)} · Durum: {OGRENCI_DURUMU[kart.durum]}
        </Typography>
        {kart.protokolAdi && <Typography color="text.secondary">Protokol: {kart.protokolAdi}</Typography>}
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <OzetKarti etiket="Gerekli AKTS (protokol)" deger={akts.gerekli ?? '—'} />
        <OzetKarti etiket="Tamamlanan AKTS" deger={akts.tamamlanan} />
        <OzetKarti etiket="Kalan AKTS" deger={akts.kalan ?? '—'} />
        <OzetKarti etiket="Devam eden / planlanan" deger={`${akts.devamEden} / ${akts.planlanan}`} />
        <OzetKarti etiket="Onay bekleyen AKTS" deger={akts.onayBekleyen} />
      </Stack>
      {akts.gerekli > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" gutterBottom>İlerleme: %{yuzde}</Typography>
          <LinearProgress variant="determinate" value={yuzde} sx={{ height: 10, borderRadius: 5 }} />
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Ders Planı</Typography>
          {ustDugme}
        </Box>
        {hata && <Alert severity="error" sx={{ mx: 2, mb: 2 }} onClose={() => setHata('')}>{hata}</Alert>}
        {kart.planDersleri.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>Ders planında henüz ders yok.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kod</TableCell>
                <TableCell>Ders</TableCell>
                <TableCell>Yarıyıl</TableCell>
                <TableCell>AKTS</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Onay</TableCell>
                {onaylayabilir && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {kart.planDersleri.map((p) => (
                <TableRow key={p.id} sx={p.onayDurumu === 'REDDEDILDI' ? { opacity: 0.6 } : undefined}>
                  <TableCell>{p.ders.kod}</TableCell>
                  <TableCell>{p.ders.ad}</TableCell>
                  <TableCell>{p.ders.yariyil}</TableCell>
                  <TableCell>{p.ders.akts}</TableCell>
                  <TableCell>{DERS_DURUMU[p.durum]}</TableCell>
                  <TableCell>
                    <Tooltip title={p.redGerekcesi ? `Gerekçe: ${p.redGerekcesi}` : ''}>
                      <Chip size="small" label={ONAY_DURUMU[p.onayDurumu].etiket} color={ONAY_DURUMU[p.onayDurumu].renk} />
                    </Tooltip>
                    {p.redGerekcesi && <Typography variant="caption" sx={{ display: 'block' }}>{p.redGerekcesi}</Typography>}
                  </TableCell>
                  {onaylayabilir && (
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {p.onayDurumu === 'ONAY_BEKLIYOR' && (
                        <>
                          <Button size="small" color="success" onClick={() => karar(p.id, 'ONAYLA')}>Onayla</Button>
                          <Button size="small" color="error" onClick={() => karar(p.id, 'REDDET')}>Reddet</Button>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </>
  );
}
