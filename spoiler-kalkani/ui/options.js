const $ = id => document.getElementById(id);
const fmt = n => Number(n || 0).toLocaleString('tr-TR');
const dayKey = t => new Date(t).toLocaleDateString('sv-SE');
const DEFAULT_LIST_URL = 'https://raw.githubusercontent.com/alifurkansimsek/spoiler-kalkani/main/liste.json';
const DEFAULTS = { enabled: true, strict: true, visual: true, placeholders: false, logging: true, terms: [], customDomains: [], allowDomains: [], listUrl: DEFAULT_LIST_URL, log: [], stats: { total: 0, days: {} }, remote: null };
const lines = id => $(id).value.split('\n').map(s => s.trim()).filter(Boolean);
const cleanDomain = d => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
}
async function save(patch, msg = 'Kaydedildi') {
  await chrome.storage.local.set(patch);
  await G6SFolder.sync().catch(() => {});
  toast(msg);
  renderSync();
}

/* Tabs */
function showTab() {
  const id = (location.hash || '#genel').slice(1);
  for (const p of document.querySelectorAll('.panel')) p.hidden = p.id !== id;
  for (const a of document.querySelectorAll('.tabs a')) {
    if (a.dataset.tab === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  if (id === 'gecmis') renderLog();
}
addEventListener('hashchange', showTab);

/* Protection */
async function renderState() {
  const s = await chrome.storage.local.get(DEFAULTS);
  $('state-dot').className = 'dot' + (s.enabled ? '' : ' off');
  $('state-title').textContent = s.enabled ? 'Koruma açık' : 'Koruma kapalı';
  $('state-sub').textContent = s.enabled ? (s.allowDomains.length ? `${s.allowDomains.length} site dışında her yerde çalışıyor.` : 'Her sitede çalışıyor.') : 'Hiçbir sitede içerik gizlenmiyor.';
  const b = $('state-btn');
  b.textContent = s.enabled ? 'Kapat' : 'Aç';
  b.className = s.enabled ? 'btn btn-danger' : 'btn btn-primary';
  delete b.dataset.sure;
  for (const i of document.querySelectorAll('input[data-key]')) i.checked = !!s[i.dataset.key];
}
$('state-btn').addEventListener('click', async e => {
  const s = await chrome.storage.local.get(DEFAULTS);
  const b = e.currentTarget;
  if (s.enabled && !b.dataset.sure) { b.dataset.sure = '1'; b.classList.add('btn-sure'); b.textContent = 'Emin misin? Tekrar tıkla'; return; }
  await save({ enabled: !s.enabled }, s.enabled ? 'Koruma kapatıldı' : 'Koruma açıldı');
  renderState();
});
for (const i of document.querySelectorAll('input[data-key]')) i.addEventListener('change', () => save({ [i.dataset.key]: i.checked }));

/* History */
let keyPromise = null;
async function logKey() {
  const { logKey: jwk } = await chrome.storage.local.get('logKey');
  return jwk ? crypto.subtle.importKey('jwk', jwk, 'AES-GCM', false, ['decrypt']) : null;
}
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function decryptPath(p) {
  keyPromise = keyPromise || logKey();
  const key = await keyPromise;
  if (!key) return '';
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(p.iv) }, key, fromB64(p.ct));
  return new TextDecoder().decode(plain);
}
const KINDS = [['text', 'i-text', 'metin'], ['image', 'i-image', 'görsel'], ['video', 'i-video', 'video'], ['page', 'i-page', 'sayfa']];
const svgUse = id => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'icon'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', `icons.svg#${id}`); s.append(u); return s; };

