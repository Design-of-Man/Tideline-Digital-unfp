/* Design of Man — scroll-scrubbed PC-build sequence (Higgsfield / Seedance render).
   Drives video.currentTime and the caption deck from scroll position within
   #pcAssembly. assets/js/scroll-hud.js reads the same section for the HUD. */
(function () {
  var section = document.getElementById('pcAssembly');
  var video = document.getElementById('pcAssemblyVideo');
  if (!section || !video) return;

  var grade = document.getElementById('pcAssemblyGrade');
  var capsWrap = document.getElementById('pcAssemblyCaps');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var zones = [];
  try {
    zones = JSON.parse(section.dataset.captions || '[]');
  } catch (e) { /* keep empty */ }

  if (capsWrap) {
    capsWrap.innerHTML = zones.map(function (z, i) {
      return '<article class="pc-assembly-cap' + (i === 0 ? ' is-active' : '') + '" data-cap="' + i + '">' +
        '<span class="n">' + z[0] + '</span><h2>' + z[2] + '</h2></article>';
    }).join('');
  }
  var caps = capsWrap ? [].slice.call(capsWrap.querySelectorAll('[data-cap]')) : [];

  var duration = 0;
  video.addEventListener('loadedmetadata', function () { duration = video.duration || 0; });

  // Warm the decoder once with a muted play/pause so Chromium will reliably
  // seek the <video> the first time we assign currentTime from scroll.
  video.muted = true;
  var warm = video.play();
  if (warm && typeof warm.then === 'function') {
    warm.then(function () { video.pause(); }).catch(function () {});
  }

  function step(p) {
    var n = caps.length || 1;
    return Math.min(n - 1, Math.floor(p * n));
  }

  function render() {
    var rect = section.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));

    if (duration && !reduced) {
      try { video.currentTime = p * duration; } catch (e) {}
    }

    if (grade) grade.style.opacity = (p * 0.55).toFixed(3);

    var s = step(p);
    caps.forEach(function (el, i) { el.classList.toggle('is-active', i === s); });
  }

  render();
  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', render, { passive: true });
})();
