const $ = id => document.getElementById(id);
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
  $('next').firstChild.textContent = at === 0 ? 'Başlayalım' : at === steps.length - 1 ? 'Bitir' : 'Devam';
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

const setCheck = (el, ok, yes, no, unknown) => {
  const dot = el.querySelector('.dot'), text = el.querySelector('span:last-child');
  if (ok === null) { dot.className = 'dot partial'; text.textContent = unknown; }
  else { dot.className = ok ? 'dot' : 'dot off'; text.textContent = ok ? yes : no; }
};

/* Pin: the browser tells whether the icon sits on the toolbar (not every browser supports it). */
async function checkPin() {
  try {
    const s = await chrome.action.getUserSettings();
    setCheck($('pin-check'), !!s.isOnToolbar, 'Sabitlendi.', 'Henüz sabitlenmedi.', '');
  } catch { setCheck($('pin-check'), null, '', '', 'Bu tarayıcı durumu bildirmiyor; adımları izlemen yeterli.'); }
}

/* Incognito */
async function checkIncognito() {
  try { setCheck($('inc-check'), await chrome.extension.isAllowedIncognitoAccess(), 'Gizli pencerelerde açık.', 'Gizli pencerelerde henüz kapalı.', ''); }
  catch { setCheck($('inc-check'), null, '', '', 'Durum okunamadı.'); }
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
  if (st === 'unsupported') {
    $('link').disabled = true;
    $('link-error').textContent = navigator.brave
      ? 'Brave bu klasöre yazamıyor ama okuyabiliyor: başka bir tarayıcıda yaptığın değişiklikler buraya kendiliğinden gelir. Buradan göndermek istersen Ayarlar > Tarayıcılar arası bölümündeki adımları izle.'
      : 'Bu tarayıcı klasöre yazmayı desteklemiyor. Ayarlar sayfasındaki dışa/içe aktarmayı kullanabilirsin.';
  }
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
const HELP = [
  { id: 'brave', name: 'Brave', steps: ['Yeni bir sekme aç.', 'Sağ alttaki "Özelleştir"e bas.', '"Brave News" ve "Kartlar" seçeneklerini kapat.', 'Ayarlar > Arama motoru bölümünde "Arama önerilerini göster"i kapat.'] },
  { id: 'edge', name: 'Edge', steps: ['Yeni bir sekme aç.', 'Sağ üstteki dişliye bas.', '"İçerik" ya da "Haber akışını göster" seçeneğini kapat.', 'Ayarlar > Gizlilik > Adres çubuğu ve arama bölümünde öneri seçeneklerini kapat.'] },
  { id: 'chrome', name: 'Chrome', steps: ['Yeni bir sekme aç, sağ alttaki "Chrome\'u özelleştir"e bas.', '"Kartları göster" seçeneğini kapat.', 'Ayarlar > Google ve siz > Senkronizasyon ve Google hizmetleri bölümünde "Aramaları ve URL\'leri otomatik tamamla"yı kapat.'] },
  { id: 'opera', name: 'Opera', steps: ['Ayarlar > Başlangıç sayfası bölümünde haber akışını kapat.', 'Eklentiler sayfasında Spoiler Kalkanı için "Arama sayfası sonuçlarına erişime izin ver"i aç.'] }
];
const mine = isBrave ? 'brave' : isEdge ? 'edge' : isOpera ? 'opera' : 'chrome';
$('browser-help').replaceChildren(...HELP.sort((a, b) => (b.id === mine) - (a.id === mine)).map(h => {
  const d = document.createElement('div');
  d.className = 'card' + (h.id === mine ? ' mine' : '');
  const t = document.createElement('h3'); t.textContent = h.id === mine ? `${h.name} (şu an kullandığın)` : h.name;
  const ol = document.createElement('ol');
  for (const s of h.steps) { const li = document.createElement('li'); li.textContent = s; ol.append(li); }
  d.append(t, ol);
  return d;
}));

/* Demo: the same matcher the extension uses, run on sample headlines. */
const SAMPLES = ['Hafta sonu hava durumu: İstanbul\'a yağmur geliyor', 'GTA 6 için ön sipariş rekoru kırıldı', 'Derbi maçının özeti ve tüm goller', 'Grand Theft Auto VI ilk 10 dakika incelemesi', 'Rockstar\'ın yeni oyunu hakkında bilinen her şey'];
function renderDemo() {
  chrome.storage.local.get({ strict: true, terms: [] }).then(s => {
    G6S.setStrict(s.strict);
    G6S.setExtraTerms(s.terms);
    const typed = $('demo-input').value.trim();
    const list = (typed ? [typed] : []).concat(SAMPLES);
    $('demo-list').replaceChildren(...list.map(text => {
      const hit = G6S.hasMatch(text);
      const li = document.createElement('li');
      const t = document.createElement('span'); t.textContent = text; if (hit) t.className = 'hid';
      const v = document.createElement('span'); v.className = 'verdict ' + (hit ? 'v-hide' : 'v-show'); v.textContent = hit ? 'Gizlenirdi' : 'Görünür';
      li.append(t, v);
      return li;
    }));
  });
}
$('demo-input').addEventListener('input', renderDemo);

renderChoice();
renderLink();
renderDemo();
go(0);
