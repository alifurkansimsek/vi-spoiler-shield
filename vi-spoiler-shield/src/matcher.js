// Text engine. normalize() is 1:1 in UTF-16 length so match offsets map back to DOM text nodes.
(function (g) {
  const SPECIAL = {
    'ı': 'i', 'İ': 'i', 'ş': 's', 'ğ': 'g', 'ç': 'c', 'ö': 'o', 'ü': 'u', 'ß': 's', 'ø': 'o', 'đ': 'd', 'ł': 'l',
    // Cyrillic and Greek look-alikes
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'х': 'x', 'у': 'y', 'і': 'i', 'ї': 'i', 'ј': 'j', 'ѕ': 's', 'ѵ': 'v', 'г': 'g', 'к': 'k', 'м': 'm', 'н': 'h', 'в': 'b',
    'α': 'a', 'ο': 'o', 'τ': 't', 'ν': 'v', 'ι': 'i', 'ε': 'e', 'κ': 'k', 'ρ': 'p', 'υ': 'y', 'χ': 'x',
    // Single-character numerals
    'ⅵ': '6', 'Ⅵ': '6', '⑥': '6', '⑹': '6', '⒍': '6', '❻': '6', '➏': '6', '➅': '6', '⓺': '6', '６': '6', '₆': '6', '⁶': '6',
    '’': "'", 'ʼ': "'", '‘': "'", '`': "'", '´': "'"
  };
  const cache = new Map();

  function foldCp(cp) {
    let r = cache.get(cp);
    if (r !== undefined) return r;
    const ch = String.fromCodePoint(cp);
    if (cp === 0x200B || cp === 0x200C || cp === 0x200D || cp === 0x2060 || cp === 0xFEFF || cp === 0xAD ||
        (cp >= 0xFE00 && cp <= 0xFE0F) || cp === 0x20E3 || (cp >= 0x300 && cp <= 0x36F)) r = ' ';
    else if (SPECIAL[ch]) r = SPECIAL[ch];
    else if (cp >= 0x1F1E6 && cp <= 0x1F1FF) r = String.fromCharCode(97 + cp - 0x1F1E6); // regional indicators
    else if (cp >= 0x1F170 && cp <= 0x1F189) r = String.fromCharCode(97 + cp - 0x1F170); // negative squared letters
    else if (cp >= 0x1F150 && cp <= 0x1F169) r = String.fromCharCode(97 + cp - 0x1F150); // negative circled letters
    else if (cp < 0x2E80 || (cp >= 0xFF00 && cp <= 0xFFEF) || (cp >= 0x1D400 && cp <= 0x1D7FF) || (cp >= 0x1F100 && cp <= 0x1F149)) {
      // Decompose accents and styled letters, but leave CJK and Hangul alone.
      const d = ch.normalize('NFKD').toLowerCase();
      const first = d.codePointAt(0);
      r = String.fromCodePoint(first);
      if (SPECIAL[r]) r = SPECIAL[r];
      if (r.length > 1) r = ' ';
    } else r = ch;
    if (r.length !== 1) r = r.charCodeAt(0) < 0xD800 ? r[0] : ' ';
    cache.set(cp, r);
    return r;
  }

  // eslint-disable-next-line no-control-regex
  const ASCII = /^[\x00-\x7f]*$/;
  function normalize(s) {
    if (ASCII.test(s)) return s.toLowerCase().replace(/[\r\t\f\v\n]/g, ' ').replace(/`/g, "'");
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 128) {
        if (c === 10 || c === 13 || c === 9 || c === 12 || c === 11) out += ' ';
        else if (c === 96) out += "'";
        else out += s[i].toLowerCase();
      } else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
        out += foldCp(s.codePointAt(i)) + ' ';
        i++;
      } else {
        const f = foldCp(c);
        out += f.length === 1 ? f : ' ';
      }
    }
    return out;
  }

  const rot13 = s => s.replace(/[a-z]/gi, c => {
    const b = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
  });
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const L = '(?<![\\p{L}\\p{N}])';
  const R = '(?![\\p{L}\\p{N}])';
  const GAP = "[\\s._\\-*~·•|/\\\\'\"+]{0,2}"; // between letters of an abbreviation
  const SEP = '[^\\p{L}\\p{N}\\n]{0,12}';     // between words, never across a block boundary
  const TIME_EN = '(?:\\s*(?:sec|second|min|minute|hr|hour|day|week|month|year)s?\\s+ago)';
  const TIME_TR = '(?:\\s*(?:saniye|dakika|saat|gun|hafta|ay|yil)\\s+once)';
  const SIX = `(?:6(?![0-9.,:]*[0-9])(?!${TIME_EN})(?!${TIME_TR})|vi${R}|six${R}|alti${R}|sechs${R}|seis${R})`;
  const GTA = `(?:g${GAP}t${GAP}(?:a|@)|6t(?:a|@)|g7(?:a|@))`;
  const GRAND = `grand${SEP}theft${SEP}auto`;

  const CORE = [
    `${L}${GTA}${SEP}${SIX}`,
    `${L}${GRAND}${SEP}${SIX}`,
    `${L}gta${SEP}(?:5|v)\\s*(?:ve|and|&|vs\\.?|/|or|veya)\\s*${SIX}`,
    `${L}(?:next|new|upcoming|yeni|gelecek|siradaki)${SEP}(?:gta|grand${SEP}theft${SEP}auto)${R}(?!${SEP}(?:online|trilogy|5|v|iv|san|vice|definitive|update|guncelleme))`,
    `${L}gta${SEP}sequel`,
    `${L}rockstar(?:'s|s|'in|in|'ın)?${SEP}(?:next|new|upcoming|yeni|gelecek|siradaki)${SEP}(?:game|oyun)`,
    // Other scripts
    'グランド[・\\s]*セフト[・\\s]*オート[\\s・]*(?:6|vi)',
    'グラセフ[\\s]*(?:6|vi)',
    '(?:侠盗猎车手|俠盜獵車手|侠盗飞车|俠盜飛車)[\\s:：]*(?:6|vi)',
    '그랜드\\s*테프트\\s*오토\\s*(?:6|vi)',
    '(?:جي\\s*تي\\s*(?:اي|أي|ايه|إيه|آي)\\s*|جراند\\s*ثيفت\\s*أوتو\\s*)(?:6|٦)',
    // Cyrillic spelling, after normalize() has mapped its look-alike letters
    `${L}gpahд${SEP}teфt${SEP}abto${SEP}${SIX}`
  ];

  // Sites whose weak-term context would misfire on the older game of a similar name.
  const VC_EXCLUDE = /(stories|definitive|trilogy|tommy|vercetti|2002|2006|nightclub|miami vice)/;
  // Common first names need the series itself nearby; "trailer" or "gameplay" alone is too common.
  const CONTEXT = /(rockstar|\bgta\b|grand theft auto|take[ -]?two)/;
  // "Rockstar" alone is not enough here: the older game is also a Rockstar game.
  const CONTEXT_VC = /(2026|2027|fragman|trailer|\bps5\b|xbox series|sizinti|\bleak)/;
  const WEAK_WINDOW = 260;
  // Both protagonists named in one passage with talk of a game ("Lucia's story… gameplay than
  // Jason's… from the trailers"): one common first name with a game word is not enough
  // (other games have a Jason or a Lucia), both together are.
  const GAME_TALK = /(oyun|oyna|fragman|trailer|gameplay|karakter|character|hikaye|story ?mode|storyline|protagonist|\bps5\b|xbox|playstation|video ?game|spoiler|\bleak|sizinti|\bdlc\b|cutscene|ara sahne|seslendir|voice act|motion capture)/;
  // Phrases that point at the game without naming it, when the series or studio is close by.
  // No trailing boundary after "gta": handles such as "gtav6" or "gtanews" count too.
  const SERIES = /(\bgta|grand theft auto|grandtheftauto|rockstar)/;
  const CONTEXT_RULES = [
    // The console release date
    { re: /(?<![0-9])19(?:th)?\.?\s*(?:of\s+)?(?:kasim|november|nov\b\.?)|(?:november|nov\.?)\s*19(?:th)?(?![0-9])|(?<![0-9])19[./-]11[./-](?:20)?26(?![0-9])/g, not: /(2013|2008|2004|2002|2001)/ },
    // The third trailer
    { re: /(?:trailer|fragman)\s*(?:#|no\.?\s*)?3(?![0-9])|third trailer|3\.?\s*fragman|ucuncu fragman/g, not: /(red dead|\brdr|max payne|bully|midnight club|l\.?a\.? noire|liberty city|niko|(?:gta|grand theft auto)\s*(?:iv|v|4|5)(?![a-z0-9])|200[0-9]|201[0-9])/ }
  ];
  // Strict mode: the studio's name in a gaming context, and the city's name on its own.
  // Catches teasers that never name the game, at the cost of also hiding older Rockstar titles.
  let strict = true;
  const STRICT_RULES = [
    { re: /(?<![\p{L}\p{N}])rockstar(?:\s*games)?(?![\p{L}\p{N}])/gu,
      need: /(game|oyun|\bgta\b|grand theft|trailer|fragman|\bps5\b|playstation|xbox|release|cikis|launch|vice city|miami|leak|sizinti|@rockstar)/,
      not: /(energy|drink|enerji|post malone|21 savage|nickelback|lyrics|sarki sozleri)/ },
    { re: /(?<![\p{L}\p{N}])vice\s*city(?![\p{L}\p{N}])/gu, need: /./, not: /(stories|definitive|trilogy|vercetti|2002|2006|miami vice)/ },
    // The series named with no entry number ("GTA Week", "the best GTA"). An explicit older
    // entry right after the name keeps it visible.
    { re: /(?<![\p{L}\p{N}])(?:gta|grand\s*theft\s*auto)(?![\p{L}\p{N}])/gu, need: /./, not: /^$/,
      after: /^[\s:'\-–]*(?:v|iv|iii|ii|5|4|3|2|san\s*andreas|vice\s*city\s*stories|vice\s*city\s*definitive|liberty\s*city|london|chinatown|online|trilogy|advance|rp|roleplay)(?![\p{L}\p{N}])/u }
  ];
  const ANCHORS = new Set(['ivpr pvgl', 'xnyntn', "qer'dhna", 'obbovr'].map(rot13));
  const PAIR = new Set(['wnfba', 'yhpvn'].map(rot13));

  function compile(extraTerms) {
    const D = g.G6S_DICT;
    const strong = D.strong.map(rot13).concat((extraTerms || []).map(t => normalize(String(t)).trim()).filter(Boolean));
    // No general trailing boundary: Turkish suffixes without an apostrophe and joined hashtags
    // must still match. Only known collisions with real words are excluded.
    const NOT_AFTER = { [rot13('yrbavqn')]: '(?!s(?![\\p{L}\\p{N}]))' }; // a common personal name
    const strongSrc = strong.map(t => L + t.split(/\s+/).map(escapeRe).join(SEP) + (NOT_AFTER[t] || ''));
    // URLs are decoded with - and _ turned into spaces, so IDs accept all three.
    const ids = D.videoIds.map(id => `${L}${id.toLowerCase().split(/[-_]/).map(escapeRe).join('[-_ ]')}${R}`);
    // Two protagonists named together are a signal; two common first names far apart are not.
    const [a, b] = [rot13('wnfba'), rot13('yhpvn')];
    const link = `${SEP}(?:and|ve|ile|la|le|ve de|y|e|et|und|n|&|,)?${SEP}`;
    const pair = [`${L}${a}${link}${b}${R}`, `${L}${b}${link}${a}${R}`];
    const hardRe = new RegExp(CORE.concat(pair, strongSrc, ids).join('|'), 'gu');
    const weakTerms = D.weak.map(rot13);
    const weakRe = new RegExp(weakTerms.map(t => L + t.split(/\s+/).map(escapeRe).join(SEP)).join('|'), 'gu');
    return { hardRe, weakRe };
  }

  let compiled = compile([]);
  const setExtraTerms = terms => { compiled = compile(terms); };

  // Finds matches in text that is already normalized.
  function findNormalized(n, firstOnly) {
    const out = [];
    const { hardRe, weakRe } = compiled;
    hardRe.lastIndex = 0;
    let m;
    while ((m = hardRe.exec(n))) {
      out.push([m.index, m.index + m[0].length]);
      if (firstOnly) return out;
      if (m[0].length === 0) hardRe.lastIndex++;
    }
    weakRe.lastIndex = 0;
    const weak = [];
    while ((m = weakRe.exec(n))) weak.push([m.index, m.index + m[0].length, m[0].replace(/\s+/g, ' ')]);
    for (let i = 0; i < weak.length; i++) {
      const [s, e, term] = weak[i];
      const a = Math.max(0, s - WEAK_WINDOW), b = Math.min(n.length, e + WEAK_WINDOW);
      const win = n.slice(a, b);
      if ((win.match(/\n/g) || []).length > 5) continue; // too far apart in the page structure
      // A pair counts only if one side is a distinctive term rather than a common first name.
      const other = weak.some((w, j) => j !== i && w[2] !== term && w[0] >= a && w[1] <= b && (ANCHORS.has(term) || ANCHORS.has(w[2])));
      let hit = other;
      if (!hit && PAIR.has(term)) hit = weak.some((w, j) => j !== i && PAIR.has(w[2]) && w[2] !== term && w[0] >= a && w[1] <= b) && GAME_TALK.test(win);
      if (!hit) {
        if (term === 'vice city' || term === rot13('ivpr pvgl')) hit = !VC_EXCLUDE.test(win) && CONTEXT_VC.test(win);
        else if (term !== rot13('wnfba') || !/(schreier|momoa|statham|bourne)/.test(win)) hit = CONTEXT.test(win);
      }
      if (hit) {
        out.push([s, e]);
        if (firstOnly) return out;
      }
    }
    if (strict) for (const rule of STRICT_RULES) {
      rule.re.lastIndex = 0;
      while ((m = rule.re.exec(n))) {
        const a = Math.max(0, m.index - 150), b = Math.min(n.length, m.index + m[0].length + 150);
        const win = n.slice(a, b);
        // Rules that need no context also apply in one-word lists (trends, chips, sidebars).
        const contextFree = rule.need.source === '.';
        if ((!contextFree && (win.match(/\n/g) || []).length > 5) || !rule.need.test(win) || rule.not.test(win)) continue;
        if (rule.after && rule.after.test(n.slice(m.index + m[0].length, m.index + m[0].length + 40))) continue;
        out.push([m.index, m.index + m[0].length]);
        if (firstOnly) return out;
      }
    }
    for (const rule of CONTEXT_RULES) {
      rule.re.lastIndex = 0;
      while ((m = rule.re.exec(n))) {
        const a = Math.max(0, m.index - 150), b = Math.min(n.length, m.index + m[0].length + 150);
        const win = n.slice(a, b);
        if ((win.match(/\n/g) || []).length > 5 || !SERIES.test(win) || rule.not.test(win)) continue;
        out.push([m.index, m.index + m[0].length]);
        if (firstOnly) return out;
      }
    }
    return out;
  }

  const hasMatch = raw => !!raw && findNormalized(normalize(raw), true).length > 0;

  function decodeUrl(u) {
    let s = String(u).replace(/\+/g, ' ');
    for (let i = 0; i < 2; i++) { try { const d = decodeURIComponent(s); if (d === s) break; s = d; } catch { break; } }
    return s.replace(/[-_]+/g, ' ');
  }
  const hasMatchUrl = u => !!u && !/^data:/i.test(u) && hasMatch(decodeUrl(String(u).slice(0, 2048)));

  const setStrict = on => { strict = !!on; };
  g.G6S = Object.assign(g.G6S || {}, { normalize, findNormalized, hasMatch, hasMatchUrl, decodeUrl, setExtraTerms, setStrict, rot13 });
})(typeof self !== 'undefined' ? self : globalThis);
