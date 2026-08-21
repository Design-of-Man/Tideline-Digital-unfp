/* Design of Man — shared behaviour for the v2 site.
   Every block is guarded, so each page only runs what it actually has. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Decorative, muted loops only autoplay when motion is welcome — each shows
  // its poster frame as a static image for prefers-reduced-motion users.
  if (!reduced) {
    [].slice.call(document.querySelectorAll('.js-reel-video')).forEach(function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  // Home hero: scroll-scrubbed frame sequence of the laptop opening.
  // Renders preloaded frames to canvas in step with scroll rather than seeking
  // a <video>, which stutters on H.264 seeks between keyframes.
  (function () {
    var section = document.getElementById('heroScrub');
    var stage = document.getElementById('heroScrubStage');
    var canvas = document.getElementById('heroScrubCanvas');
    if (!section || !stage || !canvas) return;
    var ctx = canvas.getContext('2d');
    var grade = section.querySelector('.hero-scrub-grade');
    var bar = document.getElementById('heroScrubBar');
    var caps = [].slice.call(section.querySelectorAll('.hero-scrub-cap'));
    var ui = section.querySelector('.hero-scrub-ui');
    var screenEl = document.getElementById('heroScreen');
    var screenInner = document.getElementById('heroScreenInner');
    var hud = document.getElementById('heroHud');
    var hudPct = document.getElementById('heroHudPct');
    var hudFill = document.getElementById('heroHudFill');
    var hudZones = document.getElementById('heroHudZones');

    var ZONES = ['The Bench', 'The Opening', 'Inside'];
    if (hudZones) {
      hudZones.innerHTML = ZONES.map(function (z, i) {
        return '<span class="dla-hud-zone" data-zone="' + i + '">' + z + '</span>';
      }).join('');
    }
    var zoneEls = hudZones ? [].slice.call(hudZones.querySelectorAll('[data-zone]')) : [];

    // The render's camera pushes in hard through frames 17-49, ending on an
    // extreme closeup of the lit seam with the background wall out of frame.
    // The open shot (83+) is framed wide again, wall visible. Cutting from
    // that closeup to the wide shot snaps the camera backwards, which is what
    // reads as the laptop resetting mid-scroll.
    // Frames 1-16 are the wide part of the build (wall visible, glow rising),
    // so they match the open shot's framing and the join stays forward.
    // Frames 50-82 are two repeats of the same closed build and are dropped
    // outright; 98 dips as the camera breathes back.
    function pad(n) { return String(n).padStart(4, '0'); }
    var srcNums = [];
    for (var a = 1; a <= 16; a++) srcNums.push(a);
    for (var b2 = 83; b2 <= 121; b2++) { if (b2 !== 98) srcNums.push(b2); }
    var usableCount = srcNums.length;
    var joinIdx = 15;                       // last closed frame
    var joinP = joinIdx / (usableCount - 1);

    var frames = new Array(usableCount);
    for (var i = 0; i < usableCount; i++) {
      var img = new Image();
      img.src = '/assets/img/laptop-frames/f' + pad(srcNums[i]) + '.jpg';
      frames[i] = img;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      canvas.width = Math.round(stage.clientWidth * dpr);
      canvas.height = Math.round(stage.clientHeight * dpr);
    }
    resize();
    window.addEventListener('resize', function () { resize(); lastIdx0 = -1; render(); }, { passive: true });

    function drawOne(img, alpha) {
      var cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
      if (!iw || !ih) return;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale, dh = ih * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    }

    // Cross-fades the two nearest frames instead of hard-cutting, so the one
    // real cut reads as a dissolve rather than a snap.
    function drawBlend(idx0, idx1, frac) {
      var img0 = frames[idx0], img1 = frames[idx1];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (img0 && img0.complete && img0.naturalWidth) drawOne(img0, 1);
      if (frac > 0.01 && img1 && img1.complete && img1.naturalWidth) drawOne(img1, frac);
    }

    // The footage's own final frames fly into the white screen. As that
    // happens the site content simply fades in over it — one continuous
    // camera move, no cut.
    var REVEAL_AT = 0.88;
    function reveal(t) {
      if (!screenEl) return;
      var v = Math.max(0, Math.min(1, t));
      screenEl.style.opacity = v.toFixed(3);
      screenEl.classList.toggle('is-live', v > 0.85);
      if (ui) ui.style.opacity = Math.max(0, 1 - v * 2).toFixed(3);
    }

    // Caption 2 lands exactly where the laptop opens.
    function step(p) {
      if (p >= REVEAL_AT) return caps.length;
      return p < joinP ? 0 : 1;
    }

    var latestP = 0, lastIdx0 = -1, lastFrac = -1, lastStep = -1, ticking = false, hudVisible = false;
    function onScroll() {
      var rect = section.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      latestP = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }
    function render() {
      ticking = false;
      var p = latestP;

      var idxFloat = p * (usableCount - 1);
      var idx0 = Math.max(0, Math.min(usableCount - 1, Math.floor(idxFloat)));
      var idx1 = Math.min(usableCount - 1, idx0 + 1);
      var frac = idxFloat - idx0;
      if (idx0 !== lastIdx0 || Math.abs(frac - lastFrac) > 0.01) {
        drawBlend(idx0, idx1, frac);
        lastIdx0 = idx0; lastFrac = frac;
      }

      reveal(p <= REVEAL_AT ? 0 : (p - REVEAL_AT) / (1 - REVEAL_AT));

      if (grade) grade.style.opacity = (p >= REVEAL_AT ? 0 : 0.08 + p * 0.2).toFixed(3);
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';

      if (hudPct) hudPct.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
      if (hudFill) hudFill.style.height = (p * 100).toFixed(2) + '%';

      var s = step(p);
      if (s !== lastStep) {
        caps.forEach(function (el, i) { el.classList.toggle('is-active', i === s); });
        zoneEls.forEach(function (el, i) { el.classList.toggle('is-active', i === s); });
        lastStep = s;
      }

      var rect = section.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView !== hudVisible) {
        hudVisible = inView;
        if (hud) hud.classList.toggle('is-visible', inView);
      }
    }

    var primeTimer = setInterval(function () {
      if (frames[0] && frames[0].complete && frames[0].naturalWidth) {
        drawBlend(0, 0, 0); lastIdx0 = 0; lastFrac = 0; clearInterval(primeTimer);
      }
    }, 60);
    setTimeout(function () { clearInterval(primeTimer); }, 5000);

    render();
    if (!reduced) window.addEventListener('scroll', onScroll, { passive: true });
    else { caps.forEach(function (el, i) { el.classList.toggle('is-active', i === 0); }); reveal(0); }
  })();

  // Scroll reveals.
  var targets = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  // Parallax: decorative media only, GPU-accelerated transform, capped ticking.
  // This is the scroll-driven motion the whole build is built around — the
  // media drifts at a different rate than the copy over it, echoing
  // "scrolling builds the machine" from the original brief.
  if (!reduced) {
    var pxEls = [].slice.call(document.querySelectorAll('[data-parallax]')).map(function (el) {
      return { el: el, media: el.querySelector('.parallax-media'), factor: parseFloat(el.dataset.parallax) || 0.15 };
    }).filter(function (p) { return p.media; });

    if (pxEls.length) {
      var pxTicking = false;
      var renderParallax = function () {
        pxTicking = false;
        var vh = window.innerHeight;
        pxEls.forEach(function (p) {
          var rect = p.el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          var center = rect.top + rect.height / 2;
          var offset = (vh / 2 - center) * p.factor;
          p.media.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
        });
      };
      var onPxScroll = function () {
        if (!pxTicking) { pxTicking = true; requestAnimationFrame(renderParallax); }
      };
      renderParallax();
      window.addEventListener('scroll', onPxScroll, { passive: true });
      window.addEventListener('resize', onPxScroll, { passive: true });
    }
  }
})();
