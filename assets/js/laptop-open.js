/* Design of Man — header opening sequence: a photoreal laptop (Higgsfield /
   Seedance render) opens on scroll and hands off into the live hero below.
   Renders a preloaded frame sequence to a <canvas> in step with scroll
   position, instead of seeking a <video> element (which stutters on H.264
   seeks between keyframes). Also drives the caption deck and its own HUD. */
(function () {
  var section = document.getElementById('laptopOpen');
  var stage = document.getElementById('laptopOpenStage');
  var canvas = document.getElementById('laptopOpenCanvas');
  if (!section || !stage || !canvas) return;

  var ctx = canvas.getContext('2d');
  var grade = document.getElementById('laptopOpenGrade');
  var capsWrap = document.getElementById('laptopOpenCaps');
  var hud = document.getElementById('laptopHud');
  var hudPct = document.getElementById('laptopHudPct');
  var hudFill = document.getElementById('laptopHudFill');
  var hudZones = document.getElementById('laptopHudZones');

  var base = section.dataset.frameBase;
  var count = parseInt(section.dataset.frameCount, 10) || 0;
  var digits = parseInt(section.dataset.frameDigits, 10) || 4;
  var ext = section.dataset.frameExt || 'jpg';
  if (!base || !count) return;

  var zones = [];
  try { zones = JSON.parse(section.dataset.captions || '[]'); } catch (e) {}

  if (capsWrap) {
    capsWrap.innerHTML = zones.map(function (z, i) {
      return '<article class="laptop-open-cap' + (i === 0 ? ' is-active' : '') + '" data-cap="' + i + '">' +
        '<span class="n">' + z[0] + '</span><h2>' + z[2] + '</h2></article>';
    }).join('');
  }
  var caps = capsWrap ? [].slice.call(capsWrap.querySelectorAll('[data-cap]')) : [];

  if (hudZones) {
    hudZones.innerHTML = zones.map(function (z, i) {
      return '<span class="dla-hud-zone" data-zone="' + i + '">' + z[1] + '</span>';
    }).join('');
  }
  var zoneEls = hudZones ? [].slice.call(hudZones.querySelectorAll('[data-zone]')) : [];

  function pad(n) { return String(n).padStart(digits, '0'); }

  var frames = new Array(count);
  for (var i = 0; i < count; i++) {
    (function (idx) {
      var img = new Image();
      img.src = base + pad(idx + 1) + '.' + ext;
      frames[idx] = img;
    })(i);
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function drawCover(img) {
    var cw = canvas.width, ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return;
    var scale = Math.max(cw / iw, ch / ih);
    var dw = iw * scale, dh = ih * scale;
    var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function step(p) {
    var n = caps.length || 1;
    return Math.min(n - 1, Math.floor(p * n));
  }

  var latestP = 0;
  var lastDrawnIdx = -1;
  var lastCapIdx = -1;
  var visible = false;
  var ticking = false;

  function onScroll() {
    var rect = section.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    latestP = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function render() {
    ticking = false;
    var p = latestP;
    var idx = Math.min(count - 1, Math.floor(p * count));
    if (idx !== lastDrawnIdx) {
      var img = frames[idx];
      if (img && img.complete && img.naturalWidth) {
        drawCover(img);
        lastDrawnIdx = idx;
      }
    }

    if (grade) grade.style.opacity = (p * 0.5).toFixed(3);

    var s = step(p);
    if (s !== lastCapIdx) {
      caps.forEach(function (el, i) { el.classList.toggle('is-active', i === s); });
      zoneEls.forEach(function (el, i) { el.classList.toggle('is-active', i === s); });
      lastCapIdx = s;
    }

    if (hudPct) hudPct.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
    if (hudFill) hudFill.style.height = (p * 100).toFixed(2) + '%';

    var rect = section.getBoundingClientRect();
    var inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView !== visible) {
      visible = inView;
      if (hud) hud.classList.toggle('is-visible', visible);
    }
  }

  var primeTimer = setInterval(function () {
    if (frames[0] && frames[0].complete && frames[0].naturalWidth) {
      drawCover(frames[0]);
      lastDrawnIdx = 0;
      clearInterval(primeTimer);
    }
  }, 60);
  setTimeout(function () { clearInterval(primeTimer); }, 5000);

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
