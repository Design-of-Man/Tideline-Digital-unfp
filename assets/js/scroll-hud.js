/* Design of Man — right-edge HUD for the scroll-scrubbed PC-build assembly.
   Independent of assets/js/pc-assembly.js: reads the same section geometry
   so the percentage and zone ticks always agree with the video's own
   scroll-driven progress, but never touches the <video> element itself. */
(function () {
  var root = document.getElementById('pcAssembly');
  if (!root) return;

  var hud = document.getElementById('dlaHud');
  var pctEl = document.getElementById('dlaHudPct');
  var fillEl = document.getElementById('dlaHudFill');
  var zonesEl = document.getElementById('dlaHudZones');
  if (!hud || !pctEl || !fillEl || !zonesEl) return;

  var zones = ['The Bench', 'The Core', 'The Power', 'The Flow', 'The Awakening'];
  try {
    var parsed = JSON.parse(root.dataset.captions || '[]');
    if (parsed.length) zones = parsed.map(function (c) { return c[1] || c[0]; });
  } catch (e) { /* keep defaults */ }

  zonesEl.innerHTML = zones.map(function (z, i) {
    return '<span class="dla-hud-zone" data-zone="' + i + '">' + z + '</span>';
  }).join('');
  var zoneEls = [].slice.call(zonesEl.querySelectorAll('[data-zone]'));

  // mirrors the equal-fifths step logic in assets/js/pc-assembly.js
  function stepFor(p) {
    var n = zoneEls.length || 1;
    return Math.min(n - 1, Math.floor(p * n));
  }

  var visible = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render() {
    var rect = root.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));

    pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
    fillEl.style.height = (p * 100).toFixed(2) + '%';

    var step = stepFor(p);
    zoneEls.forEach(function (el, i) { el.classList.toggle('is-active', i === step); });

    var inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView !== visible) {
      visible = inView;
      hud.classList.toggle('is-visible', visible);
    }
  }

  render();
  if (!reduced) {
    window.addEventListener('scroll', render, { passive: true });
    window.addEventListener('resize', render, { passive: true });
  }
})();
