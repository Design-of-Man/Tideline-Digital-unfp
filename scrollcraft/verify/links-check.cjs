/* Every internal href on every page must resolve to a file that exists, and
   every same-page #anchor must have a target. Deleting five pages and rewiring
   two navs is exactly the change that leaves a dead link nobody notices. */
const fs = require("fs"), path = require("path");
const ROOT = process.cwd();
const PAGES = process.argv.slice(2);
let bad = 0;

const exists = (p) => fs.existsSync(path.join(ROOT, p));
const redirects = new Set(
  (JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")).redirects || [])
    .map((r) => r.source));

for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (/^(https?:|mailto:|tel:|data:)/.test(h)) continue;
    if (h.startsWith("#")) {
      if (h.length > 1 && !ids.has(h.slice(1))) { console.log(`  ${page}: dead anchor ${h}`); bad++; }
      continue;
    }
    const clean = h.split("?")[0].split("#")[0];
    if (clean === "/" ) continue;
    // cleanUrls: /work is served from work.html
    if (exists(clean.replace(/^\//, "")) ||
        exists(clean.replace(/^\//, "") + ".html") ||
        redirects.has(clean)) continue;
    console.log(`  ${page}: dead link ${h}`); bad++;
  }
}
console.log(bad === 0 ? "links: all internal hrefs resolve" : `links: ${bad} DEAD`);
process.exit(bad === 0 ? 0 : 1);
