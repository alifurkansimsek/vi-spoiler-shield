importScripts('dictionary.js', 'matcher.js', 'hash.js', 'i18n.js', '../data/hashes.js');

// Settings shared between browsers through ayarlar.json in the extension folder.
const SYNC_KEYS = ['enabled', 'strict', 'visual', 'placeholders', 'logging', 'lang', 'terms', 'customDomains', 'allowDomains', 'customHashes', 'listUrl'];
const DEFAULT_LIST_URL = 'https://raw.githubusercontent.com/alifurkansimsek/vi-spoiler-kalkani/main/liste.json';
const DEFAULTS = {
  enabled: true, placeholders: false, visual: true, strict: true, logging: true, lang: 'auto',
  terms: [], customDomains: [], allowDomains: [], customHashes: [], listUrl: DEFAULT_LIST_URL, updatedAt: 0
};
const ALLOW_RULE_BASE = 9000;
const REMOTE_NET_CAP = 150; // remote terms that also get network rules (each costs two regex rules)

const getSettings = () => chrome.storage.local.get(DEFAULTS);
const getRemote = async () => (await chrome.storage.local.get({ remote: null })).remote;
const hostAllowed = (host, list) => list.some(d => host === d || host.endsWith('.' + d));

/* ---------- Remote term list (additive only) ---------- */
function validList(o) {
  if (!o || o.version !== 1) throw new Error('unsupported list version');
  const strs = (a, re, max) => (Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && re.test(x)).slice(0, max);
  return {
    strong: strs(o.strong, /^[a-z0-9' .\-]{4,60}$/i, 300),
    videoIds: strs(o.videoIds, /^[\w-]{11}$/, 200),
    domains: strs(o.domains, /^[a-z0-9.-]+\.[a-z]{2,}$/i, 200),
    updated: typeof o.updated === 'string' ? o.updated.slice(0, 30) : ''
  };
}
async function refreshList(force) {
  const s = await getSettings();
  const prev = await getRemote();
  if (!s.listUrl || !/^https:\/\//.test(s.listUrl)) return prev;
  if (!force && prev && Date.now() - (prev.checkedAt || 0) < 5 * 3600e3) return prev;
  const next = Object.assign({ strong: [], videoIds: [], domains: [], updated: '' }, prev || {}, { checkedAt: Date.now() });
  try {
    const r = await fetch(s.listUrl, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    if (text.length > 200000) throw new Error('list too large');
    Object.assign(next, validList(JSON.parse(text)), { okAt: Date.now(), error: '' });
  } catch (e) {
    next.error = String(e.message || e).slice(0, 80); // the last good list stays in use
  }
  await chrome.storage.local.set({ remote: next });
  return next;
}

/* ---------- Network rules ---------- */
const GAP = '(%20|[-_+.~ ])*';
function urlRegexes(terms) {
  const slug = t => t.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').map(encodeURIComponent).join(GAP);
  const core = `gta${GAP}(6|vi|six)`;
  const full = `grand${GAP}theft${GAP}auto${GAP}(6|vi|six)`;
  const strong = self.G6S_DICT.strong.map(G6S.rot13);
  // Chromium caps the compiled size of each regex rule, so every term gets its own rule.
  const all = [...new Set(strong.concat(terms).map(slug).filter(Boolean))];
  return [core, full].concat(all);
}

async function syncRules() {
  const s = await getSettings();
  const remote = (await getRemote()) || { strong: [], videoIds: [], domains: [] };
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  const add = [];
  if (s.enabled) {
    let id = 1;
    const page = chrome.runtime.getURL('ui/blocked.html');
    const netTerms = s.terms.concat(remote.strong.slice(0, REMOTE_NET_CAP).map(G6S.rot13));
    for (const re of urlRegexes(netTerms)) {
      // A URL always has a character before the term, because it starts with a scheme.
      const full = `^.*[^a-z0-9]${re}([^a-z0-9].*)?$`;
      add.push({ id: id++, priority: 1, action: { type: 'redirect', redirect: { regexSubstitution: `${page}#\\0` } }, condition: { regexFilter: full, isUrlFilterCaseSensitive: false, resourceTypes: ['main_frame', 'sub_frame'] } });
      add.push({ id: id++, priority: 1, action: { type: 'block' }, condition: { regexFilter: full, isUrlFilterCaseSensitive: false, resourceTypes: ['image', 'media', 'object'] } });
    }
    const toBlockedPage = { type: 'redirect', redirect: { regexSubstitution: `${page}#\\0` } };
    const domains = [...new Set(self.G6S_DICT.domains.concat(s.customDomains, remote.domains))];
    add.push({ id: id++, priority: 1, action: toBlockedPage, condition: { regexFilter: '^.*$', requestDomains: domains, resourceTypes: ['main_frame', 'sub_frame'] } });
    add.push({ id: id++, priority: 1, action: { type: 'block' }, condition: { requestDomains: domains, resourceTypes: ['image', 'media', 'object'] } });
    for (const v of [...new Set(self.G6S_DICT.videoIds.concat(remote.videoIds))]) {
      add.push({ id: id++, priority: 1, action: { type: 'block' }, condition: { urlFilter: `||ytimg.com/vi/${v}/`, resourceTypes: ['image'] } });
      add.push({ id: id++, priority: 1, action: { type: 'block' }, condition: { urlFilter: `||ytimg.com/vi_webp/${v}/`, resourceTypes: ['image'] } });
      add.push({ id: id++, priority: 1, action: toBlockedPage, condition: { regexFilter: `^https?://([a-z]+\\.)?youtube(-nocookie)?\\.com/(watch\\?.*v=|embed/|shorts/)${v}.*$`, resourceTypes: ['main_frame', 'sub_frame'] } });
    }
    if (s.allowDomains.length) {
      add.push({ id: ALLOW_RULE_BASE, priority: 100, action: { type: 'allowAllRequests' }, condition: { requestDomains: s.allowDomains, resourceTypes: ['main_frame', 'sub_frame'] } });
    }
  }
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id), addRules: add });
  } catch {
    // One rule over a browser limit rejects the whole batch, so fall back to adding them singly.
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id) });
    for (const rule of add) {
      try { await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] }); }
      catch (e) { console.warn('VI Spoiler Shield: rule skipped', rule.id, e.message); }
    }
  }
}

