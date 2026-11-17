const $ = id => document.getElementById(id);
const { t } = G6S_I18N;
const locale = () => (G6S_I18N.lang === 'tr' ? 'tr-TR' : 'en-GB');
const fmt = n => Number(n || 0).toLocaleString(locale());
const dayKey = time => new Date(time).toLocaleDateString('sv-SE');
const KIND = { text: 'kTextLc', image: 'kImageLc', video: 'kVideoLc', page: 'kPageLc' };
const summary = c => Object.keys(KIND).filter(k => c[k]).map(k => `${c[k]} ${t(KIND[k])}`).join(' · ');
const hostIn = (host, list) => list.some(d => host === d || host.endsWith('.' + d));

const versionParts = v => String(v || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
const isNewer = (a, b) => { const x = versionParts(a), y = versionParts(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };

(async () => {
  await G6S_I18N.init();
  G6SFolder.sync().catch(() => {});

  // A newer release on GitHub: one click downloads the zip, the guide explains the rest.
  const { update } = await chrome.storage.local.get({ update: null });
  const current = chrome.runtime.getManifest().version;
  if (update && update.latest && isNewer(update.latest, current)) {
    $('update').hidden = false;
    $('up-title').textContent = t('uAvail', { v: update.latest });
    $('up-sub').textContent = t('uSub', { c: current });
    $('up-go').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('ui/update.html?go=1') }));
    $('up-dl').addEventListener('click', () => chrome.tabs.create({ url: update.zip || update.page }));
  }
  const s = await chrome.storage.local.get({ enabled: true, strict: true, allowDomains: [], log: [], stats: { total: 0, days: {} }, remote: null, logging: true });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try { host = new URL(tab.url).hostname.replace(/^www\./, ''); } catch { /* browser page */ }
  const web = !!tab && /^https?:/i.test(tab.url || '');
  const allowed = hostIn(host, s.allowDomains);

  // Status line
  $('status').textContent = !s.enabled ? t('off') : allowed ? t('offHere') : t('on');
  $('dot').className = 'dot' + (!s.enabled ? ' off' : allowed ? ' partial' : '');

  // This tab: the big number is the sum of the rows under it.
  if (web) {
    chrome.tabs.sendMessage(tab.id, { type: 'getCount' }, { frameId: 0 }, r => {
      void chrome.runtime.lastError;
      if (!r) return;
      const c = r.counts || {};
      $('count').textContent = fmt((c.text || 0) + (c.image || 0) + (c.video || 0) + (c.page || 0));
      for (const b of document.querySelectorAll('[data-k]')) b.textContent = fmt(c[b.dataset.k]);
    });
  } else {
    $('tally-label').textContent = t('pBrowserPage');
  }

  // Totals
  const now = Date.now();
  $('today').textContent = fmt(s.stats.days[dayKey(now)]);
  let week = 0;
  for (let i = 0; i < 7; i++) week += s.stats.days[dayKey(now - i * 864e5)] || 0;
  $('week').textContent = fmt(week);
  $('total').textContent = fmt(s.stats.total);

  // Recent history: time, site and counts only; the path stays encrypted here.
  const recent = s.log.slice().sort((a, b) => b.t - a.t).slice(0, 3);
  $('recent-empty').hidden = recent.length > 0;
  if (!s.logging) $('recent-empty').textContent = t('pLogOff');
  for (const e of recent) {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date(e.t).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    const h = document.createElement('span'); h.className = 'host'; h.textContent = e.host;
    const c = document.createElement('span'); c.className = 'sum'; c.textContent = summary(e.c);
    li.append(time, h, c);
    $('recent').append(li);
  }

  // Remote list status
  const r = s.remote;
  $('list-status').textContent = !r ? t('pListNone')
    : r.okAt ? t('pListOk', { date: new Date(r.okAt).toLocaleDateString(locale()) }) + (r.error ? t('pListFail') : '')
      : t('pListUnreach');

  const save = async patch => { await chrome.storage.local.set(patch); await G6SFolder.sync().catch(() => {}); };
  const reload = () => { if (web) chrome.tabs.reload(tab.id); window.close(); };

  // Per-site switch: turning protection off takes a second click; a dialog can close the popup.
  const site = $('site');
  $('site-name').textContent = host || t('pThisSite');
  site.checked = !allowed;
  if (!web || !s.enabled) $('site-row').hidden = true;
  site.addEventListener('change', async () => {
    if (!site.checked && !site.dataset.sure) {
      site.checked = true;
      site.dataset.sure = '1';
      $('site-name').textContent = t('pSiteSure');
      return;
    }
    const allowDomains = site.checked ? s.allowDomains.filter(d => !(host === d || host.endsWith('.' + d))) : s.allowDomains.concat(host);
    await save({ allowDomains });
    reload();
  });

  // Strict mode
  const strict = $('strict');
  strict.checked = s.strict;
  strict.addEventListener('change', async () => { await save({ strict: strict.checked }); reload(); });

  // Master switch: two clicks to turn off, one to turn on.
  const master = $('master');
  if (!s.enabled) { master.className = 'btn btn-primary wide'; $('master-label').textContent = t('pOn'); $('controls').hidden = true; }
  master.addEventListener('click', async () => {
    if (s.enabled && !master.dataset.sure) {
      master.dataset.sure = '1';
      master.classList.add('btn-sure');
      $('master-label').textContent = t('pOffSure');
      return;
    }
    await save({ enabled: !s.enabled });
    reload();
  });
})();
