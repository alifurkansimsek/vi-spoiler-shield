// Page scanner. All text checks run synchronously inside MutationObserver callbacks, which
// fire before the browser paints, so matched text never reaches the screen.
(function () {
  if (window.__g6sLoaded) return;
  window.__g6sLoaded = true;
  const { normalize, findNormalized, hasMatch, hasMatchUrl, setExtraTerms } = self.G6S;
  const root = document.documentElement;
  const IS_TOP = window === window.top;

  let settings = { enabled: true, allowed: false, placeholders: false, visual: true };
  let active = true;

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'HEAD', 'TITLE', 'META', 'LINK', 'G6S-SHIELD']);
  const INLINE = new Set(['A', 'ABBR', 'B', 'BDI', 'BDO', 'BIG', 'CITE', 'CODE', 'DEL', 'DFN', 'EM', 'FONT', 'I', 'INS', 'KBD', 'MARK', 'NOBR', 'Q', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'TIME', 'TT', 'U', 'VAR', 'WBR']);

  // Attributes that can carry text or URLs.
  const TEXT_ATTRS = ['alt', 'title', 'aria-label', 'aria-description', 'placeholder', 'label', 'data-title', 'data-tooltip', 'data-original-title', 'data-caption', 'data-name', 'data-video-title', 'post-title', 'subreddit-prefixed-name', 'subreddit-name', 'data-subreddit'];
  const URL_ATTRS = ['src', 'srcset', 'data-src', 'data-srcset', 'data-lazy-src', 'poster', 'href', 'data-href', 'data-url', 'data-permalink', 'permalink', 'content-href', 'data'];
  const ALL_ATTRS = TEXT_ATTRS.concat(URL_ATTRS);
  const ATTR_SEL = ALL_ATTRS.map(a => `[${a}]`).join(',') + ',[style*="url("]';

  // Per-site cards. "collapse" sites remove the whole card so the feed closes up.
  const CARD_SEL = [
    // YouTube
    'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer', 'ytd-playlist-renderer', 'ytd-compact-playlist-renderer', 'ytd-channel-renderer', 'ytd-reel-item-renderer', 'ytd-rich-section-renderer', 'ytd-comment-thread-renderer', 'ytd-comment-view-model', 'ytd-notification-renderer', 'ytd-movie-renderer', 'ytd-radio-renderer', 'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2', 'yt-lockup-view-model', 'ytd-guide-entry-renderer', 'ytd-horizontal-card-renderer', 'ytd-universal-watch-card-renderer', 'ytd-search-refinement-card-renderer', 'yt-chip-cloud-chip-renderer', 'ytm-video-with-context-renderer', 'ytm-compact-video-renderer',
    // X
    'div[data-testid="cellInnerDiv"]', 'article[data-testid="tweet"]', 'div[data-testid="trend"]',
    // Reddit
    'shreddit-post', 'shreddit-comment', 'faceplate-tracker[noun="trending_post"]', 'reddit-pdp-right-rail-post', 'search-telemetry-tracker',
    // Instagram, Facebook, LinkedIn
    'article[role="presentation"]', 'div[role="article"]', 'div[data-pagelet^="FeedUnit"]', 'div.feed-shared-update-v2',
    // TikTok
    '[data-e2e="recommend-list-item-container"]', '[data-e2e="search_top-item"]', '[data-e2e="search-video-item"]', '[data-e2e="user-post-item"]', '[data-e2e="comment-level-1"]',
    // Twitch, Discord, Kick
    '.chat-line__message', '.seventv-message', 'article[data-a-target]', '[data-a-target="followed-channel"]', '[data-test-selector="shelf-card"]', 'li[id^="chat-messages-"]', 'li[class*="searchResult"]',
    // Search engines
    'div.MjjYud', 'div.g', 'div[data-news-doc-id]', 'g-card', 'div[jscontroller][data-vid]', 'li.b_algo', 'li.b_ans', 'article[data-testid="result"]', 'div.tile--img', 'div[role="listitem"]', 'li[role="presentation"]',
    // Hacker News, Steam
    'tr.athing', 'div.search_result_row', 'a.search_result_row', 'div.apphub_Card'
  ].join(',');

  // A hit inside these means the current page itself is about the game.
  const PAGE_CRITICAL = [
    'ytd-watch-metadata', '#above-the-fold', 'yt-page-header-renderer', 'ytd-playlist-header-renderer', 'ytd-reel-video-renderer[is-active]', 'reel-player-header-renderer',
    '[data-a-target="stream-game-link"]', '[data-a-target="stream-title"]', 'h1'
  ].join(',');

  const GENERIC_CARD = 'article,li,[role="article"],[role="listitem"],[role="row"],[role="option"],tr,figure,dd,blockquote,[class*="card" i],[class*="teaser" i],[class*="tile" i],[class*="story" i],[class*="post" i],[class*="item" i],[class*="thumb" i],[class*="entry" i]';
  // Icons (svg) do not make a block a card; real media does.
  const MEDIA_SEL = 'img,video,picture,iframe,[style*="url("],canvas';
  // Site chrome is never hidden as a whole; only the matching element inside it is.
  const CHROME_SEL = 'body > header,body > nav,[role="banner"],ytd-masthead,#masthead-container,tp-yt-app-drawer,ytd-guide-renderer,ytd-mini-guide-renderer,#guide';
  const APP_CHROME_SEL = 'ytd-masthead,#masthead-container,tp-yt-app-drawer,ytd-guide-renderer,#guide,[role="banner"]';
  const PLAYER_SEL = '#movie_player,ytd-player,.html5-video-player,#shorts-player';
  const YT_SUGGEST_SEL = '.ytp-ce-element,.ytp-videowall-still,.ytp-modern-videowall-still,.ytp-endscreen-content,.ytp-autonav-endscreen,.ytp-suggestion-set,.ytp-pause-overlay,.ytp-ce-video,.ytp-ce-playlist,.ytp-fullscreen-grid';
  const YT_TITLE_SEL = '.ytp-title,.ytp-title-text,.ytp-title-link,.ytp-caption-segment,.ytp-caption-window-container,yt-shorts-video-title-view-model,reel-player-header-renderer,ytd-reel-player-header-renderer';

  // State
  const revealed = new WeakSet();
  const blocked = new Set();
  const observed = new WeakSet();
  let pageBlocked = false;
  let lastPageReason = false;
  let blockCount = 0;
  let totalBlockedText = 0;
  let coreBlocks = 0;
  let badgeTimer = 0;
  const hitUrls = new Set();

  const parentOf = n => n.parentNode instanceof ShadowRoot ? n.parentNode.host : n.parentElement;
  function closestDeep(el, sel) {
    for (let cur = el; cur; ) {
      const f = cur.closest && cur.closest(sel);
      if (f) return f;
      const r = cur.getRootNode && cur.getRootNode();
      cur = r instanceof ShadowRoot ? r.host : null;
    }
    return null;
  }
  const inBlocked = el => !!closestDeep(el, '[data-g6s-hide],[data-g6s-mask]');
  function isRevealed(el) {
    for (let cur = el; cur; cur = parentOf(cur)) if (revealed.has(cur)) return true;
    return false;
  }

  /* ---------- Shadow DOM ---------- */
  // Constructable sheets are not subject to the page's style CSP.
  const shadowSheet = new CSSStyleSheet();
  shadowSheet.replaceSync('[data-g6s-hide]{display:none!important}[data-g6s-mask],[data-g6s-mask] *{visibility:hidden!important}img:not([data-g6s-ok]),video:not([data-g6s-ok]){opacity:0!important}');
  const shadowRoots = [];
  function attachShadow(host) {
    const sr = host.shadowRoot;
    if (!sr || observed.has(sr)) return;
    observed.add(sr);
    shadowRoots.push(sr);
    sr.addEventListener('load', onImgLoad, true);
    sr.addEventListener('error', onImgError, true);
    try { sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, shadowSheet]; } catch { /* unsupported */ }
    observe(sr);
    scanSubtree(sr);
  }
  function discoverShadows(rootNode) {
    const list = rootNode.querySelectorAll ? rootNode.querySelectorAll('*') : [];
    for (const el of list) if (el.shadowRoot) attachShadow(el);
    if (rootNode.shadowRoot) attachShadow(rootNode);
  }

  /* ---------- Blocking ---------- */
  function pickContainer(el) {
    const card = closestDeep(el, CARD_SEL);
    if (card && card !== document.body) return { node: card, feed: true };

    const vw = innerWidth * innerHeight;
    // Start from the nearest non-inline element.
    let best = el;
    while (best && INLINE.has(best.tagName) && parentOf(best)) best = parentOf(best);
    best = best || el;
    // A link inside a menu or tag list: hide that link, not the whole list. News cards also hold
    // several links, so this applies only to navigation-like blocks or long runs of links.
    const link = el.closest && el.closest('a');
    if (link && best !== link && best.querySelectorAll) {
      const links = best.querySelectorAll('a').length;
      const navLike = !!best.closest('nav,[role="navigation"],[role="menubar"],header,footer,[class*="menu" i],[class*="tags" i],[class*="hashtag" i],[class*="breadcrumb" i]');
      if ((navLike && links > 3) || links > 12) best = link;
    }
    // If the surrounding block is the whole page or a long text, hide only the element itself.
    if (best !== el && (best === document.body || best === root || (best.textContent || '').length > 1500)) best = el;
    let semantic = null;
    for (let i = 0, a = best; i < 7 && a && a !== document.body && a !== root; i++, a = parentOf(a)) {
      if (a.matches && a.matches('main,#root,#app,#__next')) break;
      if (a.matches && a.matches(GENERIC_CARD)) {
        const len = (a.textContent || '').length;
        const r = a.getBoundingClientRect();
        if (len < 2500 && r.width * r.height < vw * 0.6) { semantic = a; break; }
      }
      // A small block holding media plus a short caption is a card even with no telling name.
      if (a.querySelector && a.querySelector(MEDIA_SEL) && (a.textContent || '').length < 500) {
        const r = a.getBoundingClientRect();
        if (r.width * r.height < vw * 0.5) { semantic = a; break; }
      }
    }
    let node = semantic || best;
    // Never hide site chrome or a video player as a whole: fall back to the matching element.
    if (node !== el && (node.matches(CHROME_SEL) || node.querySelector(APP_CHROME_SEL) || node.querySelector(PLAYER_SEL))) node = el;
    return { node, feed: false };
  }

  function applyBlock(node, feed, reason) {
    if (!node || node === root || node === document.body || node === document.head) return;
    if (node.hasAttribute('data-g6s-hide') || node.hasAttribute('data-g6s-mask')) return;
    if (isRevealed(node)) return;
    if (!settings.placeholders && feed) {
      node.setAttribute('data-g6s-hide', '');
    } else {
      node.setAttribute('data-g6s-mask', '');
      try { if (getComputedStyle(node).display === 'inline') node.setAttribute('data-g6s-inline', ''); } catch { /* detached */ }
    }
    node.setAttribute('data-g6s-why', reason || '');
    blocked.add(node);
    // Only real hits count toward blocking the whole page by density, not strict-mode extras.
    if (reason === 'text' && coreMatch(node)) { totalBlockedText += (node.textContent || '').length; coreBlocks++; }
    silenceWithin(node);
    blockCount++;
    countVisit(node, reason === 'hash' || node.tagName === 'IMG' ? 'image' : (node.matches('video') || node.querySelector('video')) ? 'video' : 'text');
    scheduleBadge();
    scheduleDensity();
  }

  function unblock(node) {
    node.removeAttribute('data-g6s-hide');
    node.removeAttribute('data-g6s-mask');
    node.removeAttribute('data-g6s-inline');
    node.removeAttribute('data-g6s-why');
    blocked.delete(node);
    blockCount = Math.max(0, blockCount - 1);
    scheduleBadge();
    // Images inside were marked done while blocked; check them afresh so none stays invisible.
    const imgs = node.tagName === 'IMG' ? [node] : Array.from(node.querySelectorAll('img'));
    for (const i of imgs) {
      imgState.delete(i);
      if (!active || revealed.has(node)) release(i); else checkImage(i);
    }
  }

  function silence(v) {
    try {
      if (!v.dataset.g6sPaused) { v.dataset.g6sPaused = '1'; v.dataset.g6sWasMuted = v.muted ? '1' : '0'; }
      v.muted = true;
      v.pause();
    } catch { /* ignore */ }
  }
  function resume(v) {
    const wasMuted = v.dataset.g6sWasMuted === '1';
    delete v.dataset.g6sPaused;
    delete v.dataset.g6sWasMuted;
    v.muted = wasMuted;
    v.play().catch(() => {});
  }
  function silenceWithin(node) {
    if (node.matches && node.matches('video,audio')) silence(node);
    if (node.querySelectorAll) node.querySelectorAll('video,audio').forEach(silence);
  }

  function blockFrom(el, reason) {
    if (!el || !el.isConnected && !(el.getRootNode() instanceof ShadowRoot)) return;
    if (inBlocked(el) || isRevealed(el)) return;
    // Inside a video player: a real hit means the video is on topic, so the page goes.
    // A strict-only hit (a studio credit, a bare series name) is ignored there.
    const player = closestDeep(el, PLAYER_SEL);
    if (player) {
      // Suggestions shown inside the player belong to other videos: hide only that suggestion.
      const sugg = closestDeep(el, YT_SUGGEST_SEL);
      if (sugg) return applyBlock(sugg, false, reason);
      // The video's own title or captions: any hit, strict included, means this video is on topic.
      if (closestDeep(el, YT_TITLE_SEL)) return blockPage('player');
      // Anything else in the player (its own attributes, overlays): only a real hit counts.
      const realHit = el === player ? core(() => checkAttrsQuiet(el)) : coreHit(el);
      return realHit ? blockPage('player') : undefined;
    }
    const crit = closestDeep(el, PAGE_CRITICAL);
    if (crit) {
      // Same rule for the page's own title and description: a strict-only hit hides that part.
      if (!coreHit(crit)) {
        const desc = closestDeep(el, 'ytd-watch-metadata #description, ytd-text-inline-expander, #description-inline-expander');
        return applyBlock(desc || pickContainer(el).node, false, reason);
      }
      return blockPage('critical');
    }
    const { node, feed } = pickContainer(el);
    applyBlock(node, feed, reason);
  }

  // Runs a check with strict mode off.
  function core(fn) {
    self.G6S.setStrict(false);
    try { return fn(); } finally { self.G6S.setStrict(settings.strict !== false); }
  }
  const coreMatch = el => core(() => hasMatch(el.textContent || ''));
  const coreHit = el => core(() => hasMatch(el.textContent || '') || checkAttrsQuiet(el) || Array.from(el.querySelectorAll(ATTR_SEL)).some(checkAttrsQuiet));

  /* ---------- Whole-page block ---------- */
  const SHIELD_LOGO = "<svg viewBox=\"0 0 128 128\" width=\"72\" height=\"72\" aria-hidden=\"true\"><defs><linearGradient id=\"s\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ff3fa4\"/><stop offset=\".55\" stop-color=\"#ff7a3d\"/><stop offset=\"1\" stop-color=\"#ffc247\"/></linearGradient><linearGradient id=\"l\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ff3fa4\"/><stop offset=\"1\" stop-color=\"#ff9a3d\"/></linearGradient><clipPath id=\"c\"><circle cx=\"64\" cy=\"64\" r=\"46\"/></clipPath></defs><circle cx=\"64\" cy=\"64\" r=\"58\" fill=\"#1a0d2e\"/><circle cx=\"64\" cy=\"64\" r=\"51.5\" fill=\"none\" stroke=\"url(#s)\" stroke-width=\"13\"/><g clip-path=\"url(#c)\"><g transform=\"translate(3 0) skewX(-8) translate(9 0)\"><g fill=\"#2fd3c9\" transform=\"translate(2.6 2.6)\"><polygon points=\"31,42 43.5,42 52.5,70.5 61.5,42 74,42 58.8,86 46.2,86\"/><rect x=\"78\" y=\"42\" width=\"12.5\" height=\"44\"/></g><g fill=\"#fff3e6\"><polygon points=\"31,42 43.5,42 52.5,70.5 61.5,42 74,42 58.8,86 46.2,86\"/><rect x=\"78\" y=\"42\" width=\"12.5\" height=\"44\"/></g></g><line x1=\"27\" y1=\"27\" x2=\"101\" y2=\"101\" stroke=\"#1a0d2e\" stroke-width=\"19\"/><line x1=\"27\" y1=\"27\" x2=\"101\" y2=\"101\" stroke=\"url(#l)\" stroke-width=\"11\"/></g></svg>";
  const shieldSheet = new CSSStyleSheet();
  shieldSheet.replaceSync(":host{all:initial}\n.w{position:fixed;inset:0;display:grid;place-items:center;padding:24px;box-sizing:border-box;visibility:visible;background:radial-gradient(120% 70% at 50% 118%, rgba(255,122,61,.55) 0%, rgba(255,63,164,.32) 32%, rgba(18,10,32,0) 62%), #120a20;color:#fbf3ff;font:500 15px/1.55 Manrope,system-ui,\"Segoe UI\",sans-serif}\n.w::after{content:\"\";position:absolute;left:0;right:0;bottom:22vh;height:1px;background:linear-gradient(90deg,transparent,rgba(255,194,71,.55),transparent)}\n.b{position:relative;z-index:1;max-width:460px;text-align:center;animation:in .6s cubic-bezier(.16,1,.3,1) both}\nsvg{display:block;margin:0 auto 22px;filter:drop-shadow(0 12px 28px rgba(255,63,164,.35))}\nh1{font:900 46px/1 \"Big Shoulders Display\",\"Arial Narrow\",system-ui,sans-serif;letter-spacing:.01em;margin:0 0 12px;text-transform:uppercase}\np{margin:0 auto 26px;color:#d6c8ee;max-width:38ch}\n.row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}\nbutton{font:700 14px/1 Manrope,system-ui,sans-serif;min-height:42px;padding:0 18px;border-radius:10px;border:1px solid #3a2a5c;background:#1a0f2e;color:#fbf3ff;cursor:pointer;transition:background .25s,border-color .25s}\nbutton:hover{background:#241640;border-color:#54407f}\nbutton.p{border:0;color:#200716;background:linear-gradient(115deg,#ff3fa4,#ff6a4d 48%,#ffb347);box-shadow:0 8px 22px -10px rgba(255,63,164,.8)}\nbutton.sure{border-color:#ff6b6b;background:#3a1424}\nbutton:focus-visible{outline:2px solid #ffc247;outline-offset:2px}\n@keyframes in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){.b{animation:none}}");

  // The shield's display face, from the extension's own files. A page whose policy refuses
  // extension fonts simply shows the fallback face.
  let fontsLoaded = false;
  function loadShieldFonts() {
    if (fontsLoaded || !document.fonts || typeof FontFace !== 'function') return;
    fontsLoaded = true;
    const face = (file, range) => {
      try {
        const ff = new FontFace('Big Shoulders Display', `url(${chrome.runtime.getURL('ui/fonts/' + file)})`, { weight: '900', unicodeRange: range });
        document.fonts.add(ff);
        ff.load().catch(() => {});
      } catch { /* font blocked */ }
    };
    face('BigShouldersDisplay-900-latin.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212');
    face('BigShouldersDisplay-900-latin-ext.woff2', 'U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF');
  }

  let shield = null;
  function buildShield() {
    const host = document.createElement('g6s-shield');
    host.style.setProperty('position', 'fixed', 'important');
    host.style.setProperty('inset', '0', 'important');
    host.style.setProperty('z-index', '2147483647', 'important');
    host.style.setProperty('display', 'block', 'important');
    host.style.setProperty('visibility', 'visible', 'important');
    host.style.setProperty('background', '#120a20', 'important');
    const sr = host.attachShadow({ mode: 'closed' });
    sr.adoptedStyleSheets = [shieldSheet];
    const w = document.createElement('div');
    w.className = 'w';
    w.setAttribute('role', 'alert');
    w.setAttribute('lang', 'tr');
    loadShieldFonts();
    w.innerHTML = '<div class="b">' + SHIELD_LOGO + '<h1>Bu sayfa gizlendi</h1><p>Sayfa, henüz oynamadığın oyunla ilgili görünüyor. Spoiler görmemen için içeriğini kapattım.</p><div class="row"><button class="p" id="back">Geri dön</button><button id="show">Yine de göster</button></div></div>';
    sr.appendChild(w);
    sr.getElementById('back').addEventListener('click', () => {
      if (history.length > 1) history.back(); else location.href = 'https://www.google.com/';
    });
    const show = sr.getElementById('show');
    show.addEventListener('click', () => {
      if (!show.dataset.sure) { show.dataset.sure = '1'; show.classList.add('sure'); show.textContent = 'Emin misin? Tekrar tıkla'; return; }
      send({ type: 'allowUrl', url: location.href });
      settings.allowed = true;
      deactivate();
    });
    return host;
  }
  let realTitle = null;
  function blockPage(why) {
    if (pageBlocked || !active) return;
    pageBlocked = true;
    lastPageReason = why;
    root.setAttribute('data-g6s-page', why);
    shield = buildShield();
    root.appendChild(shield);
    silenceWithin(document);
    if (document.title !== MASK_TITLE) realTitle = document.title;
    maskTitle();
    blockCount++;
    countVisit(root, 'page');
    scheduleBadge();
  }
  function releasePage() {
    if (!pageBlocked) return;
    pageBlocked = false;
    root.removeAttribute('data-g6s-page');
    if (shield) shield.remove();
    shield = null;
    blockCount = Math.max(0, blockCount - 1);
    scheduleBadge();
  }
  const MASK_TITLE = 'Spoiler Kalkanı';
  function maskTitle() {
    if (IS_TOP && document.title !== MASK_TITLE) document.title = MASK_TITLE;
  }

  /* ---------- Page signals ---------- */
  const META_SEL = 'meta[property="og:title" i],meta[name="twitter:title" i],meta[name="title" i],meta[property="og:description" i],meta[name="description" i],meta[name="keywords" i],meta[property="og:url" i],link[rel="canonical" i],meta[property="og:image" i],meta[property="article:tag" i],meta[property="og:video:tag" i]';
  function checkPageSignals() {
    if (!active) return;
    // Whole-page blocks need a core hit; strict-mode rules only hide individual elements.
    if (core(() => hasMatchUrl(location.href))) return blockPage('url');
    if (core(() => hasMatch(document.title))) return blockPage('title');
    for (const m of document.querySelectorAll(META_SEL)) {
      const v = m.getAttribute('content') || m.getAttribute('href') || '';
      if (core(() => /url|canonical|image/i.test(m.getAttribute('property') || m.getAttribute('rel') || '') ? hasMatchUrl(v) : hasMatch(v))) return blockPage('meta');
    }
  }

  // Many hits in one document means the page itself is on topic, even if its title is not.
  let densityTimer = 0;
  function scheduleDensity() {
    if (densityTimer || !IS_TOP) return;
    densityTimer = setTimeout(() => {
      densityTimer = 0;
      if (!document.body || pageBlocked) return;
      const hasFeedCards = !!document.querySelector('ytd-app,shreddit-app,[data-testid="primaryColumn"]');
      if (hasFeedCards) return;
      const totalLen = (document.body.textContent || '').length || 1;
      if (coreBlocks >= 3 && totalBlockedText / totalLen > 0.2) blockPage('density');
    }, 400);
  }

  /* ---------- Attribute scan ---------- */
  function checkAttrs(el) {
    if (!el.getAttribute || SKIP_TAGS.has(el.tagName) || el.tagName === 'BASE') return false;
    for (const a of TEXT_ATTRS) {
      const v = el.getAttribute(a);
      if (v && hasMatch(v)) return true;
    }
    for (const a of URL_ATTRS) {
      const v = el.getAttribute(a);
      if (v && hasMatchUrl(v)) return true;
    }
    const st = el.getAttribute('style');
    if (st && st.includes('url(')) {
      const m = st.match(/url\((['"]?)(.*?)\1\)/);
      if (m) {
        if (hasMatchUrl(m[2])) return true;
        try { queueBackground(el, new URL(m[2], document.baseURI).href); } catch { /* bad URL */ }
      }
    }
    return false;
  }

  /* ---------- Text scan ---------- */
  function blockParent(el, cache) {
    let p = cache.get(el);
    if (p) return p;
    p = el;
    while (p && INLINE.has(p.tagName) && p.parentElement) p = p.parentElement;
    cache.set(el, p);
    return p;
  }

  function scanText(rootNode) {
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode;
        if (!p || SKIP_TAGS.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const nodes = [];
    const starts = [];
    const parts = [];
    const cache = new Map();
    let len = 0, lastBlock = null, n;
    while ((n = walker.nextNode())) {
      const pe = n.parentElement;
      if (!pe) continue;
      if (pe.hasAttribute('data-g6s-hide') || pe.hasAttribute('data-g6s-mask')) continue;
      const bp = blockParent(pe, cache);
      if (lastBlock && bp !== lastBlock) { parts.push('\n'); len += 1; }
      lastBlock = bp;
      nodes.push(n); starts.push(len);
      const v = n.nodeValue;
      parts.push(v);
      len += v.length;
    }
    if (!nodes.length) return;
    // Per-part normalization keeps the \n block markers that normalize() would flatten.
    const norm = parts.map(p => p === '\n' ? '\n' : normalize(p)).join('');
    const hits = findNormalized(norm, false);
    if (!hits.length) return;
    const nodeAt = off => {
      let lo = 0, hi = starts.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= off) lo = m; else hi = m - 1; }
      return nodes[lo];
    };
    for (const [s, e] of hits) {
      const a = nodeAt(s), b = nodeAt(Math.max(s, e - 1));
      let el = a.parentElement;
      if (a !== b) {
        const r = document.createRange();
        try {
          r.setStartBefore(a); r.setEndAfter(b);
          const c = r.commonAncestorContainer;
          el = c.nodeType === 1 ? c : c.parentElement;
        } catch { /* different roots */ }
      }
      blockFrom(el, 'text');
    }
  }

  function scanSubtree(node) {
    if (!active || !node) return;
    if (node.nodeType === 3) { const b = node.parentElement && climb(node.parentElement); if (b) scanText(b); return; }
    if (node.nodeType !== 1 && node.nodeType !== 11 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      if (SKIP_TAGS.has(node.tagName)) return;
      if (inBlocked(node) || isRevealed(node)) return;
      if (checkAttrs(node)) blockFrom(node, 'attr');
    }
    if (node.querySelectorAll) {
      for (const el of node.querySelectorAll(ATTR_SEL)) {
        if (checkAttrs(el) && !isRevealed(el)) blockFrom(el, 'attr');
      }
    }
    scanText(node);
    discoverShadows(node);
    scanImagesIn(node);
  }
  function climb(el) {
    let c = el, i = 0;
    while (c && INLINE.has(c.tagName) && c.parentElement && i++ < 5) c = c.parentElement;
    return c;
  }

  /* ---------- Images and video ---------- */
  // Each image is hidden until its fingerprint has been compared. The check starts as soon as
  // the image is near the viewport, often before the page has finished downloading it, so the
  // verdict is usually ready at load time. Images far down the page wait until they come close.
  const MIN_SIDE = 64;
  const IMG_TIMEOUT = 8000; // counted from the start of the check; only a dead worker reaches it
  const imgState = new WeakMap(); // img -> { url, started, verdict, done }
  const watching = new Set();
  function release(el) { if (!el.hasAttribute('data-g6s-ok')) el.setAttribute('data-g6s-ok', ''); }

  function onImgLoad(e) { if (e.target && e.target.tagName === 'IMG') checkImage(e.target); }
  function onImgError(e) {
    const t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    const st = imgState.get(t);
    if (st) { st.done = true; watching.delete(t); }
    if (!inBlocked(t)) release(t);
  }

  // Slides beside the viewport are checked early too, so a carousel never shows a blank slide.
  const near = r => r.bottom > -600 && r.top < innerHeight + 600 && r.right > -innerWidth && r.left < innerWidth * 2;
  const nearView = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) startHash(e.target, e.boundingClientRect);
  }, { rootMargin: '600px 100%' });
  // Fallback for images the observer does not report, such as ones inside clipped sliders.
  setInterval(() => {
    for (const img of watching) {
      if (!img.isConnected) { watching.delete(img); continue; }
      const r = img.getBoundingClientRect();
      if (near(r)) startHash(img, r);
    }
  }, 700);

  function finish(img, st) {
    if (st.done) return;
    st.done = true;
    img.dataset.g6sSt = 'done';
    clearTimeout(st.timer);
    watching.delete(img);
    nearView.unobserve(img);
    if (st.verdict) { hitUrls.add(st.url); blockFrom(img, 'hash'); }
    release(img);
  }

  function checkImage(img) {
    if (!active) return release(img);
    const url = img.currentSrc || img.src;
    if (!url) return;
    let st = imgState.get(img);
    if (!st || st.url !== url) {
      if (st) clearTimeout(st.timer);
      st = { url, started: false, verdict: undefined, done: false };
      imgState.set(img, st);
      img.dataset.g6sSt = 'new';
      img.dataset.g6sChecked = url;
      img.removeAttribute('data-g6s-ok');
      if (hasMatchUrl(url)) { st.done = true; blockFrom(img, 'attr'); return; }
    }
    if (st.done) return;
    if (img.complete) {
      if (img.naturalWidth === 0) { st.done = true; if (!inBlocked(img)) release(img); return; }
      if ((img.naturalWidth < MIN_SIDE && img.naturalHeight < MIN_SIDE) || !settings.visual || /\.svg(\?|$)/i.test(url)) {
        st.done = true; release(img); return;
      }
      if (st.verdict !== undefined) return finish(img, st);
    } else if (!/^https?:/i.test(url)) {
      return; // blob and data images are read after they load
    }
    if (!st.started) {
      // Already near the viewport (typical at load time): start now instead of waiting for the observer.
      if (img.complete) {
        const r = img.getBoundingClientRect();
        if (r.width > 0 && near(r)) return startHash(img, r);
      }
      watching.add(img); nearView.observe(img); img.dataset.g6sSt = 'watch';
    }
  }

  function startHash(img, rect) {
    const st = imgState.get(img);
    if (!st || st.started || st.done) return;
    const url = st.url;
    if ((img.currentSrc || img.src) !== url) return;
    // A small image still loading may be an icon; wait for its real size.
    if (!img.complete && rect && rect.width < MIN_SIDE && rect.height < MIN_SIDE) return;
    st.started = true;
    img.dataset.g6sSt = 'started';
    watching.delete(img);
    nearView.unobserve(img);
    const urgent = !!rect && rect.bottom > 0 && rect.top < innerHeight;
    st.timer = setTimeout(() => { if (st.verdict === undefined) st.verdict = false; if (img.complete) finish(img, st); else release(img); }, IMG_TIMEOUT);
    const verdict = hit => {
      if (imgState.get(img) !== st) return; // the image changed meanwhile
      st.verdict = !!hit;
      img.dataset.g6sSt = 'verdict';
      if (img.complete) finish(img, st);
    };
    // Loaded same-origin, blob and data images can be read here without a second download.
    let local = false;
    try { local = img.complete && (url.startsWith('blob:') || url.startsWith('data:') || new URL(url, location.href).origin === location.origin); } catch { /* bad URL */ }
    if (local) {
      createImageBitmap(img).then(b => {
        const hashes = self.G6S.queryHashes(b, b.width, b.height);
        b.close();
        send({ type: 'hashQuery', hashes }, r => verdict(r && r.hit));
      }).catch(() => send({ type: 'hashUrl', url, urgent }, r => verdict(r && r.hit)));
    } else {
      send({ type: 'hashUrl', url, urgent }, r => verdict(r && r.hit));
    }
  }
  function scanImagesIn(node) {
    if (!node.querySelectorAll) return;
    const imgs = node.querySelectorAll('img');
    imgs.forEach(checkImage);
    if (node.tagName === 'IMG') checkImage(node);
    node.querySelectorAll('video').forEach(armVideo);
    if (node.tagName === 'VIDEO') armVideo(node);
  }
  const bgSeen = new WeakMap();
  function queueBackground(el, url) {
    if (!settings.visual || bgSeen.get(el) === url || !/^https?:/i.test(url)) return;
    bgSeen.set(el, url);
    send({ type: 'hashUrl', url }, r => {
      if (r && r.hit) { hitUrls.add(url); el.setAttribute('data-g6s-nobg', ''); blockFrom(el, 'hash'); }
    });
  }

  // Videos are held until the surrounding text has been scanned.
  function armVideo(v) {
    if (v.hasAttribute('data-g6s-ok') || v.dataset.g6sArmed) return;
    v.dataset.g6sArmed = '1';
    const poster = v.getAttribute('poster');
    if (poster) { try { queueBackground(v, new URL(poster, document.baseURI).href); } catch { /* bad URL */ } }
    setTimeout(() => {
      if (!pageBlocked && !inBlocked(v)) {
        release(v);
        if (v.dataset.g6sPaused && !playerHeld) resume(v);
      }
    }, document.readyState === 'loading' ? 700 : 250);
  }
  function onPlay(e) {
    const v = e.target;
    if (!active || !(v instanceof HTMLMediaElement)) return;
    if (pageBlocked || inBlocked(v) || playerHeld) silence(v);
  }

  /* ---------- YouTube: check a video's title before its player appears ---------- */
  let playerHeld = false;
  let lastVideoId = null;
  function ytVideoId() {
    const h = location.hostname;
    if (!/(^|\.)(youtube\.com|youtube-nocookie\.com)$/.test(h)) return null;
    if (location.pathname === '/watch') return new URLSearchParams(location.search).get('v');
    const m = location.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
    return m && m[1];
  }
  function checkYouTube() {
    if (!active) return;
    const id = ytVideoId();
    if (!id || id === lastVideoId) return;
    lastVideoId = id;
    if (self.G6S_DICT.videoIds.includes(id)) return blockPage('video');
    playerHeld = true;
    root.setAttribute('data-g6s-player-hold', '');
    document.querySelectorAll('video').forEach(silence);
    // The player opens only when both checks are done: the title from oEmbed, and the page's
    // own title and description for this video, which arrive a little later and are scanned
    // as they render. A clean title with a spoiler in the description must not play.
    const metaSel = location.pathname.startsWith('/shorts/')
      ? 'ytd-reel-video-renderer[is-active] h2, ytd-reel-video-renderer[is-active] yt-shorts-video-title-view-model, reel-player-header-renderer'
      : 'ytd-watch-metadata h1';
    const prevTitle = (document.querySelector(metaSel) || {}).textContent || '';
    // The page-metadata gate applies only to the main site's watch page; embeds, Shorts and
    // YouTube Music use the title check alone, so a selector that never matches cannot stall them.
    const metaGate = location.hostname === 'www.youtube.com' && location.pathname === '/watch';
    let titleOk = false, metaOk = !metaGate;
    const unhold = () => {
      if (lastVideoId !== id) return;
      clearInterval(poll);
      clearTimeout(fallback);
      playerHeld = false;
      root.removeAttribute('data-g6s-player-hold');
      if (pageBlocked) return;
      document.querySelectorAll('video[data-g6s-paused]').forEach(resume);
    };
    const maybeUnhold = () => { if (titleOk && metaOk) requestAnimationFrame(unhold); };
    const poll = !metaGate ? 0 : setInterval(() => {
      if (lastVideoId !== id || pageBlocked) { clearInterval(poll); return; }
      // On a full page load the video's title, description and tags are already in the page's
      // data script, well before they render. Scanning that lets a clean video start sooner.
      const data = initialVideoData(id);
      if (data != null) {
        if (hasMatch(data.split('\n')[0]) || core(() => hasMatch(data))) { clearInterval(poll); return blockPage('video'); }
        metaOk = true; clearInterval(poll); return maybeUnhold();
      }
      const t = (document.querySelector(metaSel) || {}).textContent || '';
      const desc = location.pathname.startsWith('/shorts/') || document.querySelector('ytd-watch-metadata #description, ytd-watch-metadata ytd-text-inline-expander');
      if (t.trim() && t !== prevTitle && desc) { metaOk = true; clearInterval(poll); maybeUnhold(); }
    }, 100);
    const fallback = setTimeout(unhold, 5000); // never keep a clean video waiting longer than this
    send({ type: 'ytInfo', id }, r => {
      const title = r && r.text ? r.text.split('\n')[0] : '';
      if (r && r.text && lastVideoId === id && (hasMatch(title) || core(() => hasMatch(r.text)))) return blockPage('video');
      titleOk = true;
      maybeUnhold();
    });
  }

  // Title, description, author and tags of the video from the page's initial data, or null.
  function initialVideoData(id) {
    for (const s of document.scripts) {
      const t = s.textContent || '';
      if (!t.includes('ytInitialPlayerResponse') || !t.includes('"videoId":"' + id + '"')) continue;
      const at = t.indexOf('"videoDetails"');
      if (at < 0 || !t.includes('"shortDescription"', at)) continue;
      const part = t.slice(at, at + 200000);
      const pick = re => { const m = part.match(re); try { return m ? JSON.parse('"' + m[1] + '"') : ''; } catch { return ''; } };
      return [pick(/"title":"((?:[^"\\]|\\.)*)"/), pick(/"shortDescription":"((?:[^"\\]|\\.)*)"/), pick(/"author":"((?:[^"\\]|\\.)*)"/), (part.match(/"keywords":\[([^\]]*)\]/) || [])[1] || ''].join('\n');
    }
    return null;
  }

  /* ---------- Observing ---------- */
  const recheck = new Set();
  let recheckTimer = 0;
  function queueRecheck(node) {
    const b = closestDeep(node, '[data-g6s-hide],[data-g6s-mask]');
    if (!b) return false;
    recheck.add(b);
    if (!recheckTimer) recheckTimer = setTimeout(runRecheck, 120);
    return true;
  }
  // Sites reuse card elements for new content, so a stale block has to be lifted.
  // Text of an element including any shadow roots inside it.
  function deepText(el) {
    let t = el.textContent || '';
    const hosts = el.shadowRoot ? [el] : [];
    for (const d of el.querySelectorAll('*')) if (d.shadowRoot) hosts.push(d);
    for (const h of hosts) t += '\n' + deepText(h.shadowRoot);
    return t;
  }
  function stillMatches(el) {
    const t = normalize(deepText(el));
    if (t && findNormalized(t, true).length) return true;
    if (checkAttrsQuiet(el)) return true;
    for (const a of el.querySelectorAll(ATTR_SEL)) if (checkAttrsQuiet(a)) return true;
    for (const i of el.querySelectorAll('img')) if (hitUrls.has(i.currentSrc || i.src)) return true;
    if (el.tagName === 'IMG' && hitUrls.has(el.currentSrc || el.src)) return true;
    if (el.hasAttribute('data-g6s-nobg') || el.querySelector('[data-g6s-nobg]')) return true;
    return false;
  }
  function checkAttrsQuiet(el) {
    for (const a of TEXT_ATTRS) { const v = el.getAttribute(a); if (v && hasMatch(v)) return true; }
    for (const a of URL_ATTRS) { const v = el.getAttribute(a); if (v && hasMatchUrl(v)) return true; }
    return false;
  }
  function runRecheck() {
    recheckTimer = 0;
    for (const b of recheck) {
      if (!b.isConnected) { blocked.delete(b); continue; }
      if (!stillMatches(b)) { unblock(b); scanSubtree(b); }
    }
    recheck.clear();
  }
  // Sites such as YouTube refill a card in ways that do not always reach the observer.
  // Every few seconds, blocks whose cause is gone are lifted.
  setInterval(() => {
    if (!active) return;
    // Only feed cards: their hit is in their own text. A generic block may owe its hit to a
    // neighbouring block or a shadow root that this check cannot see.
    for (const b of blocked) if (b.getAttribute('data-g6s-why') !== 'hash' && b.matches(CARD_SEL)) recheck.add(b);
    if (recheck.size) runRecheck();
  }, 3000);

  function handleMutations(list) {
    if (!active) return;
    const targets = new Set();
    for (const m of list) {
      if (m.type === 'childList') {
        if (m.target.nodeName === 'TITLE' || (m.target === document.head)) { checkPageSignals(); }
        if (queueRecheck(m.target)) continue;
        for (const n of m.addedNodes) {
          if (n.nodeType === 3) { const b = n.parentElement && climb(n.parentElement); if (b) targets.add(b); }
          else if (n.nodeType === 1) {
            if (n.tagName === 'G6S-SHIELD') continue;
            targets.add(INLINE.has(n.tagName) ? climb(n) : n);
          }
        }
      } else if (m.type === 'characterData') {
        if (m.target.parentNode && m.target.parentNode.nodeName === 'TITLE') { checkPageSignals(); continue; }
        if (queueRecheck(m.target.parentElement || m.target)) continue;
        const b = m.target.parentElement && climb(m.target.parentElement);
        if (b) targets.add(b);
      } else if (m.type === 'attributes') {
        const el = m.target;
        const name = m.attributeName;
        if (name === 'data-g6s-shadow') { attachShadow(el); continue; }
        if (name === 'style' && !(el.getAttribute('style') || '').includes('url(')) continue;
        if (queueRecheck(el)) continue;
        if (checkAttrs(el) && !isRevealed(el)) blockFrom(el, 'attr');
        if (el.tagName === 'IMG' && (name === 'src' || name === 'srcset')) checkImage(el);
      }
    }
    for (const t of targets) {
      if (t.nodeName === 'HEAD' || t.closest && t.closest('head')) { checkPageSignals(); continue; }
      scanSubtree(t);
    }
    if (document.head) checkHeadOnce();
  }
  let headChecks = 0;
  function checkHeadOnce() {
    if (headChecks < 40) { headChecks++; checkPageSignals(); }
  }

  let mos = [];
  function observe(target) {
    const mo = new MutationObserver(handleMutations);
    mo.observe(target, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ALL_ATTRS.concat(['style', 'data-g6s-shadow']) });
    mos.push(mo);
  }

  /* ---------- Navigation in single-page apps ---------- */
  let lastUrl = location.href;
  function onUrlMaybeChanged() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (IS_TOP) { flushVisit(); visit = newVisit(); }
    headChecks = 0;
    releasePage();
    if (!active) return;
    send({ type: 'state', url: location.href }, s => { if (s && s.allowed && active) deactivate(); });
    checkPageSignals();
    checkYouTube();
  }
  if (window.navigation) {
    navigation.addEventListener('navigatesuccess', onUrlMaybeChanged);
    navigation.addEventListener('currententrychange', onUrlMaybeChanged);
  }
  setInterval(onUrlMaybeChanged, 500);

  /* ---------- Messaging ---------- */
  function send(msg, cb) {
    try {
      chrome.runtime.sendMessage(msg, r => {
        void chrome.runtime.lastError;
        if (cb) cb(r);
      });
    } catch { if (cb) cb(null); }
  }
  // History: one entry per page visit, each blocked node counted once.
  const newVisit = () => ({ id: (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)), startedAt: Date.now(), url: location.href, seen: new WeakSet(), counts: { text: 0, image: 0, video: 0, page: 0 } });
  let visit = newVisit();
  let visitTimer = 0;
  function countVisit(node, kind) {
    if (!IS_TOP || visit.seen.has(node)) return;
    visit.seen.add(node);
    visit.counts[kind]++;
    if (!visitTimer) visitTimer = setTimeout(flushVisit, 1500);
  }
  function flushVisit() {
    clearTimeout(visitTimer); visitTimer = 0;
    const c = visit.counts;
    if (c.text + c.image + c.video + c.page) send({ type: 'visitLog', visitId: visit.id, startedAt: visit.startedAt, url: visit.url, counts: Object.assign({}, c) });
  }
  if (IS_TOP) addEventListener('pagehide', flushVisit);

  function scheduleBadge() {
    if (badgeTimer || !IS_TOP) return;
    badgeTimer = setTimeout(() => { badgeTimer = 0; send({ type: 'count', count: blockCount }); }, 300);
  }

  function deactivate() {
    active = false;
    root.setAttribute('data-g6s-off', '');
    for (const m of mos) m.disconnect();
    mos = [];
    releasePage();
    for (const b of Array.from(blocked)) unblock(b);
    document.querySelectorAll('[data-g6s-nobg]').forEach(e => e.removeAttribute('data-g6s-nobg'));
    root.removeAttribute('data-g6s-player-hold');
    playerHeld = false;
    document.querySelectorAll('img,video').forEach(release);
    for (const sr of shadowRoots) sr.querySelectorAll('img,video').forEach(release);
    document.querySelectorAll('video[data-g6s-paused]').forEach(resume);
    if (realTitle) document.title = realTitle;
  }
  function start() {
    active = true;
    root.removeAttribute('data-g6s-off');
    observe(document);
    scanSubtree(document.documentElement);
    checkPageSignals();
    checkYouTube();
  }

  /* ---------- Listeners ---------- */
  // Load events do not bubble but they can be captured.
  document.addEventListener('load', onImgLoad, true);
  document.addEventListener('error', onImgError, true);
  document.addEventListener('play', onPlay, true);
  document.addEventListener('playing', onPlay, true);

  // Bridge for main-world.js. Cancelling the event means "this text is a spoiler".
  root.addEventListener('g6s-check', e => { if (active && typeof e.detail === 'string' && hasMatch(e.detail)) e.preventDefault(); });

  // A click on a masked card must not open it.
  const swallow = e => {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-g6s-mask')) { e.preventDefault(); e.stopPropagation(); }
  };
  window.addEventListener('click', swallow, true);
  window.addEventListener('auxclick', swallow, true);
  window.addEventListener('dblclick', e => {
    const t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-g6s-mask')) return;
    e.preventDefault(); e.stopPropagation();
    if (confirm('Bu içerik spoiler olabilir. Yine de göstermek istiyor musun?')) {
      revealed.add(t);
      unblock(t);
    }
  }, true);

  // Tab title: a hidden tab can still leak through its title.
  function watchTitle() {
    new MutationObserver(() => {
      if (!pageBlocked) return;
      if (document.title !== MASK_TITLE) realTitle = document.title;
      maskTitle();
    }).observe(document.head || root, { subtree: true, childList: true, characterData: true });
  }

  chrome.runtime.onMessage.addListener((msg, _s, reply) => {
    if (msg.type === 'getCount' && IS_TOP) reply({ count: blockCount, counts: visit.counts, host: location.hostname, page: pageBlocked, active });
  });

  // Scanning starts right now, before settings arrive; protection is the default.
  start();
  if (document.head) watchTitle(); else document.addEventListener('DOMContentLoaded', watchTitle, { once: true });
  send({ type: 'state', url: location.href }, s => {
    if (!s) return;
    settings = Object.assign(settings, s);
    if (s.videoIds && s.videoIds.length) for (const v of s.videoIds) if (!self.G6S_DICT.videoIds.includes(v)) self.G6S_DICT.videoIds.push(v);
    if ((s.terms && s.terms.length) || s.strict === false || (s.videoIds && s.videoIds.length)) {
      self.G6S.setStrict(s.strict !== false);
      setExtraTerms(s.terms || []);
      if (s.enabled && !s.allowed) {
        // The first scan ran with the default rules; redo everything with the user's rules.
        releasePage();
        for (const b of Array.from(blocked)) if (b.getAttribute('data-g6s-why') !== 'hash') unblock(b);
        scanSubtree(document.documentElement);
        checkPageSignals();
      }
    }
    if (!s.enabled || s.allowed) deactivate();
    else if (s.domainBlocked) blockPage('domain');
  });

  // Fail-safe for images whose load event we missed.
  document.addEventListener('DOMContentLoaded', () => { checkPageSignals(); scanSubtree(document.documentElement); });
  window.addEventListener('load', () => {
    scanSubtree(document.documentElement);
    setTimeout(() => document.querySelectorAll('img:not([data-g6s-ok])').forEach(i => { if (!inBlocked(i)) checkImage(i); }), 300);
  });
})();
