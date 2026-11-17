// New features: folder settings file (live read from disk), history logging (normal vs incognito),
// network-redirect logging, and the remote list's validation.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [, , ext, exe] = process.argv;
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, x); } };
const settingsFile = path.join(ext, 'ayarlar.json');

(async () => {
  const srv = http.createServer((q, r) => {
    const u = new URL(q.url, 'http://x');
    if (u.pathname === '/list.json') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ version: 1, updated: '2026-11-17', strong: ['mroenxhzeh', 'ab', 'x'.repeat(99)], videoIds: ['abcdefghijk', 'bad'], domains: ['ornek-spoiler.test', 'not a domain'] })); }
    r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    r.end('<!doctype html><title>Haber</title><p id="a">GTA 6 inceleme</p><p>' + 'temiz metin '.repeat(80) + '</p><p id="b">Zebrakumru geldi</p>');
  });
  await new Promise(r => srv.listen(8772, r));
  if (fs.existsSync(settingsFile)) fs.unlinkSync(settingsFile);
  const ctx = await chromium.launchPersistentContext('', { executablePath: exe, headless: false, args: ['--headless=new', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`], viewport: { width: 1200, height: 800 } });
  const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');
  await new Promise(r => setTimeout(r, 1500));

  // 1. Folder file: no file, then a newer file, then an edit to it, all read live from disk.
  ok('no settings file reads as none', (await sw.evaluate(() => readFolderSettings())).status === 'none');
  fs.writeFileSync(settingsFile, JSON.stringify({ version: 1, updatedAt: Date.now() + 1000, settings: { terms: ['bir deneme terimi'], strict: false } }));
  const r1 = await sw.evaluate(() => readFolderSettings());
  ok('newer settings file is imported', r1.status === 'imported', JSON.stringify(r1));
  const s1 = await sw.evaluate(() => chrome.storage.local.get(['terms', 'strict']));
  ok('imported values applied', s1.strict === false && s1.terms[0] === 'bir deneme terimi', JSON.stringify(s1));
  fs.writeFileSync(settingsFile, JSON.stringify({ version: 1, updatedAt: Date.now() + 5000, settings: { terms: ['ikinci terim'], strict: true } }));
  const r2 = await sw.evaluate(() => readFolderSettings());
  const s2 = await sw.evaluate(() => chrome.storage.local.get(['terms', 'strict']));
  ok('an edited file is read again from disk (no stale cache)', r2.status === 'imported' && s2.terms.includes('ikinci terim') && s2.strict === true, JSON.stringify([r2, s2]));
  ok('same file again is current, not re-imported', (await sw.evaluate(() => readFolderSettings())).status === 'current');
  // A term added locally but never written must survive a newer file from another browser.
  await sw.evaluate(() => chrome.storage.local.set({ terms: ['ikinci terim', 'yerel terim'] }));
  await new Promise(r => setTimeout(r, 200));
  fs.writeFileSync(settingsFile, JSON.stringify({ version: 1, updatedAt: Date.now() + 60000, settings: { terms: ['dosya terimi'] } }));
  await sw.evaluate(() => readFolderSettings());
  const merged = (await sw.evaluate(() => chrome.storage.local.get('terms'))).terms;
  ok('lists are merged, not replaced', merged.includes('yerel terim') && merged.includes('dosya terimi'), JSON.stringify(merged));
  // A hand-edited file with wrong types is ignored field by field, and rules still install.
  fs.writeFileSync(settingsFile, JSON.stringify({ version: 1, updatedAt: Date.now() + 120000, settings: { terms: 'bozuk', strict: 'evet', customDomains: [5, null, 'ornek.com'] } }));
  await sw.evaluate(() => readFolderSettings());
  const typed = await sw.evaluate(() => chrome.storage.local.get(['terms', 'strict', 'customDomains']));
  ok('wrong types are ignored', Array.isArray(typed.terms) && typed.strict === true && JSON.stringify(typed.customDomains) === '["ornek.com"]', JSON.stringify(typed));
  await sw.evaluate(() => syncRules());
  ok('network rules still install after a bad file', (await sw.evaluate(() => chrome.declarativeNetRequest.getDynamicRules())).length > 20);
  await sw.evaluate(() => chrome.storage.local.set({ customDomains: [] }));
  await sw.evaluate(() => chrome.storage.local.set({ terms: ['zebrakumru'] }));
  await new Promise(r => setTimeout(r, 300));
  const s3 = await sw.evaluate(() => chrome.storage.local.get(['folderDirty', 'updatedAt']));
  ok('a local change marks the folder file for writing', s3.folderDirty === true && s3.updatedAt > 0);
  fs.unlinkSync(settingsFile);

  // 2. History: a normal page is logged once with counts by kind; path is encrypted.
  await sw.evaluate(() => chrome.storage.local.set({ log: [], stats: { total: 0, days: {} } }));
  const p = await ctx.newPage();
  await p.goto('http://localhost:8772/haber/gizli-yol'); await p.waitForTimeout(2500);
  await p.goto('about:blank'); await p.waitForTimeout(800);
  const { log, stats } = await sw.evaluate(() => chrome.storage.local.get(['log', 'stats']));
  ok('one history entry for the visit', log.length === 1, 'n=' + log.length);
  ok('entry counts both hidden texts', log[0] && log[0].c.text === 2, JSON.stringify(log[0] && log[0].c));
  ok('entry has the host in clear', log[0] && log[0].host === 'localhost');
  ok('path is not stored in clear', log[0] && !JSON.stringify(log[0]).includes('gizli-yol') && log[0].p && log[0].p.ct);
  ok('stats total matches', stats.total === 2, JSON.stringify(stats));
  // Decrypt as the options page does
  const plain = await sw.evaluate(async () => {
    const { log, logKey } = await chrome.storage.local.get(['log', 'logKey']);
    const key = await crypto.subtle.importKey('jwk', logKey, 'AES-GCM', false, ['decrypt']);
    const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(log[0].p.iv) }, key, b(log[0].p.ct)));
  });
  ok('path decrypts on request', plain === '/haber/gizli-yol', plain);

  // 3. A network-level block is logged from the blocked page.
  await p.goto('http://localhost:8772/news/gta-6-test').catch(() => {}); await p.waitForTimeout(1200);
  const log2 = (await sw.evaluate(() => chrome.storage.local.get('log'))).log;
  ok('network block logged as a page', log2.some(e => e.c.page === 1 && e.host === 'localhost' && e.id.startsWith('net-')), JSON.stringify(log2.map(e => e.c)));

  // 4. Logging switched off writes nothing.
  await sw.evaluate(() => chrome.storage.local.set({ logging: false, log: [] }));
  await p.goto('http://localhost:8772/baska'); await p.waitForTimeout(2500); await p.goto('about:blank'); await p.waitForTimeout(800);
  ok('logging off writes nothing', (await sw.evaluate(() => chrome.storage.local.get('log'))).log.length === 0);
  await sw.evaluate(() => chrome.storage.local.set({ logging: true }));

  // 5. Remote list: only valid items survive, and a failed fetch keeps the last good list.
  await sw.evaluate(() => chrome.storage.local.set({ listUrl: 'https://example.invalid/list.json' }));
  const bad = await sw.evaluate(() => refreshList(true));
  ok('unreachable list records an error and keeps nothing bad', !!bad.error && bad.strong.length === 0);
  const good = await sw.evaluate(async () => {
    const o = validList({ version: 1, updated: '2026-11-17', strong: ['mroenxhzeh', 'ab', 'x'.repeat(99)], videoIds: ['abcdefghijk', 'bad'], domains: ['ornek-spoiler.test', 'not a domain'] });
    return o;
  });
  ok('validation keeps only well-formed items', good.strong.length === 1 && good.videoIds.length === 1 && good.domains.length === 1, JSON.stringify(good));
  let threw = false; try { await sw.evaluate(() => validList({ version: 2 })); } catch { threw = true; }
  ok('wrong list version is refused', threw);

  console.log(`RESULT ${pass} passed, ${fail} failed`);
  await ctx.close(); srv.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(settingsFile); } catch {} process.exit(2); });
