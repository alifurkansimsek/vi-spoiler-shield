// Update guide: one-click update when the folder can be written, otherwise the manual steps.
const $ = id => document.getElementById(id);
const { t } = G6S_I18N;
const versionParts = v => String(v || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
const isNewer = (a, b) => { const x = versionParts(a), y = versionParts(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
const params = new URLSearchParams(location.search);

(async () => {
  await G6S_I18N.init();
  const current = chrome.runtime.getManifest().version;
  let { update } = await chrome.storage.local.get({ update: null });
  if (!update || !update.latest) update = await chrome.runtime.sendMessage({ type: 'checkUpdate' }).catch(() => null) || {};
  const available = !!update.latest && isNewer(update.latest, current);
  $('versions').textContent = available ? t('upVersions', { c: current, v: update.latest }) : t('upLatestNow');
  $('dl').addEventListener('click', () => chrome.tabs.create({ url: update.zip || update.page || 'https://github.com/alifurkansimsek/vi-spoiler-shield/releases/latest' }));
  // chrome://extensions also opens the extensions page in Brave, Edge, Opera and Vivaldi.
  $('ext').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id }));

  const status = $('one-status'), btn = $('one-btn');
  const say = (text, cls) => { status.textContent = text; status.className = 'one-status' + (cls ? ' ' + cls : ''); };

  // Just updated: the worker reopened this page after the restart.
  if (params.get('done')) {
    $('one').classList.add('done');
    btn.hidden = true;
    say(t('uoDone', { v: current }), 'ok');
    return;
  }
  if (!G6SUpdater.supported()) { $('one-lead').textContent = t('uoBrave'); btn.hidden = true; return; }
  if (!available) { btn.disabled = true; say(t('upLatestNow')); return; }

  let busy = false;
  async function run() {
    if (busy) return;
    busy = true; btn.disabled = true;
    try {
      await G6SUpdater.install(update, (key, vars) => say(t(key, vars)));
    } catch (e) {
      const code = e && e.code;
      if (e && e.name === 'AbortError') say('');
      else if (code === 'wrongfolder') say(t('uoWrongFolder'), 'err');
      else if (code === 'permission') say(t('uoPermission'), 'err');
      else if (code === 'bad') say(t('uoBad'), 'err');
      else say(t('uoFail', { e: String((e && e.message) || e).slice(0, 80) }), 'err');
      busy = false; btn.disabled = false;
    }
  }
  btn.addEventListener('click', run);
  // Opened from the popup's update button: start right away if the folder is already linked.
  if (params.get('go') && (await G6SFolder.status()) === 'ready') run();
})();