async function renderLog() {
  const { log, stats, logging } = await chrome.storage.local.get(DEFAULTS);
  const now = Date.now();
  $('st-today').textContent = fmt(stats.days[dayKey(now)]);
  let week = 0;
  for (let i = 0; i < 7; i++) week += stats.days[dayKey(now - i * 864e5)] || 0;
  $('st-week').textContent = fmt(week);
  $('st-total').textContent = fmt(stats.total);

  const days = Array.from({ length: 14 }, (_, i) => dayKey(now - (13 - i) * 864e5));
  const max = Math.max(1, ...days.map(d => stats.days[d] || 0));
  $('bars').replaceChildren(...days.map(d => {
    const i = document.createElement('i');
    const v = stats.days[d] || 0;
    i.style.height = `${Math.max(4, (v / max) * 100)}%`;
    if (!v) i.className = 'zero';
    i.title = `${new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}: ${fmt(v)}`;
    return i;
  }));

  const q = $('filter').value.trim().toLowerCase();
  const rows = log.slice().sort((a, b) => b.t - a.t).filter(e => !q || e.host.includes(q)).slice(0, 300);
  $('log-empty').hidden = rows.length > 0;
  $('log-empty').textContent = logging ? 'Kayıt yok.' : 'Geçmiş kaydı kapalı. Koruma bölümünden açabilirsin.';
  $('log').replaceChildren(...rows.map(e => {
    const tr = document.createElement('tr');
    const t = document.createElement('td');
    t.textContent = new Date(e.t).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const h = document.createElement('td'); h.className = 'host'; h.textContent = e.host;
    const k = document.createElement('td'); const wrap = document.createElement('div'); wrap.className = 'kinds';
    for (const [key, icon, label] of KINDS) if (e.c[key]) { const sp = document.createElement('span'); sp.title = label; sp.append(svgUse(icon), document.createTextNode(fmt(e.c[key]))); wrap.append(sp); }
    k.append(wrap);
    const p = document.createElement('td'); p.className = 'path';
    if (e.p) {
      const b = document.createElement('button');
      b.className = 'btn btn-ghost reveal';
      b.append(svgUse('i-eye'), document.createTextNode('Göster'));
      b.addEventListener('click', async () => {
        if (!confirm('Adres yolu spoiler içerebilir (ör. haber başlığı). Göstermek istiyor musun?')) return;
        try { p.textContent = await decryptPath(e.p); } catch { p.textContent = 'Açılamadı'; }
      });
      p.append(b);
    } else p.textContent = '/';
    tr.append(t, h, k, p);
    return tr;
  }));
}
$('filter').addEventListener('input', renderLog);
$('clear').addEventListener('click', async () => {
  if (!confirm('Tüm engel geçmişi ve istatistikler silinsin mi? Geri alınamaz.')) return;
  await chrome.storage.local.set({ log: [], stats: { total: 0, days: {} } });
  renderLog();
  toast('Geçmiş silindi');
});

