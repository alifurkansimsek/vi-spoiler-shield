// One-click update. Downloads the release zip from this repository, checks it, writes its files
// into the linked extension folder (the same File System Access link the settings sync uses) and
// restarts the extension. History and settings live in browser storage and ayarlar.json, which
// the zip does not contain, so they stay. Brave has no File System Access: update by hand there.
const G6SUpdater = (() => {
  const REPO = 'https://github.com/alifurkansimsek/vi-spoiler-shield';
  const ROOT = 'vi-spoiler-shield/';
  const MAX_ZIP = 30e6;

  // Minimal zip reader: central directory, stored or deflated entries.
  function entries(buf) {
    const dv = new DataView(buf);
    let end = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { end = i; break; }
    if (end < 0) throw new Error('not a zip');
    const count = dv.getUint16(end + 10, true);
    let p = dv.getUint32(end + 16, true);
    const out = [], dec = new TextDecoder();
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('broken zip');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), local = dv.getUint32(p + 42, true);
      const name = dec.decode(new Uint8Array(buf, p + 46, nlen)).replace(/\\/g, '/');
      p += 46 + nlen + xlen + clen;
      if (name.endsWith('/')) continue;
      if (dv.getUint32(local, true) !== 0x04034b50) throw new Error('broken zip');
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      out.push({ name, method, usize, data: new Uint8Array(buf, start, csize) });
    }
    return out;
  }
  async function inflate(e) {
    if (e.method === 0) return e.data;
    if (e.method !== 8) throw new Error('unsupported zip');
    const ab = await new Response(new Blob([e.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
    if (ab.byteLength !== e.usize) throw new Error('broken zip');
    return new Uint8Array(ab);
  }
  const safePath = p => p.split('/').every(s => s && s !== '.' && s !== '..' && !/[:*?"<>|\u0000-\u001f]/.test(s));

  // The linked folder must be the one this running extension is loaded from: a marker file
  // written there has to come back through the extension's own URL.
  async function isRunningFolder(h) {
    const name = '.g6s-check-' + Math.random().toString(36).slice(2);
    const token = crypto.randomUUID();
    const fh = await h.getFileHandle(name, { create: true });
    const w = await fh.createWritable(); await w.write(token); await w.close();
    let ok = false;
    try { ok = (await (await fetch(chrome.runtime.getURL(name), { cache: 'no-store' })).text()) === token; } catch { ok = false; }
    await h.removeEntry(name).catch(() => {});
    return ok;
  }

  async function writeFile(root, path, bytes) {
    const parts = path.split('/');
    let dir = root;
    for (const d of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(d, { create: true });
    const w = await (await dir.getFileHandle(parts[parts.length - 1], { create: true })).createWritable();
    await w.write(bytes); await w.close();
  }

  const supported = () => 'showDirectoryPicker' in window && 'DecompressionStream' in window;

  // step(key, vars) reports progress. Throws Error with .code for the page to explain.
  async function install(update, step) {
    const fail = (code, msg) => Object.assign(new Error(msg || code), { code });
    if (!supported()) throw fail('unsupported');
    if (!update || !update.latest || !String(update.zip || '').startsWith(REPO + '/releases/download/')) throw fail('nozip');

    step('uoLinking');
    let st = await G6SFolder.status();
    if (st === 'none') { await G6SFolder.link(); st = await G6SFolder.status(); }
    if (st === 'permission') { await G6SFolder.grant(); st = await G6SFolder.status(); }
    if (st !== 'ready') throw fail('permission');
    const h = await G6SFolder.handle();

    step('uoVerify');
    if (!(await isRunningFolder(h))) throw fail('wrongfolder');

    step('uoDownload');
    const res = await fetch(update.zip, { credentials: 'omit', cache: 'no-store' });
    if (!res.ok) throw fail('download', 'HTTP ' + res.status);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_ZIP) throw fail('bad', 'too large');

    step('uoCheck');
    const files = [];
    for (const e of entries(buf)) {
      if (!e.name.startsWith(ROOT)) continue; // Install.html and LICENSE sit next to the folder
      const path = e.name.slice(ROOT.length);
      if (!safePath(path) || path === 'ayarlar.json') throw fail('bad', 'unexpected file ' + path);
      files.push({ path, bytes: await inflate(e) });
    }
    const man = files.find(f => f.path === 'manifest.json');
    if (!man) throw fail('bad', 'no manifest');
    const next = JSON.parse(new TextDecoder().decode(man.bytes)), mine = chrome.runtime.getManifest();
    if (next.version !== update.latest || next.options_page !== mine.options_page || !next.background || next.background.service_worker !== mine.background.service_worker) throw fail('bad', 'manifest does not match');

    // Manifest last: if a write fails midway, the old manifest still describes files that exist.
    const order = files.filter(f => f !== man).concat(man);
    for (let i = 0; i < order.length; i++) {
      step('uoWrite', { n: i + 1, t: order.length });
      await writeFile(h, order[i].path, order[i].bytes);
    }
    step('uoRestart');
    await chrome.storage.local.set({ justUpdated: next.version });
    setTimeout(() => chrome.runtime.reload(), 900);
    return next.version;
  }

  return { supported, install };
})();
