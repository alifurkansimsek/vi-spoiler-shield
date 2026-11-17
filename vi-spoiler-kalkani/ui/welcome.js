const $ = id => document.getElementById(id);
const { t } = G6S_I18N;
const steps = [...document.querySelectorAll('.step')];
const rail = [...document.querySelectorAll('#rail li')];
let at = 0;
let poll = 0;

function go(i) {
  at = Math.max(0, Math.min(steps.length - 1, i));
  steps.forEach((s, n) => { s.hidden = n !== at; });
  rail.forEach((r, n) => { r.className = n < at ? 'done' : n === at ? 'now' : ''; });
  $('prev').style.visibility = at === 0 ? 'hidden' : 'visible';
  $('count').textContent = `${at + 1} / ${steps.length}`;
  $('next-label').textContent = at === 0 ? t('start') : at === steps.length - 1 ? t('finish') : t('next');
  clearInterval(poll);
  if (at === 1) { checkPin(); poll = setInterval(checkPin, 1200); }
  if (at === 2) { checkIncognito(); poll = setInterval(checkIncognito, 1500); }
  if (at === 6) $('demo-input').focus();
}
$('next').addEventListener('click', () => {
  if (at === steps.length - 1) { chrome.storage.local.set({ welcomeDone: true }); window.close(); return; }
  go(at + 1);
});
$('prev').addEventListener('click', () => go(at - 1));

/* Language */
const langButtons = [...document.querySelectorAll('[data-lang]')];
const markLang = () => langButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === G6S_I18N.lang)));
langButtons.forEach(b => b.addEventListener('click', async () => {
  G6S_I18N.setLang(b.dataset.lang);
  await chrome.storage.local.set({ lang: b.dataset.lang });
  G6S_I18N.apply();
  markLang();
  renderHelp();
  renderDemo();
  renderLink();
  go(at);
}));

const setCheck = (el, ok, yes, no, unknown) => {
  const dot = el.querySelector('.dot'), text = el.querySelector('span:last-child');
  if (ok === null) { dot.className = 'dot partial'; text.textContent = unknown; }
  else { dot.className = ok ? 'dot' : 'dot off'; text.textContent = ok ? yes : no; }
};

/* Pin: the browser tells whether the icon sits on the toolbar (not every browser supports it). */
async function checkPin() {
  try {
    const s = await chrome.action.getUserSettings();
    setCheck($('pin-check'), !!s.isOnToolbar, t('pinned'), t('notPinned'), '');
  } catch { setCheck($('pin-check'), null, '', '', t('pinUnknown')); }
}

/* Incognito */
async function checkIncognito() {
  try { setCheck($('inc-check'), await chrome.extension.isAllowedIncognitoAccess(), t('incOn'), t('incOff'), ''); }
  catch { setCheck($('inc-check'), null, '', '', t('incUnknown')); }
}
$('open-ext').addEventListener('click', () => chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` }));

/* Strict mode */
const choices = [...document.querySelectorAll('.choice')];
async function renderChoice() {
  const { strict = true } = await chrome.storage.local.get('strict');
  choices.forEach(c => c.setAttribute('aria-checked', String(c.dataset.strict === String(strict))));
}
choices.forEach(c => c.addEventListener('click', async () => {
  await chrome.storage.local.set({ strict: c.dataset.strict === 'true' });
  renderChoice();
  renderDemo();
}));

/* Folder link */
async function renderLink() {
  const st = await G6SFolder.status();
  $('link-check').hidden = st !== 'ready';
  if (st === 'unsupported') { $('link').disabled = true; $('link-error').textContent = navigator.brave ? t('w4Brave') : t('w4Unsupported'); }
}
$('link').addEventListener('click', async () => {
  $('link-error').textContent = '';
  try { await G6SFolder.link(); } catch (e) { if (e && e.name !== 'AbortError') $('link-error').textContent = e.message || String(e); }
  renderLink();
});

/* New tab help, for the browser in use first */
const isBrave = !!navigator.brave;
const brands = (navigator.userAgentData && navigator.userAgentData.brands || []).map(b => b.brand).join(' ');
const isEdge = /Edge/.test(brands) || /Edg\//.test(navigator.userAgent);
const isOpera = /OPR\//.test(navigator.userAgent);
const mine = isBrave ? 'brave' : isEdge ? 'edge' : isOpera ? 'opera' : 'chrome';
function renderHelp() {
  const HELP = [['brave', 'Brave', 'hBrave'], ['edge', 'Edge', 'hEdge'], ['chrome', 'Chrome', 'hChrome'], ['opera', 'Opera', 'hOpera']];
  $('browser-help').replaceChildren(...HELP.sort((a, b) => (b[0] === mine) - (a[0] === mine)).map(([id, name, key]) => {
    const d = document.createElement('div');
    d.className = 'card' + (id === mine ? ' mine' : '');
    const h = document.createElement('h3'); h.textContent = id === mine ? t('w5Mine', { b: name }) : name;
    const ol = document.createElement('ol');
    for (const s of t(key)) { const li = document.createElement('li'); li.textContent = s; ol.append(li); }
    d.append(h, ol);
    return d;
  }));
}

/* Demo: the same matcher the extension uses, run on sample headlines. */
function renderDemo() {
  chrome.storage.local.get({ strict: true, terms: [] }).then(s => {
    G6S.setStrict(s.strict);
    G6S.setExtraTerms(s.terms);
    const typed = $('demo-input').value.trim();
    const list = (typed ? [typed] : []).concat(t('demo'));
    $('demo-list').replaceChildren(...list.map(text => {
      const hit = G6S.hasMatch(text);
      const li = document.createElement('li');
      const span = document.createElement('span'); span.textContent = text; if (hit) span.className = 'hid';
      const v = document.createElement('span'); v.className = 'verdict ' + (hit ? 'v-hide' : 'v-show'); v.textContent = hit ? t('wouldHide') : t('visible');
      li.append(span, v);
      return li;
    }));
  });
}
$('demo-input').addEventListener('input', renderDemo);

(async () => {
  await G6S_I18N.init();
  markLang();
  renderHelp();
  renderChoice();
  renderLink();
  renderDemo();
  go(0);
})();