/* Lists */
async function renderLists() {
  const s = await chrome.storage.local.get(DEFAULTS);
  for (const k of ['terms', 'customDomains', 'allowDomains']) $(k).value = s[k].join('\n');
  $('listUrl').value = s.listUrl || '';
  const r = s.remote;
  $('list-info').textContent = !r ? 'Henüz indirilmedi.'
    : (r.okAt ? `Son başarılı güncelleme: ${new Date(r.okAt).toLocaleString('tr-TR')} · ${r.strong.length} terim, ${r.videoIds.length} video, ${r.domains.length} site.` : 'Henüz başarılı bir indirme yok.')
      + (r.error ? ` Son deneme: ${r.error}.` : '');
}
$('save-lists').addEventListener('click', async () => {
  await save({
    terms: [...new Set(lines('terms'))],
    customDomains: [...new Set(lines('customDomains').map(cleanDomain))],
    allowDomains: [...new Set(lines('allowDomains').map(cleanDomain))]
  }, 'Listeler kaydedildi');
  renderLists();
});
$('list-refresh').addEventListener('click', async () => {
  const url = $('listUrl').value.trim();
  if (url && !/^https:\/\//.test(url)) { toast('Adres https:// ile başlamalı'); return; }
  await chrome.storage.local.set({ listUrl: url });
  $('list-refresh').disabled = true;
  await chrome.runtime.sendMessage({ type: 'refreshList' }).catch(() => null);
  $('list-refresh').disabled = false;
  await renderLists();
  toast('Liste kontrol edildi');
});

/* Sync */
async function renderSync() {
  const st = await G6SFolder.status();
  const { folderWrittenAt } = await chrome.storage.local.get('folderWrittenAt');
  const btn = $('sync-btn');
  const set = (title, sub, label, primary = true) => { $('sync-title').textContent = title; $('sync-sub').textContent = sub; btn.textContent = label; btn.className = primary ? 'btn btn-primary' : 'btn'; btn.hidden = !label; };
  if (st === 'unsupported') set(navigator.brave ? 'Brave klasöre yazamıyor, yalnızca okuyor' : 'Bu tarayıcı klasöre yazmayı desteklemiyor',
    navigator.brave ? 'Diğer tarayıcıdaki değişiklikler buraya gelir. Buradaki değişiklikleri göndermek için brave://flags/#file-system-access-api seçeneğini aç ya da "Ayarları dosyaya aktar" ile indirdiğin dosyayı spoiler-kalkani klasörüne ayarlar.json adıyla kaydet.' : 'Dışa/içe aktarma düğmelerini kullan.', '');
  else if (st === 'none') set('Klasör bağlı değil', 'Bu tarayıcıyı klasöre bir kez bağla.', 'Klasörü bağla');
  else if (st === 'permission') set('Klasör bağlı, izin gerekiyor', 'Tarayıcı yeniden açılınca izin bir kez daha istenebilir.', 'İzin ver');
  else set('Klasör bağlı', folderWrittenAt ? `Son yazma: ${new Date(folderWrittenAt).toLocaleString('tr-TR')}` : 'Ayarlar klasörle eşitleniyor.', 'Şimdi eşitle', false);
  btn.dataset.state = st;
}
$('sync-btn').addEventListener('click', async e => {
  $('sync-error').textContent = '';
  try {
    const st = e.currentTarget.dataset.state;
    if (st === 'none') { await G6SFolder.link(); toast('Klasör bağlandı'); }
    else if (st === 'permission') { if (await G6SFolder.grant()) { await G6SFolder.sync(); toast('İzin verildi'); } }
    else { await chrome.runtime.sendMessage({ type: 'readFolder' }); await G6SFolder.write(); toast('Eşitlendi'); }
  } catch (err) {
    if (err && err.name !== 'AbortError') $('sync-error').textContent = err.message || String(err);
  }
  renderSync(); renderState(); renderLists();
});
$('export').addEventListener('click', async () => {
  const all = await chrome.storage.local.get(null);
  const keys = ['enabled', 'strict', 'visual', 'placeholders', 'logging', 'terms', 'customDomains', 'allowDomains', 'customHashes', 'listUrl'];
  const settings = Object.fromEntries(keys.filter(k => k in all).map(k => [k, all[k]]));
  const blob = new Blob([JSON.stringify({ version: 1, app: 'Spoiler Kalkanı', updatedAt: Date.now(), settings }, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'ayarlar.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('import-file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (!j || !j.settings) throw new Error();
    const keys = ['enabled', 'strict', 'visual', 'placeholders', 'logging', 'terms', 'customDomains', 'allowDomains', 'customHashes', 'listUrl'];
    await save(Object.fromEntries(keys.filter(k => k in j.settings).map(k => [k, j.settings[k]])), 'Ayarlar içe aktarıldı');
    renderState(); renderLists();
  } catch { toast('Bu dosya bir Spoiler Kalkanı ayar dosyası değil'); }
  e.target.value = '';
});

/* Start */
$('ver').textContent = chrome.runtime.getManifest().version;
(async () => {
  await G6SFolder.sync().catch(() => {});
  await Promise.all([renderState(), renderLists(), renderSync()]);
  showTab();
})();
chrome.storage.onChanged.addListener((c, area) => {
  if (area !== 'local') return;
  if (c.log || c.stats) { if (!$('gecmis').hidden) renderLog(); }
  if (c.remote) renderLists();
});