/* ---------- Settings file in the extension folder ---------- */
// Every browser loads the extension from the same folder, so ayarlar.json there is shared.
// Extension pages write it (File System Access); the worker reads it.
let importing = false;
async function readFolderSettings() {
  try {
    const r = await fetch(chrome.runtime.getURL('ayarlar.json') + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return { status: 'none' };
    const file = JSON.parse(await r.text());
    const s = await getSettings();
    if (!file || typeof file.updatedAt !== 'number' || !file.settings) return { status: 'invalid' };
    if (file.updatedAt <= s.updatedAt) return { status: 'current', updatedAt: file.updatedAt };
    const next = { updatedAt: file.updatedAt };
    const BOOLS = ['enabled', 'strict', 'visual', 'placeholders', 'logging'];
    const LISTS = ['terms', 'customDomains', 'allowDomains'];
    const fs_ = file.settings;
    for (const k of BOOLS) if (typeof fs_[k] === 'boolean') next[k] = fs_[k];
    for (const k of LISTS) {
      if (!Array.isArray(fs_[k])) continue;
      const incoming = fs_[k].filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 200));
      // allowDomains turns protection off, so it is taken as written; the other lists are merged.
      next[k] = k === 'allowDomains' ? incoming : [...new Set(s[k].concat(incoming))];
    }
    if (Array.isArray(fs_.customHashes)) {
      const ok = fs_.customHashes.filter(h => Array.isArray(h) && h.length === 50 && h.every(n => typeof n === 'number'));
      const seen = new Set(s.customHashes.map(h => h.join(',')));
      next.customHashes = s.customHashes.concat(ok.filter(h => !seen.has(h.join(','))));
    }
    if (['auto', 'tr', 'en'].includes(fs_.lang)) next.lang = fs_.lang;
    if (typeof fs_.listUrl === 'string' && (fs_.listUrl === '' || /^https:\/\//.test(fs_.listUrl))) next.listUrl = fs_.listUrl;
    importing = true;
    await chrome.storage.local.set(next);
    importing = false;
    return { status: 'imported', updatedAt: file.updatedAt };
  } catch { importing = false; return { status: 'none' }; }
}

/* ---------- Block history ---------- */
// One entry per page visit with counts. The path after the host is encrypted with a key kept
// next to the data: that prevents reading it by accident, not a determined reader.
const LOG_MAX = 1000;
let logChain = Promise.resolve();
async function logKey() {
  const { logKey: jwk } = await chrome.storage.local.get('logKey');
  if (jwk) return crypto.subtle.importKey('jwk', jwk, 'AES-GCM', false, ['encrypt']);
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  await chrome.storage.local.set({ logKey: await crypto.subtle.exportKey('jwk', key) });
  return key;
}
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function encryptPath(path) {
  if (!path || path === '/') return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await logKey(), new TextEncoder().encode(path.slice(0, 600)));
  return { iv: b64(iv), ct: b64(ct) };
}
const dayKey = t => new Date(t).toLocaleDateString('sv-SE'); // YYYY-MM-DD in local time
const sum = c => (c.text || 0) + (c.image || 0) + (c.video || 0) + (c.page || 0);

