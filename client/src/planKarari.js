import { api } from './api.js';

// Koordinatörün onay/ret kararı. Ret için gerekçe zorunludur; vazgeçilirse null döner.
export async function planKarariVer(planId, karar) {
  if (karar === 'REDDET') {
    const gerekce = window.prompt('Ret gerekçesi:');
    if (!gerekce?.trim()) return null;
    return api(`/plan/${planId}/karar`, { method: 'POST', govde: { karar, gerekce } });
  }
  return api(`/plan/${planId}/karar`, { method: 'POST', govde: { karar } });
}
