const $ = id => document.getElementById(id);
const fmt = n => Number(n || 0).toLocaleString('tr-TR');
const dayKey = t => new Date(t).toLocaleDateString('sv-SE');
const KIND = { text: 'metin', image: 'görsel', video: 'video', page: 'sayfa' };
const summary = c => Object.keys(KIND).filter(k => c[k]).map(k => `${c[k]} ${KIND[k]}`).join(' · ');
const hostIn = (host, list) => list.some(d => host === d || host.endsWith('.' + d));

(async () => {
  G6SFolder.sync().catch(() => {});
  const s = await chrome.storage.local.get({ enabled: true, strict: true, allowDomains: [], log: [], stats: { total: 0, days: {} }, remote: null, logging: true });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try { host = new URL(tab.url).hostname.replace(/^www\./, ''); } catch { /* browser page */ }
  const web = !!tab && /^https?:/i.test(tab.url || '');
  const allowed = hostIn(host, s.allowDomains);

  // Status line
  $('status').textContent = !s.enabled ? 'Koruma kapalı' : allowed ? 'Bu sitede kapalı' : 'Koruma açık';
  $('dot').className = 'dot' + (!s.enabled ? ' off' : allowed ? ' partial' : '');

  // This tab
  if (web) {
    chrome.tabs.sendMessage(tab.id, { type: 'getCount' }, { frameId: 0 }, r => {
      void chrome.runtime.lastError;
      if (!r) return;
      const c = r.counts || {};
      $('count').textContent = fmt((c.text || 0) + (c.image || 0) + (c.video || 0) + (c.page || 0));
      for (const b of document.querySelectorAll('[data-k]')) b.textContent = fmt(c[b.dataset.k]);
    });
  } else {
    $('tally-label').textContent = 'Tarayıcının kendi sayfalarında eklentiler çalışamaz';
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
  if (!s.logging) $('recent-empty').textContent = 'Geçmiş kaydı kapalı.';
  for (const e of recent) {
    const li = document.createElement('li');
    const t = document.createElement('time');
    t.textContent = new Date(e.t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const h = document.createElement('span'); h.className = 'host'; h.textContent = e.host;
    const c = document.createElement('span'); c.className = 'sum'; c.textContent = summary(e.c);
    li.append(t, h, c);
    $('recent').append(li);
  }

  // Remote list status
  const r = s.remote;
  $('list-status').textContent = !r ? 'Terim listesi henüz indirilmedi'
    : r.okAt ? `Terim listesi ${new Date(r.okAt).toLocaleDateString('tr-TR')} tarihinde güncellendi` + (r.error ? ' · son deneme başarısız' : '')
      : 'Terim listesine ulaşılamadı, yerleşik liste kullanılıyor';

  const save = async patch => { await chrome.storage.local.set(patch); await G6SFolder.sync().catch(() => {}); };
  const reload = () => { if (web) chrome.tabs.reload(tab.id); window.close(); };

  // Per-site switch
  const site = $('site');
  $('site-name').textContent = host || 'bu site';
  site.checked = !allowed;
  if (!web || !s.enabled) $('site-row').hidden = true;
  site.addEventListener('change', async () => {
    // Turning protection off for a site takes a second click; a confirm dialog can close the popup.
    if (!site.checked && !site.dataset.sure) {
      site.checked = true;
      site.dataset.sure = '1';
      $('site-name').textContent = 'emin misin? tekrar bas';
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
  if (!s.enabled) { master.className = 'btn btn-primary wide'; $('master-label').textContent = 'Korumayı aç'; $('controls').hidden = true; }
  master.addEventListener('click', async () => {
    if (s.enabled && !master.dataset.sure) {
      master.dataset.sure = '1';
      master.classList.add('btn-sure');
      $('master-label').textContent = 'Her yerde kapanacak. Tekrar tıkla';
      return;
    }
    await save({ enabled: !s.enabled });
    reload();
  });
})();