async function writeVisit(msg) {
  let u;
  try { u = new URL(msg.url); } catch { return; }
  if (!/^https?:$/.test(u.protocol)) return;
  const counts = { text: msg.counts.text | 0, image: msg.counts.image | 0, video: msg.counts.video | 0, page: msg.counts.page | 0 };
  if (!sum(counts)) return;
  const { log = [], stats = { total: 0, days: {} } } = await chrome.storage.local.get(['log', 'stats']);
  let entry = log.find(e => e.id === msg.visitId);
  const before = entry ? sum(entry.c) : 0;
  if (!entry) {
    entry = { id: msg.visitId, t: msg.startedAt || Date.now(), host: u.hostname.replace(/^www\./, ''), p: await encryptPath(u.pathname + u.search + u.hash) };
    log.unshift(entry);
  }
  // Counts only grow within a visit (a block lifted and re-applied is not counted twice).
  entry.c = { text: Math.max(counts.text, entry.c?.text || 0), image: Math.max(counts.image, entry.c?.image || 0), video: Math.max(counts.video, entry.c?.video || 0), page: Math.max(counts.page, entry.c?.page || 0) };
  const delta = sum(entry.c) - before;
  if (delta > 0) {
    stats.total += delta;
    const d = dayKey(entry.t);
    stats.days[d] = (stats.days[d] || 0) + delta;
    const keep = Object.keys(stats.days).sort().slice(-90);
    stats.days = Object.fromEntries(keep.map(k => [k, stats.days[k]]));
  }
  await chrome.storage.local.set({ log: log.slice(0, LOG_MAX), stats });
}
async function logVisit(msg, sender) {
  if (sender.tab && sender.tab.incognito) return; // private windows leave no trace
  const s = await getSettings();
  if (!s.logging) return;
  logChain = logChain.then(() => writeVisit(msg)).catch(() => {});
}

/* ---------- Single-page exception for this session ---------- */
async function allowUrlOnce(url) {
  const { allowUrls = [] } = await chrome.storage.session.get('allowUrls');
  if (!allowUrls.includes(url)) allowUrls.push(url);
  await chrome.storage.session.set({ allowUrls });
  const rules = await chrome.declarativeNetRequest.getSessionRules();
  const id = rules.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [{ id, priority: 100, action: { type: 'allowAllRequests' }, condition: { urlFilter: `|${url.replace(/[|^*]/g, '*')}|`, resourceTypes: ['main_frame', 'sub_frame'] } }]
  });
}

