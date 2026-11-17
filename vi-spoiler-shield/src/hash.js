// Perceptual hash (64-bit DCT pHash), shared by the service worker, content script and DB builder.
(function (g) {
  const N = 32, K = 8;
  const COS = new Float64Array(N * K);
  for (let u = 0; u < K; u++) for (let x = 0; x < N; x++) COS[u * N + x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));

  const POP = new Uint8Array(65536);
  for (let i = 1; i < 65536; i++) POP[i] = POP[i >> 1] + (i & 1);
  const pop32 = v => POP[v & 0xffff] + POP[v >>> 16];

  // source: ImageBitmap/canvas/img. crop: [sx, sy, sw, sh] in source pixels.
  function hashRegion(source, crop) {
    const c = new OffscreenCanvas(N, N);
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.drawImage(source, crop[0], crop[1], crop[2], crop[3], 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N).data;
    const sig = new Array(48).fill(0);
    const gray = new Float64Array(N * N);
    let sum = 0, sq = 0;
    for (let i = 0; i < N * N; i++) {
      const v = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      gray[i] = v; sum += v; sq += v * v;
      const cell = (((i / N) | 0) >> 3) * 4 + ((i % N) >> 3);
      sig[cell * 3] += d[i * 4]; sig[cell * 3 + 1] += d[i * 4 + 1]; sig[cell * 3 + 2] += d[i * 4 + 2];
    }
    for (let i = 0; i < 48; i++) sig[i] = Math.round(sig[i] / 64);
    const mean = sum / (N * N);
    const std = Math.sqrt(Math.max(0, sq / (N * N) - mean * mean));
    if (std < 14) return null; // flat image: its hash means nothing

    const tmp = new Float64Array(K * N);
    for (let y = 0; y < N; y++) for (let u = 0; u < K; u++) {
      let s = 0;
      for (let xx = 0; xx < N; xx++) s += gray[y * N + xx] * COS[u * N + xx];
      tmp[u * N + y] = s;
    }
    const co = new Float64Array(K * K);
    for (let u = 0; u < K; u++) for (let v = 0; v < K; v++) {
      let s = 0;
      for (let y = 0; y < N; y++) s += tmp[u * N + y] * COS[v * N + y];
      co[u * K + v] = s;
    }
    const sorted = Array.from(co).slice(1).sort((a, b) => a - b);
    const median = sorted[(sorted.length / 2) | 0];
    let hi = 0, lo = 0;
    for (let i = 0; i < 64; i++) {
      if (co[i] > median) { if (i < 32) hi |= 1 << i; else lo |= 1 << (i - 32); }
    }
    return [hi >>> 0, lo >>> 0].concat(sig);
  }

  const center = (w, h, fw, fh) => [(w - w * fw) / 2, (h - h * fh) / 2, w * fw, h * fh];
  function aspect(w, h, ar) {
    return w / h > ar ? [(w - h * ar) / 2, 0, h * ar, h] : [0, (h - w / ar) / 2, w, w / ar];
  }

  // Trims black or white bars, which video thumbnails often have.
  function trimBars(source, w, h) {
    const S = 64;
    const c = new OffscreenCanvas(S, S);
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(source, 0, 0, S, S);
    const d = x.getImageData(0, 0, S, S).data;
    const flat = y => {
      let mn = 255, mx = 0;
      for (let i = 0; i < S; i++) { const v = d[(y * S + i) * 4 + 1]; if (v < mn) mn = v; if (v > mx) mx = v; }
      return mx - mn < 18;
    };
    let t = 0, b = S - 1;
    while (t < S / 3 && flat(t)) t++;
    while (b > (2 * S) / 3 && flat(b)) b--;
    if (t < 3 && S - 1 - b < 3) return null;
    return [0, (t / S) * h, w, ((b - t + 1) / S) * h];
  }

  // Mirrored copy of a region, drawn into a canvas the size of the region.
  function flipped(source, r) {
    const w = Math.max(1, Math.round(r[2])), h = Math.max(1, Math.round(r[3]));
    const c = new OffscreenCanvas(w, h);
    const x = c.getContext('2d');
    x.translate(w, 0); x.scale(-1, 1);
    x.drawImage(source, r[0], r[1], r[2], r[3], 0, 0, w, h);
    return hashRegion(c, [0, 0, w, h]);
  }

  // Variants stored in the DB. Each entry is [hi, lo, ...48 color values].
  // A crop of aspect ar slid along the long side: pos 0 = top/left, 1 = bottom/right.
  function aligned(w, h, ar, pos) {
    return w / h > ar ? [(w - h * ar) * pos, 0, h * ar, h] : [0, (h - w / ar) * pos, w, w / ar];
  }
  function dbHashes(source, w, h) {
    const regions = [[0, 0, w, h], center(w, h, 0.85, 0.85), center(w, h, 0.7, 0.7), aspect(w, h, 16 / 9), aspect(w, h, 1), aspect(w, h, 4 / 5), aspect(w, h, 3 / 2),
      // Collage cells usually show an image cropped to fill: square and portrait cuts from either end.
      aligned(w, h, 1, 0), aligned(w, h, 1, 1), aligned(w, h, 4 / 5, 0), aligned(w, h, 4 / 5, 1)];
    const out = regions.map(r => hashRegion(source, r));
    out.push(flipped(source, [0, 0, w, h]), flipped(source, aspect(w, h, 16 / 9)));
    return out.filter(Boolean);
  }
  // Variants tried against the DB.
  function queryHashes(source, w, h) {
    const regions = [[0, 0, w, h]];
    const t = trimBars(source, w, h);
    if (t) regions.push(t);
    return regions.map(r => hashRegion(source, r)).filter(Boolean);
  }
  // Cells of common collage and meme grids, each hashed on its own, so an official image
  // pasted into a grid with other pictures is still recognised. A small inset drops gutters.
  const GRIDS = [[2, 1], [1, 2], [2, 2], [3, 1], [1, 3], [3, 2], [2, 3], [3, 3]];
  const MIN_CELL = 90;
  // Where one pasted picture meets the next: a column (or row) that is a flat gutter, or where
  // most of the rows change sharply. Meme grids are often unequal, so fixed splits can miss.
  function seams(gray, W, H, vertical) {
    const len = vertical ? W : H, span = vertical ? H : W;
    const at = (p, q) => vertical ? gray[q * W + p] : gray[p * W + q];
    const score = new Float32Array(len);
    for (let p = 1; p < len; p++) {
      let jump = 0, sum = 0, sq = 0;
      for (let q = 0; q < span; q++) {
        const v = at(p, q);
        if (Math.abs(v - at(p - 1, q)) > 16) jump++;
        sum += v; sq += v * v;
      }
      const mean = sum / span, sd = Math.sqrt(Math.max(0, sq / span - mean * mean));
      score[p] = Math.max(jump / span, sd < 5 ? 1 : 0);
    }
    const found = [];
    const lo = Math.floor(len * 0.15), hi = Math.ceil(len * 0.85), gap = Math.max(3, Math.round(len * 0.12));
    const order = [];
    for (let p = lo; p <= hi; p++) if (score[p] >= 0.6) order.push(p);
    order.sort((a, b) => score[b] - score[a]);
    for (const p of order) {
      if (found.length === 2) break;
      if (found.every(f => Math.abs(f - p) > gap)) found.push(p);
    }
    return found.sort((a, b) => a - b).map(p => p / len);
  }
  function queryTiles(source, w, h) {
    // Every cell is cut from one small copy: far cheaper than drawing from the full image.
    const k = Math.min(1, 384 / Math.max(w, h));
    const sw = Math.max(1, Math.round(w * k)), sh = Math.max(1, Math.round(h * k));
    const small = new OffscreenCanvas(sw, sh);
    const sx = small.getContext('2d', { willReadFrequently: true });
    sx.imageSmoothingQuality = 'high';
    sx.drawImage(source, 0, 0, sw, sh);
    const min = MIN_CELL * k;
    const out = [];
    const cut = (xs, ys) => {
      for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < ys.length; j++) {
        const x0 = xs[i] * sw, x1 = xs[i + 1] * sw, y0 = ys[j] * sh, y1 = ys[j + 1] * sh;
        const cw = x1 - x0, ch = y1 - y0;
        if (cw < min || ch < min) continue;
        out.push(hashRegion(small, [x0 + cw * 0.03, y0 + ch * 0.03, cw * 0.94, ch * 0.94]));
      }
    };
    for (const [cx, cy] of GRIDS) cut(Array.from({ length: cx + 1 }, (_, i) => i / cx), Array.from({ length: cy + 1 }, (_, i) => i / cy));
    // Cells along the seams actually found in the picture.
    const d = sx.getImageData(0, 0, sw, sh).data, gray = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    const vs = seams(gray, sw, sh, true), hs = seams(gray, sw, sh, false);
    if (vs.length || hs.length) cut([0, ...vs, 1], [0, ...hs, 1]);
    return out.filter(Boolean);
  }

  // Median per-channel color difference over the 4x4 grid. A median ignores the few
  // cells a title or badge covers. db is a flat array of [hi, lo, ...48] entries.
  const ENTRY = 50;
  function colorDiff(q, db, i) {
    const cells = new Array(16);
    for (let c = 0; c < 16; c++) {
      const o = i + 2 + c * 3, p = 2 + c * 3;
      cells[c] = (Math.abs(q[p] - db[o]) + Math.abs(q[p + 1] - db[o + 1]) + Math.abs(q[p + 2] - db[o + 2])) / 3;
    }
    cells.sort((a, b) => a - b);
    return cells[8];
  }
  // All candidates within maxDist, as [hashDistance, colorDiff].
  function candidates(q, db, maxDist) {
    const out = [];
    for (let i = 0; i < db.length; i += ENTRY) {
      const dist = pop32((q[0] ^ db[i]) >>> 0) + pop32((q[1] ^ db[i + 1]) >>> 0);
      if (dist <= maxDist) out.push([dist, colorDiff(q, db, i)]);
    }
    return out;
  }
  // Tiers of [max hash distance, max color difference]; any tier matching is a hit.
  // Chosen by measurement: 0 wrong hits in 1817 unrelated images (the looser rule had 5),
  // while still catching 86-100% of edited copies of official images. A distance-16 tier
  // was dropped because mostly white logos pass any color check.
  const RULE = { tiers: [[6, 255], [12, 14], [14, 5]], max: 14 };
  // Collage cells are many small queries per image, so they get a stricter rule. Measured on
  // 2232 unrelated images and 600 collages of them: 0 wrong hits, while 284 of 400 collages
  // with an official image in one cell were caught (about 7 ms per image).
  const TILE_RULE = { tiers: [[5, 30], [10, 8]], max: 10 };
  function isHit(q, db, rule = RULE) {
    return candidates(q, db, rule.max).some(([d, c]) => rule.tiers.some(([md, mc]) => d <= md && c <= mc));
  }

  g.G6S = Object.assign(g.G6S || {}, { dbHashes, queryHashes, queryTiles, candidates, isHit, hashRegion, RULE, TILE_RULE });
})(typeof self !== 'undefined' ? self : globalThis);
