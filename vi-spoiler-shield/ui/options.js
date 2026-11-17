const $ = id => document.getElementById(id);
const { t } = G6S_I18N;
const locale = () => (G6S_I18N.lang === 'tr' ? 'tr-TR' : 'en-GB');
const fmt = n => Number(n || 0).toLocaleString(locale());
const dayKey = time => new Date(time).toLocaleDateString('sv-SE');
const DEFAULT_LIST_URL = 'https://raw.githubusercontent.com/alifurkansimsek/vi-spoiler-shield/main/liste.json';
const DEFAULTS = { enabled: true, strict: true, visual: true, placeholders: false, logging: true, lang: 'auto', terms: [], customDomains: [], allowDomains: [], listUrl: DEFAULT_LIST_URL, log: [], stats: { total: 0, days: {} }, remote: null };
const SETTING_KEYS = ['enabled', 'strict', 'visual', 'placeholders', 'logging', 'lang', 'terms', 'customDomains', 'allowDomains', 'customHashes', 'listUrl'];
const lines = id => $(id).value.split('\n').map(s => s.trim()).filter(Boolean);
const cleanDomain = d => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}
async function save(patch, msg) {
  await chrome.storage.local.set(patch);
  await G6SFolder.sync().catch(() => {});
  toast(msg || t('saved'));
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
  $('state-title').textContent = s.enabled ? t('on') : t('off');
  $('state-sub').textContent = s.enabled ? (s.allowDomains.length ? t('oExcept', { n: s.allowDomains.length }) : t('oEverywhere')) : t('oNowhere');
  const b = $('state-btn');
  b.textContent = s.enabled ? t('oTurnOff') : t('oTurnOn');
  b.className = s.enabled ? 'btn btn-danger' : 'btn btn-primary';
  delete b.dataset.sure;
  for (const i of document.querySelectorAll('input[data-key]')) i.checked = !!s[i.dataset.key];
  $('lang').value = s.lang || 'auto';
}
$('state-btn').addEventListener('click', async e => {
  const s = await chrome.storage.local.get(DEFAULTS);
  const b = e.currentTarget;
  if (s.enabled && !b.dataset.sure) { b.dataset.sure = '1'; b.classList.add('btn-sure'); b.textContent = t('sure'); return; }
  await save({ enabled: !s.enabled }, s.enabled ? t('oProtectionOff') : t('oProtectionOn'));
  renderState();
});
for (const i of document.querySelectorAll('input[data-key]')) i.addEventListener('change', () => save({ [i.dataset.key]: i.checked }));
$('lang').addEventListener('change', async () => {
  const v = $('lang').value;
  G6S_I18N.setLang(v);
  G6S_I18N.apply();
  await save({ lang: v });
  renderAll();
});

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
const KINDS = [['text', 'i-text', 'kTextLc'], ['image', 'i-image', 'kImageLc'], ['video', 'i-video', 'kVideoLc'], ['page', 'i-page', 'kPageLc']];
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
    i.title = `${new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}: ${fmt(v)}`;
    return i;
  }));

  const q = $('filter').value.trim().toLowerCase();
  const rows = log.slice().sort((a, b) => b.t - a.t).filter(e => !q || e.host.includes(q)).slice(0, 300);
  $('log-empty').hidden = rows.length > 0;
  $('log-empty').textContent = logging ? t('oNoLog') : t('oLogOffNote');
  $('log').replaceChildren(...rows.map(e => {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = new Date(e.t).toLocaleString(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const h = document.createElement('td'); h.className = 'host'; h.textContent = e.host;
    const k = document.createElement('td'); const wrap = document.createElement('div'); wrap.className = 'kinds';
    for (const [key, icon, label] of KINDS) if (e.c[key]) { const sp = document.createElement('span'); sp.title = t(label); sp.append(svgUse(icon), document.createTextNode(fmt(e.c[key]))); wrap.append(sp); }
    k.append(wrap);
    const p = document.createElement('td'); p.className = 'path';
    if (e.p) {
      const b = document.createElement('button');
      b.className = 'btn btn-ghost reveal';
      b.append(svgUse('i-eye'), document.createTextNode(t('oShow')));
      b.addEventListener('click', async () => {
        if (!confirm(t('oRevealConfirm'))) return;
        try { p.textContent = await decryptPath(e.p); } catch { p.textContent = t('oCantOpen'); }
      });
      p.append(b);
    } else p.textContent = '/';
    tr.append(td, h, k, p);
    return tr;
  }));
}
$('filter').addEventListener('input', renderLog);
$('clear').addEventListener('click', async () => {
  if (!confirm(t('oClearConfirm'))) return;
  await chrome.storage.local.set({ log: [], stats: { total: 0, days: {} } });
  renderLog();
  toast(t('oCleared'));
});

