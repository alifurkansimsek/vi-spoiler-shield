// Builds data/hashes.js from official images (never displayed) and renders the icons.
// Usage: node build-hashes.js <extDir> <imagesDir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ext = process.argv[2];
const dir = process.argv[3]; // folder of official images to fingerprint (not included in the repo)

(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext()).newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ content: fs.readFileSync(path.join(ext, 'src/hash.js'), 'utf8') });
  const seen = new Set(); const flat = []; let imgs = 0, skip = 0;
  for (const f of fs.readdirSync(dir)) {
    const buf = fs.readFileSync(path.join(dir, f));
    const mime = 'image/' + path.extname(f).slice(1);
    const hs = await page.evaluate(async ({ b64, mime }) => {
      const blob = await (await fetch(`data:${mime};base64,${b64}`)).blob();
      const bmp = await createImageBitmap(blob);
      if (bmp.width < 200 || bmp.height < 120) return null;
      return self.G6S.dbHashes(bmp, bmp.width, bmp.height);
    }, { b64: buf.toString('base64'), mime }).catch(() => null);
    if (!hs) { skip++; continue; }
    imgs++;
    for (const h of hs) { const k = h.join(','); if (!seen.has(k)) { seen.add(k); flat.push(...h); } }
  }
  fs.mkdirSync(path.join(ext, 'data'), { recursive: true });
  fs.writeFileSync(path.join(ext, 'data/hashes.js'),
    `// Perceptual fingerprints only. These numbers cannot be turned back into images.\nself.G6S_HASH_DB = new Uint32Array([${flat.join(',')}]);\n`);
  console.log('images', imgs, 'skipped', skip, 'hashes', flat.length / 50);

  // Icons are rendered by make-icons.js from ui/logo.svg; this script only builds the hash DB.
  await b.close();
})();
