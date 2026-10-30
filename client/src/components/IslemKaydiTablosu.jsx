import { useEffect, useState } from 'react';
import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../api.js';
import { ONAY_DURUMU, PROGRAM } from '../etiketler.js';

// İşlem kodlarının okunur adları (kayıtta kod saklanır)
const ISLEM = {
  GIRIS_BASARILI: 'Giriş', GIRIS_BASARISIZ: 'Hatalı giriş', GIRIS_KILITLI_HESAP: 'Kilitli hesaba giriş denemesi',
  HESAP_KILITLENDI: 'Hesap kilitlendi', CIKIS: 'Çıkış',
  OGRENCI_EKLENDI: 'Öğrenci eklendi', HESAP_ACILDI: 'Hesap açıldı',
  PLAN_DERS_ISTENDI: 'Ders seçildi (onaya gönderildi)', PLAN_ONAYLANDI: 'Ders seçimi onaylandı', PLAN_REDDEDILDI: 'Ders seçimi reddedildi',
  BELGE_YUKLENDI: 'Belge yüklendi', BELGE_ONAYLANDI: 'Belge onaylandı', BELGE_REDDEDILDI: 'Belge reddedildi',
  BELGE_REDDEDILDI_GUVENLIK: 'Belge güvenlik kontrolünde reddedildi',
};
const ALAN = {
  ders: 'Ders', onayDurumu: 'Onay', redGerekcesi: 'Gerekçe', dosya: 'Dosya', tur: 'Tür', surum: 'Sürüm',
  eposta: 'E-posta', ogrenciNo: 'Öğrenci no', adSoyad: 'Ad soyad', programTuru: 'Program', neden: 'Neden',
};

const degerYaz = (v) => (v == null ? '—' : ONAY_DURUMU[v]?.etiket ?? PROGRAM[v] ?? String(v));

// Eski ve yeni değer: değişen alan "eski → yeni", diğerleri yalnız değeriyle yazılır.
// Teknik alanlar (kimlikler, dosya özeti) gösterilmez.
function degisiklik(eski, yeni) {
  const alanlar = [...new Set([...Object.keys(eski ?? {}), ...Object.keys(yeni ?? {})])]
    .filter((a) => !a.endsWith('Id') && a !== 'sha256');
  return alanlar.map((a) => {
    const e = eski?.[a];
    const y = yeni?.[a];
    const metin = eski && a in eski && e !== y ? `${degerYaz(e)} → ${degerYaz(y)}` : degerYaz(y ?? e);
    return `${ALAN[a] ?? a}: ${metin}`;
  });
}

export default function IslemKaydiTablosu() {
  const [kayitlar, setKayitlar] = useState([]);
  const [hata, setHata] = useState('');

  useEffect(() => {
    api('/islem-kaydi').then((v) => setKayitlar(v.kayitlar)).catch((e) => setHata(e.message));
  }, []);

  if (hata) return <Alert severity="error">{hata}</Alert>;

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" sx={{ p: 2, pb: 0 }}>İşlem Kaydı (son 50)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
        Kayıtlar değiştirilemez ve silinemez.
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Zaman</TableCell>
            <TableCell>Kullanıcı</TableCell>
            <TableCell>İşlem</TableCell>
            <TableCell>Değişiklik (eski → yeni)</TableCell>
            <TableCell>IP</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {kayitlar.map((k) => (
            <TableRow key={k.id}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(k.zaman).toLocaleString('tr-TR')}</TableCell>
              <TableCell>{k.kullanici?.eposta ?? k.yeniDeger?.eposta ?? '—'}</TableCell>
              <TableCell>{ISLEM[k.eylem] ?? k.eylem}</TableCell>
              <TableCell>
                {degisiklik(k.eskiDeger, k.yeniDeger).map((s) => (
                  <Typography key={s} variant="body2">{s}</Typography>
                ))}
              </TableCell>
              <TableCell>{k.ipAdresi ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
