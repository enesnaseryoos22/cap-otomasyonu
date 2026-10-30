// Sunucuya istek atan tek yardımcı. Değiştirici isteklerde CSRF jetonunu başlığa ekler.
function csrfJetonu() {
  return document.cookie.split('; ').find((c) => c.startsWith('csrf='))?.slice(5) ?? '';
}

// govde FormData ise (dosya yükleme) olduğu gibi gönderilir; tarayıcı türünü kendisi ayarlar.
export async function api(yol, { method = 'GET', govde } = {}) {
  const form = govde instanceof FormData;
  const yanit = await fetch(`/api${yol}`, {
    method,
    headers: {
      ...(govde && !form ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRF-Token': csrfJetonu() } : {}),
    },
    body: form ? govde : govde ? JSON.stringify(govde) : undefined,
  });
  const veri = await yanit.json().catch(() => ({}));
  if (!yanit.ok) {
    const hata = new Error(veri.hata || 'Sunucuya ulaşılamadı.');
    hata.durum = yanit.status;
    throw hata;
  }
  return veri;
}
