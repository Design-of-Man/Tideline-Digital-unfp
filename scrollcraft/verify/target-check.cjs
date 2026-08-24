/* WCAG 2.2 SC 2.5.8: an interactive target must be at least 24 by 24 CSS px,
   unless it is an inline link inside a sentence, which is exempt. This is the
   check that caught the 19px nav links the previous build shipped on all four
   pages, so it is a harness rule now rather than something to remember. */
const { chromium } = require("/home/user/Tideline-Digital-unfp/node_modules/playwright-core");
/* A NARROW DESKTOP WINDOW IS NOT A PHONE.
   Four rounds of this harness reported "mobile passes" from a desktop Chromium
   resized to 390px. That has a fine pointer, hover, a desktop user-agent and a
   desktop media decoder, so every media query keyed to (pointer: coarse) took
   the desktop branch and the scrub video was never asked to seek on a phone
   decoder. It hid a hero that stalled mid-scroll, an 8MB download and eight
   thumb-swipes of video before any copy. Any width at or below 860 now gets a
   real device descriptor. */
const PHONE = require("/home/user/Tideline-Digital-unfp/node_modules/playwright-core").devices['iPhone 13'];
const ctxFor = (W, H, extra) => (W <= 860)
  ? Object.assign({}, PHONE, { hasTouch: true, isMobile: true }, extra || {})
  : Object.assign({ viewport: { width: W, height: H } }, extra || {});
const PAGES = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
  let total = 0;
  for (const page of PAGES) {
    for (const [W, H] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage(ctxFor(W, H));
      await p.goto(`http://127.0.0.1:4500/${page}`, { waitUntil: "load" });
      await p.waitForSelector("html.sc-ready", { timeout: 20000 });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(500);
      const small = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
          .forEach((el) => {
            if (el.closest("[inert]") || el.closest('[aria-hidden="true"]')) return;
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") return;
            // Inline-link exception: an <a> flowing inside a block of text.
            if (el.tagName === "A" && cs.display.startsWith("inline")) {
              const par = el.parentElement;
              if (par && par.textContent.trim().length > el.textContent.trim().length + 12) return;
            }
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            if (r.width < 24 || r.height < 24)
              out.push(`${el.tagName.toLowerCase()}.${el.className || "-"} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || "").trim().slice(0, 28)}"`);
          });
        return out;
      });
      if (small.length) { console.log(`  ${page} ${W}x${H}:`); small.forEach((s) => console.log("    " + s)); }
      total += small.length;
      await p.close();
    }
  }
  console.log(total === 0 ? "targets: every target clears 24x24" : `targets: ${total} UNDER 24x24`);
  await b.close();
  process.exit(total === 0 ? 0 : 1);
})();
