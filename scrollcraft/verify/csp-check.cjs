/* Every page loaded in a real browser under the exact headers vercel.json
 * declares, asserting the policy blocks nothing the site needs.
 *
 * A Content-Security-Policy is the one piece of hardening that is easy to
 * write and easy to get subtly wrong: the policy reads correctly, ships, and
 * quietly breaks a feature nobody re-tests. This check caught exactly that --
 * `media-src 'self'` refused the blob: URL the scrub engine plays the homepage
 * film from (scrollcraft.js:615), which would have shipped a black hero.
 *
 * It reads vercel.json rather than restating the policy, and finds pages on
 * disk rather than listing them, so tightening a header or adding a page is
 * covered here without editing this file.
 *
 * Run:  node scrollcraft/verify/csp-check.cjs
 */
const { chromium } = require('playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 8901;

/* The expected canvas colour, read out of the theme file itself rather than
   hardcoded here. A hardcoded rgb() literal is exactly the kind of value
   that silently goes stale the next time the brand changes -- this file's
   own history already has one metrics regression caused by a copy of a
   value living in two places and only one of them getting updated. */
function themeCanvasRgb() {
  const css = fs.readFileSync(path.join(ROOT, 'assets/css/v3.css'), 'utf8');
  const m = css.match(/--sc-canvas:\s*#([0-9a-fA-F]{6})\s*;/);
  if (!m) throw new Error('could not find --sc-canvas in assets/css/v3.css');
  const n = parseInt(m[1], 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml',
};

function pages() {
  const out = [];
  const walk = (dir, prefix) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (e.isDirectory() && !['assets', 'books', '_dev', 'scripts', 'scrollcraft', 'node_modules', '.git', 'api'].includes(e.name)) {
        walk(path.join(dir, e.name), `${prefix}${e.name}/`);
      } else if (e.isFile() && e.name.endsWith('.html')) {
        out.push(`${prefix}${e.name}`);
      }
    }
  };
  walk('.', '/');
  return out.sort();
}

function serve() {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rules = cfg.headers.map((h) => ({
    re: new RegExp('^' + h.source.replace(/\//g, '\\/') + '$'),
    headers: h.headers,
  }));
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    for (const r of rules) if (r.re.test(p)) r.headers.forEach((h) => res.setHeader(h.key, h.value));
    let f = path.join(ROOT, p);
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f = f + '.html';
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream');
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(PORT, () => r(srv)));
}

(async () => {
  const expectBg = themeCanvasRgb();
  const srv = await serve();
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });

  const list = pages();
  let bad = 0;

  for (const p of list) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const issues = [];

    page.on('console', (m) => {
      const t = m.text();
      /* /_vercel/* is served by Vercel's own infrastructure, not by this
         static server, so locally it 404s and Chromium reports a MIME error.
         That is an artefact of the harness -- the request being attempted at
         all is what proves script-src 'self' admits it. */
      if (/_vercel\//.test(t)) return;
      if (/Content Security Policy|Refused to|violates/i.test(t)) issues.push('CSP: ' + t.slice(0, 170));
    });
    page.on('pageerror', (e) => issues.push('JS: ' + e.message.slice(0, 130)));

    await page.goto(`http://127.0.0.1:${PORT}${p}`, { waitUntil: 'networkidle', timeout: 45000 })
      .catch((e) => issues.push('NAV: ' + e.message.slice(0, 90)));

    /* Scroll the whole page: the scrub engine, the reveal observer and every
       lazy image only run once something comes into view, and a policy that
       blocks them would otherwise go unnoticed. */
    try {
      for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollBy(0, innerHeight));
        await page.waitForTimeout(200);
      }
    } catch (e) { issues.push('SCROLL: ' + String(e.message).slice(0, 90)); }
    await page.waitForTimeout(700);

    const state = await page.evaluate(() => ({
      font: !!document.fonts && document.fonts.check('16px "DM Sans"'),
      bg: getComputedStyle(document.body).backgroundColor,
    })).catch(() => ({ font: false, bg: 'unknown' }));

    /* A blocked stylesheet or webfont is a CSP failure that logs nothing
       useful, so assert the page actually painted in the brand. */
    if (!state.font) issues.push('the webfont did not load — check font-src');
    if (state.bg !== expectBg) issues.push(`body background is ${state.bg}, expected ${expectBg} — check style-src`);

    if (issues.length) bad++;
    console.log(`${issues.length ? 'FAIL' : 'ok  '} ${p}`);
    [...new Set(issues)].slice(0, 4).forEach((i) => console.log('       ' + i));
    await ctx.close();
  }

  await browser.close();
  srv.close();

  if (bad) {
    console.error(`\ncsp: FAILED on ${bad} of ${list.length} pages`);
    process.exit(1);
  }
  console.log(`\ncsp: ${list.length} pages load clean under the shipped policy`);
})();
