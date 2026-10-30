import { api } from './api.js';

// Koordinatörün onay/ret kararı (ders seçimi: '/plan', belge: '/belgeler').
// Ret için gerekçe zorunludur; vazgeçilirse null döner.
export async function kararVer(kaynak, id, karar) {
  if (karar === 'REDDET') {
    const gerekce = window.prompt('Ret gerekçesi:');
    if (!gerekce?.trim()) return null;
    return api(`${kaynak}/${id}/karar`, { method: 'POST', govde: { karar, gerekce } });
  }
  return api(`${kaynak}/${id}/karar`, { method: 'POST', govde: { karar } });
}