/* ---------- Visual fingerprint ---------- */
let extraDb = [];
async function loadCustomHashes() {
  const s = await getSettings();
  extraDb = s.customHashes.flat();
}
const hitCache = new Map();
const pending = [];
let running = 0;
const MAX_PARALLEL = 12;
const MAX_BYTES = 12e6;

function matches(hashes) {
  for (const h of hashes) {
    if (G6S.isHit(h, self.G6S_HASH_DB)) return true;
    if (extraDb.length && G6S.isHit(h, extraDb)) return true;
  }
  return false;
}
async function hashFromUrl(url) {
  const res = await fetch(url, { credentials: 'omit', cache: 'force-cache', referrerPolicy: 'no-referrer' });
  if (!res.ok) return null;
  const blob = await res.blob();
  if (blob.size > MAX_BYTES || /svg/.test(blob.type)) return null;
  const bmp = await createImageBitmap(blob);
  try {
    if (bmp.width < 48 || bmp.height < 48) return null;
    return G6S.queryHashes(bmp, bmp.width, bmp.height);
  } finally { bmp.close(); }
}
// The same URL is often requested twice (before and after the page loads it): share one fetch.
const inFlight = new Map();
function checkUrl(url) {
  if (hitCache.has(url)) return Promise.resolve(hitCache.get(url));
  if (inFlight.has(url)) return inFlight.get(url);
  const p = checkUrlNow(url).finally(() => inFlight.delete(url));
  inFlight.set(url, p);
  return p;
}
async function checkUrlNow(url) {
  let hit = false;
  try {
    const hs = await hashFromUrl(url);
    hit = !!hs && matches(hs);
  } catch { /* cross-origin failure or undecodable: nothing to compare */ }
  if (hitCache.size > 4000) hitCache.delete(hitCache.keys().next().value);
  hitCache.set(url, hit);
  return hit;
}
function pump() {
  while (running < MAX_PARALLEL && pending.length) {
    const job = pending.shift();
    running++;
    checkUrl(job.url).then(job.reply).catch(() => job.reply(false)).finally(() => { running--; pump(); });
  }
}

