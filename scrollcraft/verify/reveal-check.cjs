/* Anything carrying data-sc-in starts at opacity 0 and is revealed by an
   IntersectionObserver. If a reveal never fires, the content is on the page,
   in the accessibility tree, and invisible: the worst failure mode there is,
   because nothing errors and nothing looks broken.

   Walk in steps smaller than the viewport. A jump larger than one screen can
   teleport an element past the observer without it ever intersecting, which
   reports a reveal that works as a reveal that failed. Reduced motion is the
   harder case, so that is what is tested: the engine keeps the opacity fade
   there and only drops the movement. */
const { chromium } = require("/home/user/Tideline-Digital-unfp/node_modules/playwright-core");
const PAGES = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
  let total = 0;
  for (const page of PAGES) {
    for (const [W, H] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage({ viewport: { width: W, height: H }, reducedMotion: "reduce" });
      await p.goto(`http://127.0.0.1:4500/${page}`, { waitUntil: "load" });
      await p.waitForSelector("html.sc-ready", { timeout: 20000 });
      await p.evaluate(() => document.fonts.ready);
      const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const step = Math.floor(H * 0.6);
      for (let y = 0; y <= max; y += step) {
        await p.evaluate((v) => scrollTo(0, v), y);
        await p.waitForTimeout(230);
      }
      await p.evaluate((v) => scrollTo(0, v), max);
      await p.waitForTimeout(450);
      const stuck = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll("h1,h2,h3,p,li,summary,figcaption").forEach((e) => {
          if (e.closest("[inert]") || e.offsetParent === null) return;
          if (parseFloat(getComputedStyle(e).opacity) < 0.1)
            out.push(e.tagName + ' "' + (e.textContent || "").trim().slice(0, 40) + '"');
        });
        return out;
      });
      if (stuck.length) { console.log(`  ${page} ${W}x${H}:`); stuck.forEach((s) => console.log("    " + s)); }
      total += stuck.length;
      await p.close();
    }
  }
  console.log(total === 0 ? "reveals: every reveal fires" : `reveals: ${total} NEVER REVEALED`);
  await b.close();
  process.exit(total === 0 ? 0 : 1);
})();
