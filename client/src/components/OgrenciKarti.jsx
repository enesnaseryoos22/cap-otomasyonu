import { useState } from 'react';
import {
  Alert, Box, Button, Chip, LinearProgress, Link, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import OzetKarti from './OzetKarti.jsx';
import {
  PROGRAM, OGRENCI_DURUMU, DERS_DURUMU, ONAY_DURUMU, BELGE_TURU, boyutYaz, donemAdi,
} from '../etiketler.js';
import { kararVer } from '../planKarari.js';

const OnayEtiketi = ({ kayit }) => (
  <>
    <Chip size="small" label={ONAY_DURUMU[kayit.onayDurumu].etiket} color={ONAY_DURUMU[kayit.onayDurumu].renk} />
    {kayit.redGerekcesi && <Typography variant="caption" sx={{ display: 'block' }}>{kayit.redGerekcesi}</Typography>}
  </>
);

// Öğrenci kartı: kimlik, AKTS özeti, ders planı ve belge arşivi. Üç rol de aynı kartı görür;
// yalnız koordinatör (onaylayabilir) onay/ret düğmelerini görür.
export default function OgrenciKarti({ kart, onaylayabilir = false, yenile, ustDugme, belgeDugmesi }) {
  const [hata, setHata] = useState('');
  const { akts } = kart;
  const yuzde = akts.gerekli ? Math.min(Math.round((akts.tamamlanan / akts.gerekli) * 100), 100) : 0;

  async function karar(kaynak, id, tur) {
    setHata('');
    try {
      if (await kararVer(kaynak, id, tur)) yenile();
    } catch (e) {
      setHata(e.message);
    }
  }

  const kararDugmeleri = (kaynak, kayit) => onaylayabilir && (
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
      {kayit.onayDurumu === 'ONAY_BEKLIYOR' && (
        <>
          <Button size="small" color="success" onClick={() => karar(kaynak, kayit.id, 'ONAYLA')}>Onayla</Button>
          <Button size="small" color="error" onClick={() => karar(kaynak, kayit.id, 'REDDET')}>Reddet</Button>
        </>
      )}
    </TableCell>
  );

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
                <TableCell>Alındığı dönem · not</TableCell>
                <TableCell>Geçtiği dönem</TableCell>
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
                  <TableCell>
                    {/* Her deneme ayrı satır (ders tekrar alındıysa birden fazla) */}
                    {p.denemeler.length === 0 && '—'}
                    {p.denemeler.map((d) => (
                      <Typography key={d.id} variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {donemAdi(d.alinanDonem)} · {d.harfNotu ?? '—'} · {DERS_DURUMU[d.sonuc]}
                        {d.onayDurumu === 'ONAY_BEKLIYOR' && ' (onay bekliyor)'}
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell>{donemAdi(p.denemeler.find((d) => d.gecilenDonem)?.gecilenDonem) || '—'}</TableCell>
                  <TableCell>{DERS_DURUMU[p.durum]}</TableCell>
                  <TableCell><OnayEtiketi kayit={p} /></TableCell>
                  {kararDugmeleri('/plan', p)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Belgeler</Typography>
          {belgeDugmesi}
        </Box>
        {kart.belgeler.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>Henüz belge yüklenmedi.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tür</TableCell>
                <TableCell>Dosya</TableCell>
                <TableCell>Sürüm</TableCell>
                <TableCell>Yükleme</TableCell>
                <TableCell>Onay</TableCell>
                {onaylayabilir && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {kart.belgeler.map((b) => (
                <TableRow key={b.id} sx={b.onayDurumu === 'REDDEDILDI' ? { opacity: 0.6 } : undefined}>
                  <TableCell>{BELGE_TURU[b.tur]}</TableCell>
                  <TableCell>
                    <Link href={`/api/belgeler/${b.id}/dosya`}>{b.orijinalAd}</Link> ({boyutYaz(b.boyut)})
                  </TableCell>
                  <TableCell>{b.surumNo}</TableCell>
                  <TableCell>{new Date(b.olusturma).toLocaleString('tr-TR')}</TableCell>
                  <TableCell><OnayEtiketi kayit={b} /></TableCell>
                  {kararDugmeleri('/belgeler', b)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </>
  );
}
