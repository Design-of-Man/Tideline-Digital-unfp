/* Design of Man — right-edge HUD for the scroll-driven laptop assembly.
   Independent of the 3D bundle: reads the same section geometry so the
   percentage and zone ticks always agree with the assembly's own progress,
   but never touches the WebGL scene itself. */
(function () {
  var root = document.querySelector('[data-laptop-assembly]');
  if (!root) return;

  var hud = document.getElementById('dlaHud');
  var pctEl = document.getElementById('dlaHudPct');
  var fillEl = document.getElementById('dlaHudFill');
  var zonesEl = document.getElementById('dlaHudZones');
  if (!hud || !pctEl || !fillEl || !zonesEl) return;

  var zones = ['Discover', 'Design', 'Build', 'Launch', 'Maintain'];
  try {
    var parsed = JSON.parse(root.dataset.captions || '[]');
    if (parsed.length) zones = parsed.map(function (c) { return c[1] || c[0]; });
  } catch (e) { /* keep defaults */ }

  zonesEl.innerHTML = zones.map(function (z, i) {
    return '<span class="dla-hud-zone" data-zone="' + i + '">' + z + '</span>';
  }).join('');
  var zoneEls = [].slice.call(zonesEl.querySelectorAll('[data-zone]'));

  // thresholds mirror the step logic in _dev/laptop-assembly.source.js
  function stepFor(p) {
    if (zoneEls.length <= 1) return 0;
    if (p < 0.20) return 0;
    if (p < 0.52) return 1;
    if (p < 0.72) return 2;
    if (p < 0.88) return 3;
    return zoneEls.length - 1;
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
