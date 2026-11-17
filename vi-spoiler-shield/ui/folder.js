// Shares settings between browsers through ayarlar.json in the extension folder.
// Every browser runs the extension from the same folder; each one is linked to it once
// (File System Access), then extension pages write the file and the worker reads it.
const G6SFolder = (() => {
  const SYNC_KEYS = ['enabled', 'strict', 'visual', 'placeholders', 'logging', 'lang', 'terms', 'customDomains', 'allowDomains', 'customHashes', 'listUrl'];

  const db = () => new Promise((res, rej) => {
    const r = indexedDB.open('g6s', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const idb = async (mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('kv', mode);
      const req = fn(t.objectStore('kv'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  const getHandle = () => idb('readonly', s => s.get('folder')).catch(() => null);
  const setHandle = h => idb('readwrite', s => s.put(h, 'folder'));

  async function status() {
    if (!('showDirectoryPicker' in window)) return 'unsupported';
    const h = await getHandle();
    if (!h) return 'none';
    const p = await h.queryPermission({ mode: 'readwrite' });
    return p === 'granted' ? 'ready' : 'permission';
  }

  // Asks the user to pick the extension folder and checks that it really is that folder.
  async function link() {
    const h = await window.showDirectoryPicker({ id: 'vi-spoiler-shield', mode: 'readwrite' });
    let ok = false;
    try {
      const m = await (await (await h.getFileHandle('manifest.json')).getFile()).text();
      // Compared on fields the browser does not localise.
      const mine = chrome.runtime.getManifest(), theirs = JSON.parse(m);
      ok = theirs.options_page === mine.options_page && theirs.background && theirs.background.service_worker === mine.background.service_worker;
    } catch { ok = false; }
    if (!ok) throw new Error(self.G6S_I18N ? G6S_I18N.t('sWrongFolder') : 'Wrong folder');
    await setHandle(h);
    await write();
    return true;
  }

  async function grant() {
    const h = await getHandle();
    if (!h) return false;
    return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
  }

  async function write() {
    const h = await getHandle();
    if (!h || (await h.queryPermission({ mode: 'readwrite' })) !== 'granted') return false;
    const all = await chrome.storage.local.get(null);
    const settings = {};
    for (const k of SYNC_KEYS) if (k in all) settings[k] = all[k];
    const body = { version: 1, app: 'VI Spoiler Shield', updatedAt: all.updatedAt || Date.now(), settings };
    const fh = await h.getFileHandle('ayarlar.json', { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(body, null, 2));
    await w.close();
    await chrome.storage.local.set({ folderDirty: false, folderWrittenAt: Date.now() });
    return true;
  }

  // Pulls newer settings from the file, then pushes local changes if any are pending.
  async function sync() {
    await chrome.runtime.sendMessage({ type: 'readFolder' }).catch(() => null);
    const { folderDirty } = await chrome.storage.local.get('folderDirty');
    if (folderDirty) return write().catch(() => false);
    return false;
  }

  return { status, link, grant, write, sync };
})();
