/* Design of Man — self-mounting scroll assembly.
   Integration is two lines: a <div data-laptop-assembly> and this script.
   Styles and markup are injected here so nothing has to be pasted into the
   host page's stylesheet. Configure via data- attributes on the div. */
import { createLaptopScene } from './scene.js';

const CSS = `
[data-laptop-assembly]{position:relative;display:block;background:linear-gradient(180deg,#182A46 0%,#16233B 30%,#0C1424 100%)}
[data-laptop-assembly] .dla-stage{position:sticky;top:0;height:100svh;overflow:hidden;display:grid;place-items:center}
[data-laptop-assembly] .dla-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(58% 46% at 50% 42%,rgba(201,162,75,.16),transparent 70%)}
[data-laptop-assembly] canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block}
[data-laptop-assembly] .dla-ui{position:relative;z-index:3;isolation:isolate;width:100%;height:100%;pointer-events:none;display:grid;grid-template-rows:auto 1fr auto;padding:clamp(1.25rem, 1rem + 1.6vw, 2.5rem);font-family:var(--dla-body,'Work Sans',system-ui,sans-serif)}
[data-laptop-assembly] .dla-ui::before{content:"";position:absolute;left:0;right:0;bottom:0;height:52%;pointer-events:none;background:linear-gradient(to top,rgba(9,18,32,.88),rgba(9,18,32,.45) 45%,transparent);z-index:-1}
[data-laptop-assembly] .dla-head{display:flex;justify-content:space-between;gap:1.5rem}
[data-laptop-assembly] .dla-mark{font-family:var(--dla-mono,'IBM Plex Mono',ui-monospace,monospace);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(247,242,233,.5)}
[data-laptop-assembly] .dla-caps{align-self:end;max-width:30ch}
[data-laptop-assembly] .dla-cap{position:absolute;bottom:clamp(3.5rem,3rem + 2vw,5rem);opacity:0;transform:translateY(14px);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .5s cubic-bezier(.22,1,.36,1)}
[data-laptop-assembly] .dla-cap[data-active="true"]{opacity:1;transform:none}
[data-laptop-assembly] .dla-cap .n{font-family:var(--dla-mono,'IBM Plex Mono',ui-monospace,monospace);font-size:.7rem;letter-spacing:.18em;color:#C9A24B;display:block;margin-bottom:.5rem}
[data-laptop-assembly] .dla-cap h2{font-family:var(--dla-display,'Fraunces',Georgia,serif);font-weight:600;line-height:1.12;color:#F7F2E9;font-size:clamp(1.6rem,1.2rem + 1.8vw,2.5rem);margin:0 0 .5rem}
[data-laptop-assembly] .dla-cap p{color:rgba(247,242,233,.72);font-size:.98rem;max-width:34ch;margin:0;line-height:1.6}
[data-laptop-assembly] .dla-progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(247,242,233,.14);z-index:4}
[data-laptop-assembly] .dla-progress span{display:block;height:100%;background:linear-gradient(90deg,#C9A24B,#C15F3C);transform:scaleX(0);transform-origin:left}
[data-laptop-assembly] .dla-fallback{position:absolute;inset:0;z-index:2;display:none;place-items:center;text-align:center;padding:2rem;font-family:var(--dla-body,'Work Sans',system-ui,sans-serif)}
[data-laptop-assembly] .dla-fallback h2{font-family:var(--dla-display,'Fraunces',Georgia,serif);color:#F7F2E9;margin:0}
[data-laptop-assembly] .dla-fallback p{color:rgba(247,242,233,.72);max-width:44ch;margin:.75rem auto 0}
[data-laptop-assembly][data-webgl="unsupported"] .dla-fallback{display:grid}
[data-laptop-assembly][data-webgl="unsupported"] .dla-caps,
[data-laptop-assembly][data-webgl="unsupported"] .dla-progress{display:none}
[data-laptop-assembly][data-reduced="true"]{height:100svh!important}
[data-laptop-assembly][data-reduced="true"] .dla-cap{opacity:0}
[data-laptop-assembly][data-reduced="true"] .dla-cap:last-child{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){[data-laptop-assembly] .dla-cap{transition:none}}
`;

const DEFAULT_CAPTIONS = [
  ['01 — Foundation', 'Strategy first', 'Who you are talking to, what they need to see, and what you want them to do. Everything else sits on this.'],
  ['02 — Internals', 'The parts nobody sees', 'Clean markup, fast hosting, structured data, real accessibility. The work that decides whether Google and a screen reader can both read your site.'],
  ['03 — Surface', 'Design that fits the business', 'Not a template with your logo dropped in. Type, colour and layout chosen for what you actually sell.'],
  ['04 — Launch', 'It opens up', 'Domain connected, analytics wired, forms tested with a real submission. We check it works before we tell you it does.'],
  ['05 — Care', 'And it stays live', 'Hosting, updates, backups and changes. A site is not finished at launch — it is just open.'],
];

function injectCSS() {
  if (document.getElementById('dla-styles')) return;
  const el = document.createElement('style');
  el.id = 'dla-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

function build(root) {
  const height = root.dataset.height || '520vh';
  root.style.height = height;

  let captions = DEFAULT_CAPTIONS;
  if (root.dataset.captions) {
    try { captions = JSON.parse(root.dataset.captions); } catch (e) { /* keep defaults */ }
  }

  const label = root.dataset.label || 'Scroll to assemble';
  const title = root.dataset.title || '';

  root.innerHTML = `
    <div class="dla-stage">
      <canvas data-laptop-canvas aria-hidden="true"></canvas>
      <div class="dla-fallback">
        <div>
          <h2>Built piece by piece</h2>
          <p>Strategy, design, build, launch and care. Your browser can't render the 3D version, so here is the short version: we do all five, in that order, and we stay after launch.</p>
        </div>
      </div>
      <div class="dla-ui">
        <div class="dla-head"><span class="dla-mark">${title}</span><span class="dla-mark">${label}</span></div>
        <div></div>
        <div class="dla-caps">
          ${captions.map((c, i) => `
            <article class="dla-cap" data-caption ${i === 0 ? 'data-active="true"' : ''}>
              <span class="n">${c[0]}</span><h2>${c[1]}</h2><p>${c[2]}</p>
            </article>`).join('')}
        </div>
      </div>
      <div class="dla-progress"><span data-progress-fill></span></div>
    </div>`;
}

function boot() {
  const roots = document.querySelectorAll('[data-laptop-assembly]');
  if (!roots.length) return;
  injectCSS();
  roots.forEach((root) => {
    build(root);
    try {
      if (!createLaptopScene(root)) root.setAttribute('data-webgl', 'unsupported');
    } catch (err) {
      console.error('[laptop-assembly]', err);
      root.setAttribute('data-webgl', 'unsupported');
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
