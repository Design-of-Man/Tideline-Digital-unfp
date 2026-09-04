/* Core Web Vitals on a throttled mobile profile, with thresholds enforced.
 *
 * Two regressions on this site were only ever visible here: CLS 0.563 from a
 * pinned scroll section sized in JavaScript, and an LCP of 3.4s from serving a
 * 1600px poster to a 390px phone. Both looked fine on a desktop run.
 *
 * The budget is Google's own "good" band. Exceeding it fails the check rather
 * than printing a number nobody reads.
 *
 * Run:  node scrollcraft/verify/vitals-check.cjs        (needs a server on 4500)
 */
const { chromium } = require('playwright-core');
const PAGES = process.argv.length > 2 ? process.argv.slice(2) : [
  '/index.html', '/work.html', '/services.html', '/pricing.html', '/contact.html',
  '/web-design-jupiter-fl.html', '/insights/index.html',
  '/insights/your-contact-form-is-losing-leads.html',
];

/* Google's "good" thresholds. LCP is measured here against a local server with
   no compression; Vercel serves these gzipped, so production is better than
   whatever this reports. */
const CLS_BUDGET = 0.1;
const LCP_BUDGET = 2500;
let failed = 0;
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for (const path of PAGES) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.emulateNetworkConditions', { offline:false, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8, latency: 150 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.addInitScript(() => {
      window.__cls = 0; window.__lcp = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({type:'layout-shift', buffered:true});
      new PerformanceObserver(l => { const e = l.getEntries().at(-1); if (e) window.__lcp = e.startTime; }).observe({type:'largest-contentful-paint', buffered:true});
    });
    await p.goto('http://127.0.0.1:4500'+path, { waitUntil:'load', timeout:90000 });
    await p.waitForTimeout(4000);
    for (let i=0;i<6;i++){ await p.evaluate(()=>scrollBy(0, innerHeight*0.9)); await p.waitForTimeout(500); }
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), lcp: Math.round(window.__lcp) }));
    const over = [];
    if (r.cls > CLS_BUDGET) over.push(`CLS ${r.cls} > ${CLS_BUDGET}`);
    if (r.lcp > LCP_BUDGET) over.push(`LCP ${r.lcp}ms > ${LCP_BUDGET}ms`);
    if (over.length) failed++;
    console.log(`${over.length ? 'FAIL' : 'ok  '} ${path.padEnd(48)} CLS ${String(r.cls).padEnd(7)} LCP ${String(r.lcp) + 'ms'}`);
    over.forEach((o) => console.log('       over budget: ' + o));
    await ctx.close();
  }
  await b.close();
  if (failed) {
    console.error(`\nvitals: ${failed} page(s) outside the budget`);
    process.exit(1);
  }
  console.log(`\nvitals: ${PAGES.length} pages inside CLS ${CLS_BUDGET} / LCP ${LCP_BUDGET}ms on a throttled phone`);
})();
