/* THE CHECK THAT WOULD HAVE CAUGHT IT.
   "No dead scroll" measures whether a clip advances. "No text painted over"
   measures what is on top. Neither asks the two questions that actually decide
   whether a hero works on a phone: can the decoder keep up, and how far does a
   thumb have to travel before there is anything to read.

   Run on a real device descriptor, walk the page, and fail on:
     - a video sitting below HAVE_CURRENT_DATA while it is on screen, which is
       a stalled decoder with no frame to paint
     - more than BUDGET.viewports of page
     - more than BUDGET.videoKB of video transferred
     - more than BUDGET.beforeContent viewports before the content starts     */
const { chromium, devices } = require("/home/user/Tideline-Digital-unfp/node_modules/playwright-core");

const BUDGET = { viewports: 20, videoKB: 2200, beforeContent: 5.5 };
const PAGES = process.argv.slice(2);

(async () => {
  const b = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium", headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  let fails = 0;
  for (const page of PAGES) {
    const ctx = await b.newContext({ ...devices["iPhone 13"], hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    let videoBytes = 0;
    p.on("response", async (r) => {
      if (!/\.(mp4|webm)(\?|$)/.test(r.url())) return;
      try { videoBytes += (await r.body()).length; } catch (e) {}
    });
    await p.goto(`http://127.0.0.1:4500/${page}`, { waitUntil: "load" });
    await p.waitForSelector("html.sc-ready", { timeout: 30000 });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(2500);

    const vh = await p.evaluate(() => innerHeight);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    const viewports = +(total / vh).toFixed(1);
    const before = await p.evaluate(() => {
      const s = document.getElementById("site");
      if (!s) return 0;
      let t = 0, e = s; while (e) { t += e.offsetTop; e = e.offsetParent; }
      return +(t / innerHeight).toFixed(1);
    });

    // walk in sub-viewport steps and watch the decoder
    let stalls = 0;
    for (let y = 0; y <= total - vh; y += Math.floor(vh * 0.6)) {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(260);
      stalls += await p.evaluate(() => {
        let n = 0;
        document.querySelectorAll("video").forEach((v) => {
          const r = v.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight || r.width === 0) return;
          if (getComputedStyle(v).visibility === "hidden") return;
          if (v.readyState < 2) n++;          // below HAVE_CURRENT_DATA
        });
        return n;
      });
    }

    const kb = Math.round(videoBytes / 1024);
    const bad = [];
    if (stalls) bad.push(`${stalls} decoder stalls`);
    if (viewports > BUDGET.viewports) bad.push(`${viewports} viewports > ${BUDGET.viewports}`);
    if (kb > BUDGET.videoKB) bad.push(`${kb}KB video > ${BUDGET.videoKB}KB`);
    if (before > BUDGET.beforeContent) bad.push(`${before} viewports before content > ${BUDGET.beforeContent}`);
    console.log(`  ${page.padEnd(24)} ${String(viewports).padStart(5)} vp  ${String(kb).padStart(5)}KB video  ${String(before).padStart(4)} vp to content  stalls:${stalls}` + (bad.length ? `   FAIL: ${bad.join("; ")}` : ""));
    fails += bad.length ? 1 : 0;
    await ctx.close();
  }
  console.log(fails === 0 ? "media: within budget on a real phone" : `media: ${fails} page(s) OVER BUDGET`);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
