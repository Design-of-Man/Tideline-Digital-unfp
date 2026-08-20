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

    // Where the lit screen sits inside the final frame, measured off the
    // render itself (normalised to the 1280x720 source).
    var SCREEN = { x: 0.1500, y: 0.0792, w: 0.6820, h: 0.6389 };
    // Scroll is split: scrub the laptop open, then fly into the screen.
    var ENTER_AT = 0.72;

    var ZONES = ['The Bench', 'The Launch', 'Inside'];
    if (hudZones) {
      hudZones.innerHTML = ZONES.map(function (z, i) {
        return '<span class="dla-hud-zone" data-zone="' + i + '">' + z + '</span>';
      }).join('');
    }
    var zoneEls = hudZones ? [].slice.call(hudZones.querySelectorAll('[data-zone]')) : [];

    var base = section.dataset.frameBase;
    var digits = parseInt(section.dataset.frameDigits, 10) || 4;
    var ext = section.dataset.frameExt || 'jpg';
    if (!base) return;

    // The source render was chained from several clips and never opens
    // cleanly on its own: it restarts twice (frames 50 and 74 replay a
    // darker, more-closed state), the camera breathes backwards inside the
    // open shot, and past 105 the screen blows out to solid white. Any of
    // those reads as the lid closing back up mid-scroll.
    // These two lists are the frames that strictly progress, picked by
    // measuring glow brightness over the closed build and lit-screen area
    // over the open push-in, then keeping only frames that advance on it.
    var closedFrames = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,30,31,32,33,34,35,36,37,38,40];
    var openFrames = [85,86,87,88,89,90,91,96,100,101,103,104];
    var srcFrames = closedFrames.concat(openFrames);
    var usableCount = srcFrames.length;
    var joinIdx = closedFrames.length - 1; // last frame before the cut to the open laptop

    function pad(n) { return String(n).padStart(digits, '0'); }
    var frames = new Array(usableCount);
    for (var i = 0; i < usableCount; i++) {
      var img = new Image();
      img.src = base + pad(srcFrames[i]) + '.' + ext;
      frames[i] = img;
    }

    // Hold most of the scroll for the glow build, then spend a wide band
    // dissolving across the one real cut so the laptop opens as a slow
    // reveal rather than a jump, then ride the push-in.
    function frameAt(p) {
      if (p < 0.45) return (p / 0.45) * joinIdx;
      if (p < 0.58) return joinIdx + ((p - 0.45) / 0.13);
      return (joinIdx + 1) + ((p - 0.58) / 0.42) * (usableCount - 1 - (joinIdx + 1));
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

    // Same cover math as drawCover, but in CSS pixels, so the screen panel
    // lands exactly on the laptop's display no matter the viewport shape.
    function screenRect() {
      var SW = stage.clientWidth, SH = stage.clientHeight;
      var img = frames[usableCount - 1];
      var iw = (img && img.naturalWidth) || 1280, ih = (img && img.naturalHeight) || 720;
      var scale = Math.max(SW / iw, SH / ih);
      var dw = iw * scale, dh = ih * scale;
      var dx = (SW - dw) / 2, dy = (SH - dh) / 2;
      return {
        x: dx + SCREEN.x * dw, y: dy + SCREEN.y * dh,
        w: SCREEN.w * dw, h: SCREEN.h * dh,
        SW: SW, SH: SH
      };
    }

    // Accelerating push: the site sits on the display long enough to read as
    // a screen, then the camera rushes the last of the way in.
    function easeIn(t) { return t * t; }

    // Grows the panel from the screen rect to the full viewport while the
    // canvas scales around that same point, so both move as one camera push.
    function enterScreen(t) {
      if (!screenEl) return;
      var r = screenRect();
      var e = easeIn(Math.max(0, Math.min(1, t)));
      var x = r.x + (0 - r.x) * e;
      var y = r.y + (0 - r.y) * e;
      var w = r.w + (r.SW - r.w) * e;
      var h = r.h + (r.SH - r.h) * e;
      screenEl.style.left = x + 'px';
      screenEl.style.top = y + 'px';
      screenEl.style.width = w + 'px';
      screenEl.style.height = h + 'px';
      screenEl.style.opacity = Math.min(1, t * 10).toFixed(3);
      screenEl.classList.toggle('is-live', t > 0.92);
      // Content rides up to full size with the panel instead of being squashed.
      if (screenInner) {
        var s = Math.max(0.35, w / r.SW);
        screenInner.style.transform = 'scale(' + s.toFixed(3) + ')';
        screenInner.style.opacity = Math.min(1, t * 8).toFixed(3);
      }
      if (ui) ui.style.opacity = Math.max(0, 1 - t * 7).toFixed(3);
      // Push the frame past the camera, anchored on the screen's centre.
      var cx = ((r.x + r.w / 2) / r.SW) * 100;
      var cy = ((r.y + r.h / 2) / r.SH) * 100;
      var K = Math.max(r.SW / r.w, r.SH / r.h);
      canvas.style.transformOrigin = cx.toFixed(2) + '% ' + cy.toFixed(2) + '%';
      canvas.style.transform = 'scale(' + (1 + (K - 1) * e).toFixed(4) + ')';
    }

    function resetScreen() {
      if (ui) ui.style.opacity = '1';
      if (screenEl) {
        screenEl.style.opacity = '0';
        screenEl.classList.remove('is-live');
      }
      canvas.style.transform = 'scale(1)';
    }

    function step(p) {
      if (p >= ENTER_AT) return caps.length;           // inside the screen
      var n = caps.length || 1;
      return Math.min(n - 1, Math.floor((p / ENTER_AT) * n));
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

      // Phase one scrubs the laptop open; phase two flies into the screen.
      var scrubP = Math.min(1, p / ENTER_AT);
      var enterP = p <= ENTER_AT ? 0 : (p - ENTER_AT) / (1 - ENTER_AT);

      var idxFloat = frameAt(scrubP);
      var idx0 = Math.max(0, Math.min(usableCount - 1, Math.floor(idxFloat)));
      var idx1 = Math.min(usableCount - 1, idx0 + 1);
      var frac = idxFloat - idx0;
      if (idx0 !== lastIdx0 || Math.abs(frac - lastFrac) > 0.01) {
        drawBlend(idx0, idx1, frac);
        lastIdx0 = idx0; lastFrac = frac;
      }

      if (enterP > 0) enterScreen(enterP); else resetScreen();

      // Grade lifts while opening, then clears so the screen reads bright.
      if (grade) {
        var g = enterP > 0 ? 0.3 * (1 - enterP) : 0.08 + scrubP * 0.22;
        grade.style.opacity = g.toFixed(3);
      }
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
    else { caps.forEach(function (el, i) { el.classList.toggle('is-active', i === 0); }); resetScreen(); }
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
