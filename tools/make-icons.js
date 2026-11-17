// Renders the extension icons from ui/logo.svg (48, 128) and ui/logo-small.svg (16, 32),
// plus a preview sheet on light and dark toolbars. Usage: node make-icons.js <extDir> <previewPng>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [, , ext, preview] = process.argv;
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  const big = fs.readFileSync(path.join(ext, 'ui/logo.svg'), 'utf8');
  const small = fs.readFileSync(path.join(ext, 'ui/logo-small.svg'), 'utf8');
  for (const [s, svg] of [[16, small], [32, small], [48, big], [128, big]]) {
    await page.setViewportSize({ width: s, height: s });
    await page.setContent(`<!doctype html><html style="margin:0;background:transparent"><body style="margin:0;background:transparent"><div style="width:${s}px;height:${s}px">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</div></body></html>`);
    await page.screenshot({ path: path.join(ext, `icons/${s}.png`), omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
  // Preview: real icon PNGs on light and dark toolbars, plus 8x enlargements of 16 and 32.
  const img = s => `data:image/png;base64,${fs.readFileSync(path.join(ext, `icons/${s}.png`)).toString('base64')}`;
  const row = bg => `<div style="background:${bg};padding:14px;display:flex;gap:18px;align-items:center">${[16, 32, 48, 128].map(s => `<img src="${img(s)}" width="${s}" height="${s}">`).join('')}</div>`;
  await page.setViewportSize({ width: 760, height: 520 });
  await page.setContent(`<!doctype html><body style="margin:0;font:12px sans-serif">${row('#f1f3f4')}${row('#202124')}<div style="display:flex;gap:20px;padding:14px;background:#888"><img src="${img(16)}" width="128" height="128" style="image-rendering:pixelated"><img src="${img(32)}" width="256" height="256" style="image-rendering:pixelated"></div></body>`);
  await page.screenshot({ path: preview });
  await b.close();
})();