/* Lists */
async function renderLists() {
  const s = await chrome.storage.local.get(DEFAULTS);
  for (const k of ['terms', 'customDomains', 'allowDomains']) $(k).value = s[k].join('\n');
  $('listUrl').value = s.listUrl || '';
  const r = s.remote;
  $('list-info').textContent = !r ? t('oRemoteNone')
    : (r.okAt ? t('oRemoteOk', { date: new Date(r.okAt).toLocaleString(locale()), s: r.strong.length, v: r.videoIds.length, d: r.domains.length }) : t('oRemoteNoOk'))
      + (r.error ? t('oRemoteErr', { e: r.error }) : '');
}
$('save-lists').addEventListener('click', async () => {
  await save({
    terms: [...new Set(lines('terms'))],
    customDomains: [...new Set(lines('customDomains').map(cleanDomain))],
    allowDomains: [...new Set(lines('allowDomains').map(cleanDomain))]
  }, t('oListsSaved'));
  renderLists();
});
$('list-refresh').addEventListener('click', async () => {
  const url = $('listUrl').value.trim();
  if (url && !/^https:\/\//.test(url)) { toast(t('oHttps')); return; }
  await chrome.storage.local.set({ listUrl: url });
  $('list-refresh').disabled = true;
  await chrome.runtime.sendMessage({ type: 'refreshList' }).catch(() => null);
  $('list-refresh').disabled = false;
  await renderLists();
  toast(t('oChecked'));
});

/* Sync */
async function renderSync() {
  const st = await G6SFolder.status();
  const { folderWrittenAt } = await chrome.storage.local.get('folderWrittenAt');
  const btn = $('sync-btn');
  const set = (title, sub, label, primary = true) => { $('sync-title').textContent = title; $('sync-sub').textContent = sub; btn.textContent = label; btn.className = primary ? 'btn btn-primary' : 'btn'; btn.hidden = !label; };
  if (st === 'unsupported') set(navigator.brave ? t('sBrave') : t('sUnsupported'), navigator.brave ? t('sBraveSub') : t('sUnsupportedSub'), '');
  else if (st === 'none') set(t('sNone'), t('sNoneSub'), t('sLink'));
  else if (st === 'permission') set(t('sPerm'), t('sPermSub'), t('sGrant'));
  else set(t('sReady'), folderWrittenAt ? t('sLastWrite', { date: new Date(folderWrittenAt).toLocaleString(locale()) }) : t('sReadySub'), t('sSyncNow'), false);
  btn.dataset.state = st;
}
$('sync-btn').addEventListener('click', async e => {
  $('sync-error').textContent = '';
  try {
    const st = e.currentTarget.dataset.state;
    if (st === 'none') { await G6SFolder.link(); toast(t('sLinked')); }
    else if (st === 'permission') { if (await G6SFolder.grant()) { await G6SFolder.sync(); toast(t('sGranted')); } }
    else { await chrome.runtime.sendMessage({ type: 'readFolder' }); await G6SFolder.write(); toast(t('sSynced')); }
  } catch (err) {
    if (err && err.name !== 'AbortError') $('sync-error').textContent = err.message || String(err);
  }
  renderSync(); renderState(); renderLists();
});
$('export').addEventListener('click', async () => {
  const all = await chrome.storage.local.get(null);
  const settings = Object.fromEntries(SETTING_KEYS.filter(k => k in all).map(k => [k, all[k]]));
  const blob = new Blob([JSON.stringify({ version: 1, app: 'VI Spoiler Shield', updatedAt: Date.now(), settings }, null, 2)], { type: 'application/json' });
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
    const next = Object.fromEntries(SETTING_KEYS.filter(k => k in j.settings).map(k => [k, j.settings[k]]));
    // Files exported before 1.1.2 point to the list under the repository's old name.
    if (next.listUrl === DEFAULT_LIST_URL.replace('vi-spoiler-shield', 'vi-spoiler-kalkani')) next.listUrl = DEFAULT_LIST_URL;
    await save(next, t('sImported'));
    renderAll();
  } catch { toast(t('sBadFile')); }
  e.target.value = '';
});

/* New version */
const versionParts = v => String(v || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
const isNewer = (a, b) => { const x = versionParts(a), y = versionParts(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
async function renderUpdate() {
  const { update } = await chrome.storage.local.get({ update: null });
  const current = chrome.runtime.getManifest().version;
  const available = !!(update && update.latest && isNewer(update.latest, current));
  $('update-card').classList.toggle('has-update', available);
  $('uc-title').textContent = available ? t('uAvail', { v: update.latest }) : t('uCard');
  $('uc-sub').textContent = available ? t('uSub', { c: current }) : update && update.error && !update.latest ? t('uFail') : t('uLatest', { c: current });
  $('uc-go').hidden = $('uc-dl').hidden = $('uc-how').hidden = !available;
  $('uc-dl').onclick = () => chrome.tabs.create({ url: update.zip || update.page });
}
$('uc-check').addEventListener('click', async () => {
  const b = $('uc-check'); b.disabled = true;
  $('uc-sub').textContent = t('uChecking');
  await chrome.runtime.sendMessage({ type: 'checkUpdate' }).catch(() => {});
  b.disabled = false;
  renderUpdate();
});

/* Start */
function renderAll() { return Promise.all([renderState(), renderLists(), renderSync(), renderUpdate(), $('gecmis').hidden ? null : renderLog()]); }
$('ver').textContent = $('ver2').textContent = chrome.runtime.getManifest().version;
(async () => {
  await G6S_I18N.init();
  await G6SFolder.sync().catch(() => {});
  await renderAll();
  showTab();
})();
chrome.storage.onChanged.addListener((c, area) => {
  if (area !== 'local') return;
  if (c.log || c.stats) { if (!$('gecmis').hidden) renderLog(); }
  if (c.remote) renderLists();
  if (c.update) renderUpdate();
});
