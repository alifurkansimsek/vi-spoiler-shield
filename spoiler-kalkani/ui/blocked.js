// The blocked URL arrives in the hash. It can itself be a spoiler, so it is removed from
// the address bar at once and kept only for the "show anyway" button and the history.
const raw = location.hash.slice(1);
if (raw) {
  try { sessionStorage.setItem('g6s-target', raw); } catch { /* storage unavailable */ }
  history.replaceState(null, '', location.pathname);
  // A page stopped at the network never reaches the content script, so it is logged here.
  if (/^https?:\/\//i.test(raw)) {
    chrome.runtime.sendMessage({ type: 'visitLog', visitId: 'net-' + Date.now() + Math.random().toString(36).slice(2, 6), startedAt: Date.now(), url: raw, counts: { text: 0, image: 0, video: 0, page: 1 } }, () => void chrome.runtime.lastError);
  }
}
let target = raw;
if (!target) { try { target = sessionStorage.getItem('g6s-target') || ''; } catch { target = ''; } }

document.getElementById('back').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.replace('https://www.google.com/');
});

const show = document.getElementById('show');
if (!/^https?:\/\//i.test(target)) show.hidden = true;
show.addEventListener('click', () => {
  if (!show.dataset.sure) {
    show.dataset.sure = '1';
    show.classList.add('btn-sure');
    show.textContent = 'Emin misin? Tekrar tıkla';
    return;
  }
  chrome.runtime.sendMessage({ type: 'allowUrl', url: target }, () => {
    void chrome.runtime.lastError;
    location.replace(target);
  });
});
