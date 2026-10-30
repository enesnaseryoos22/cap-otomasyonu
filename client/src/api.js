// Sunucuya istek atan tek yardımcı. Değiştirici isteklerde CSRF jetonunu başlığa ekler.
function csrfJetonu() {
  return document.cookie.split('; ').find((c) => c.startsWith('csrf='))?.slice(5) ?? '';
}

export async function api(yol, { method = 'GET', govde } = {}) {
  const yanit = await fetch(`/api${yol}`, {
    method,
    headers: {
      ...(govde ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRF-Token': csrfJetonu() } : {}),
    },
    body: govde ? JSON.stringify(govde) : undefined,
  });
  const veri = await yanit.json().catch(() => ({}));
  if (!yanit.ok) {
    const hata = new Error(veri.hata || 'Sunucuya ulaşılamadı.');
    hata.durum = yanit.status;
    throw hata;
  }
  return veri;
}
