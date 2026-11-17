// Runs in the page's own JS world, before page scripts.
// 1) Forces shadow roots open so the isolated content script can scan them.
// 2) Suppresses page notifications that mention the game, via a synchronous event bridge.
(function () {
  if (window.__g6sMain) return;
  Object.defineProperty(window, '__g6sMain', { value: true });

  const orig = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const root = orig.call(this, Object.assign({}, init, { mode: 'open' }));
    try { this.setAttribute('data-g6s-shadow', ''); } catch { /* ignore */ }
    return root;
  };

  const ask = text => {
    const ev = new CustomEvent('g6s-check', { detail: String(text || ''), cancelable: true });
    return !document.documentElement || document.documentElement.dispatchEvent(ev) === false;
  };
  const isSpoiler = text => {
    try { return !!document.documentElement && ask(text); } catch { return false; }
  };

  const N = window.Notification;
  if (typeof N === 'function') {
    const Patched = function (title, opts) {
      if (isSpoiler(title + ' ' + ((opts && opts.body) || ''))) {
        return new N('Spoiler Kalkanı', { body: 'Bir bildirim gizlendi.', silent: true });
      }
      return new N(title, opts);
    };
    Patched.prototype = N.prototype;
    Object.setPrototypeOf(Patched, N);
    window.Notification = Patched;
  }
})();
