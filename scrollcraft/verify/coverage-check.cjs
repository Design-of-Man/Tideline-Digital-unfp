const {chromium}=require("playwright-core");
const PAGE=process.argv[2], W=+process.argv[3]||1440, H=+process.argv[4]||900;
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",headless:true});
const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
await p.goto(`http://127.0.0.1:4500/${PAGE}`,{waitUntil:"domcontentloaded"});
await p.waitForSelector("html.sc-ready");await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(1800);
const max=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
const N=24; let worst=[];
for(let i=0;i<=N;i++){
  const y=Math.round(max*i/N);
  await p.evaluate(v=>scrollTo(0,v),y); await p.waitForTimeout(620);
  const buf=await p.screenshot();
  // count distinct-ish pixels via PNG size as a cheap proxy, plus DOM text coverage
  const r=await p.evaluate(()=>{
    // how much real text is painted and not covered?
    let visible=0, total=0;
    document.querySelectorAll("#site h2, #site h3, #site p, #site li, .close h2, .work h3").forEach(e=>{
      const b=e.getBoundingClientRect();
      if(b.bottom<0||b.top>innerHeight||b.width===0) return;
      total++;
      const cx=Math.min(innerWidth-2,Math.max(2,b.left+b.width/2));
      const cy=Math.min(innerHeight-2,Math.max(2,b.top+b.height/2));
      const top=document.elementFromPoint(cx,cy);
      if(top && (e===top||e.contains(top)||top.contains(e))) visible++;
    });
    return {total, visible};});
  if(r.total>0 && r.visible===0) worst.push({y, pct:Math.round(100*i/N), ...r});
}
console.log(PAGE, W+"x"+H, "| steps where on-screen text exists but is fully COVERED:",
  worst.length? JSON.stringify(worst): "none");
await b.close();})()
