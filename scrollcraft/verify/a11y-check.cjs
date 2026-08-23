const {chromium}=require("playwright-core");
const L=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
 return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])};
const ratio=(a,b)=>{const x=L(a),y=L(b);return ((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05))};
(async()=>{
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",headless:true});
for (const page of ["index.html","v2.html","v2-process.html","v2-studio.html","v2-contact.html"]){
 const p=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[];p.on("pageerror",e=>errs.push(String(e)));
 const bad=[];p.on("response",r=>{if(r.status()>=400)bad.push(r.status()+" "+r.url())});
 await p.goto("http://127.0.0.1:4500/"+page,{waitUntil:"load"});
 await p.waitForTimeout(900);
 // contrast on rendered text: sample the element's own colour vs its painted backdrop
 const rows=await p.evaluate(()=>{
  const out=[];
  const px=s=>s.split("(")[1].split(")")[0].split(",").map(Number);
  for(const el of document.querySelectorAll("p,h1,h2,h3,a,span,dd,dt,li,blockquote")){
   const t=(el.textContent||"").trim(); if(!t||el.children.length) continue;
   const r=el.getBoundingClientRect(); if(r.width<4||r.height<4) continue;
   if(r.bottom<0||r.top>innerHeight) continue;
   const cs=getComputedStyle(el); if(parseFloat(cs.opacity)<0.9) continue;
   let n=el, bg=null;
   while(n&&n!==document.documentElement){const c=getComputedStyle(n).backgroundColor;
     if(c&&!c.startsWith("rgba(0, 0, 0, 0)")){bg=px(c);break} n=n.parentElement;}
   if(!bg) bg=px(getComputedStyle(document.body).backgroundColor);
   out.push({t:t.slice(0,34), fg:px(cs.color), bg, size:parseFloat(cs.fontSize),
             w:cs.fontWeight});
  } return out;});
 const fails=rows.map(r=>({...r,cr:ratio(r.fg,r.bg)}))
   .filter(r=>{const large=r.size>=24||(r.size>=18.66&&+r.w>=700);return r.cr < (large?3:4.5)});
 // tab order + hidden focusables
 const tabs=await p.evaluate(()=>{
  const f=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')];
  // A link taken out of the tab order by inert is CORRECT, not a finding. The
  // failure is one that is still reachable while being invisible.
  return f.filter(e=>{
    if(e.closest("[inert]")) return false;
    const cs=getComputedStyle(e);
    const invisible = cs.visibility==="hidden" || parseFloat(cs.opacity)===0
                   || e.closest('[aria-hidden="true"]');
    return !!invisible;})
   .map(e=>e.tagName+":"+(e.textContent||"").trim().slice(0,20));});
 console.log("==",page,"errors",errs.length,"http",bad.length);
 if(bad.length)console.log("  bad:",bad);
 if(errs.length)console.log("  err:",errs);
 console.log("  contrast fails:",fails.length, fails.slice(0,6).map(f=>f.cr.toFixed(2)+" "+f.t));
 console.log("  focusable but hidden:",tabs);
 await p.close();
}
await b.close();})()