/* ---------- Messages ---------- */
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  switch (msg.type) {
    case 'state':
      (async () => {
        const s = await getSettings();
        const remote = (await getRemote()) || { strong: [], videoIds: [], domains: [] };
        const { allowUrls = [] } = await chrome.storage.session.get('allowUrls');
        let host = '';
        try { host = new URL(msg.url).hostname; } catch { /* about:blank */ }
        reply({
          enabled: s.enabled,
          placeholders: s.placeholders,
          visual: s.visual,
          strict: s.strict,
          lang: s.lang,
          terms: s.terms.concat(remote.strong.map(G6S.rot13)),
          videoIds: remote.videoIds,
          allowed: hostAllowed(host, s.allowDomains) || allowUrls.includes(msg.url),
          domainBlocked: hostAllowed(host, self.G6S_DICT.domains.concat(s.customDomains, remote.domains))
        });
      })();
      return true;
    case 'hashUrl':
      // Images on screen jump the queue; images just below the fold wait their turn.
      if (hitCache.has(msg.url) || inFlight.has(msg.url)) { checkUrl(msg.url).then(hit => reply({ hit })); return true; }
      pending[msg.urgent ? 'unshift' : 'push']({ url: msg.url, reply: hit => reply({ hit }) });
      pump();
      return true;
    case 'hashQuery':
      reply({ hit: matches(msg.hashes || []) });
      return;
    case 'ytInfo':
      (async () => {
        try {
          const u = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + msg.id)}`;
          const r = await fetch(u, { credentials: 'omit' });
          const j = r.ok ? await r.json() : null;
          reply({ text: j ? `${j.title || ''} \n ${j.author_name || ''}` : '' });
        } catch { reply({ text: '' }); }
      })();
      return true;
    case 'allowUrl':
      allowUrlOnce(msg.url).then(() => reply({ ok: true }));
      return true;
    case 'count':
      if (sender.tab) {
        chrome.action.setBadgeText({ tabId: sender.tab.id, text: msg.count ? String(Math.min(msg.count, 999)) : '' });
        chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#ff3fa4' });
        if (chrome.action.setBadgeTextColor) chrome.action.setBadgeTextColor({ tabId: sender.tab.id, color: '#ffffff' });
      }
      return;
    case 'visitLog':
      logVisit(msg, sender);
      return;
    case 'readFolder':
      readFolderSettings().then(reply);
      return true;
    case 'refreshList':
      refreshList(true).then(r => { syncRules(); reply(r); });
      return true;
  }
});

/* ---------- Context menus ---------- */
async function buildMenus() {
  const { lang } = await getSettings();
  G6S_I18N.setLang(lang);
  const t = G6S_I18N.t;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'g6s-image', title: t('mImage'), contexts: ['image'] });
    chrome.contextMenus.create({ id: 'g6s-term', title: t('mTerm'), contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'g6s-site', title: t('mSite'), contexts: ['page'] });
  });
}
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const s = await getSettings();
  if (info.menuItemId === 'g6s-image' && info.srcUrl) {
    try {
      const res = await fetch(info.srcUrl, { credentials: 'omit' });
      const bmp = await createImageBitmap(await res.blob());
      const hs = G6S.dbHashes(bmp, bmp.width, bmp.height);
      await chrome.storage.local.set({ customHashes: s.customHashes.concat(hs) });
      hitCache.clear();
      await loadCustomHashes();
    } catch { /* image could not be read */ }
  } else if (info.menuItemId === 'g6s-term' && info.selectionText) {
    const t = info.selectionText.trim().slice(0, 80);
    if (!s.terms.includes(t)) await chrome.storage.local.set({ terms: s.terms.concat(t) });
    await syncRules();
  } else if (info.menuItemId === 'g6s-site' && info.pageUrl) {
    try {
      const h = new URL(info.pageUrl).hostname.replace(/^www\./, '');
      if (!s.customDomains.includes(h)) await chrome.storage.local.set({ customDomains: s.customDomains.concat(h) });
      await syncRules();
    } catch { /* not a site URL */ }
  }
  if (tab && tab.id != null) chrome.tabs.reload(tab.id);
});

/* ---------- Lifecycle ---------- */
async function startup() {
  await readFolderSettings();
  await refreshList(false);
  await syncRules();
}
chrome.runtime.onInstalled.addListener(details => {
  buildMenus();
  startup();
  chrome.alarms.create('g6s-folder', { periodInMinutes: 2 });
  chrome.alarms.create('g6s-list', { periodInMinutes: 360 });
  if (details.reason === 'install') chrome.tabs.create({ url: 'ui/welcome.html' });
});
chrome.runtime.onStartup.addListener(startup);
chrome.alarms.onAlarm.addListener(a => {
  if (a.name === 'g6s-folder') readFolderSettings();
  if (a.name === 'g6s-list') refreshList(false).then(syncRules);
});
chrome.storage.onChanged.addListener((c, area) => {
  if (area !== 'local') return;
  // A local change (not an import from the folder file) moves the settings clock forward,
  // so the pages know to write ayarlar.json.
  if (!importing && SYNC_KEYS.some(k => k in c) && !('updatedAt' in c)) chrome.storage.local.set({ updatedAt: Date.now(), folderDirty: true });
  if (c.enabled || c.terms || c.customDomains || c.allowDomains || c.remote) syncRules();
  if (c.customHashes) loadCustomHashes();
  if (c.lang) buildMenus();
});
loadCustomHashes();
