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

    var ZONES = ['The Search', 'The Open', 'Inside'];
    if (hudZones) {
      hudZones.innerHTML = ZONES.map(function (z, i) {
        return '<span class="dla-hud-zone" data-zone="' + i + '">' + z + '</span>';
      }).join('');
    }
    var zoneEls = hudZones ? [].slice.call(hudZones.querySelectorAll('[data-zone]')) : [];

    // Three chained Veo takes of the same two men: the walk, the approach and
    // open, then the push into the screen. Each shot's last frame seeded the
    // next, so the camera only ever moves forward across the two joins and the
    // sequence plays as one continuous move.
    // FRAME_COUNT and the CLIP_ENDS boundaries are set from the real extraction
    // (16fps, letterbox cropped) — see scripts, not arithmetic.
    function pad(n) { return String(n).padStart(4, '0'); }
    var FRAME_COUNT = 222;
    var CLIP_ENDS = [127, 221];   // last 0-based index of each clip

    // Scroll is NOT spent evenly across footage time. A walk cycle needs more
    // scroll than a lid-lift to feel deliberate; mapping them 1:1 is what made
    // the previous hero's motion read as sped-up. SHARES is each clip's slice of
    // total scroll — the walk deliberately gets more scroll than its share of
    // frames, so it advances more slowly under the thumb.
    var SHARES = [0.46, 0.26, 0.28].slice(0, CLIP_ENDS.length);
    var SEGMENTS = (function () {
      var sum = SHARES.reduce(function (a, b) { return a + b; }, 0);
      var out = [], p = 0, f = 0;
      for (var c = 0; c < CLIP_ENDS.length; c++) {
        var p1 = c === CLIP_ENDS.length - 1 ? 1 : p + SHARES[c] / sum;
        var f1 = (CLIP_ENDS[c] + 1) / FRAME_COUNT;
        out.push({ p0: p, p1: p1, f0: f, f1: f1 });
        p = p1; f = f1;
      }
      return out;
    })();

    function frameAt(p) {
      for (var si = 0; si < SEGMENTS.length; si++) {
        var sg = SEGMENTS[si];
        if (p <= sg.p1 || si === SEGMENTS.length - 1) {
          var t = Math.max(0, Math.min(1, (p - sg.p0) / (sg.p1 - sg.p0)));
          return (sg.f0 + t * (sg.f1 - sg.f0)) * (FRAME_COUNT - 1);
        }
      }
      return 0;
    }

    // ~15MB of frames must not block first paint. The opening run loads eagerly
    // so the hero is live immediately; the rest streams in after load.
    var EAGER = 64;
    var frames = new Array(FRAME_COUNT);
    function loadFrame(i) {
      if (frames[i]) return;
      var img = new Image();
      img.src = '/assets/img/viking-frames/f' + pad(i + 1) + '.jpg';
      frames[i] = img;
    }
    for (var i = 0; i < Math.min(EAGER, FRAME_COUNT); i++) loadFrame(i);
    function loadRest() {
      var n = EAGER;
      (function chunk() {
        var stop = Math.min(n + 24, FRAME_COUNT);
        for (; n < stop; n++) loadFrame(n);
        if (n < FRAME_COUNT) setTimeout(chunk, 60);
      })();
    }
    if (document.readyState === 'complete') loadRest();
    else window.addEventListener('load', loadRest, { once: true });

    // Nearest already-decoded frame, so scrubbing ahead of the stream shows the
    // closest real frame instead of blanking.
    function readyNear(idx) {
      for (var d = 0; d < FRAME_COUNT; d++) {
        var a = idx - d, b = idx + d;
        if (a >= 0 && frames[a] && frames[a].complete && frames[a].naturalWidth) return a;
        if (b < FRAME_COUNT && frames[b] && frames[b].complete && frames[b].naturalWidth) return b;
      }
      return -1;
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

    // Draw exactly one frame. An earlier version cross-faded adjacent frames to
    // disguise a hard cut in the old laptop render; this footage is three
    // continuous takes, so blending two moving frames only produces ghosting.
    function drawBlend(idx0) {
      var a = readyNear(idx0);
      if (a < 0) return;                       // nothing decoded yet; keep last paint
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawOne(frames[a], 1);
    }

    // The footage's own final frames fly into the white screen. As that
    // happens the site content simply fades in over it — one continuous
    // camera move, no cut.
    var REVEAL_AT = 0.92;
    function reveal(t) {
      if (!screenEl) return;
      var v = Math.max(0, Math.min(1, t));
      screenEl.style.opacity = v.toFixed(3);
      screenEl.classList.toggle('is-live', v > 0.85);
      if (ui) ui.style.opacity = Math.max(0, 1 - v * 2).toFixed(3);
    }

    // Captions change on the clip boundaries, so the copy turns over exactly
    // when the shot does.
    function step(p) {
      if (p >= REVEAL_AT) return caps.length;
      if (p < SEGMENTS[0].p1) return 0;
      if (p < SEGMENTS[1].p1) return 1;
      return 2;
    }

    var latestP = 0, lastIdx0 = -1, lastStep = -1, ticking = false, hudVisible = false;
    function onScroll() {
      var rect = section.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      latestP = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }
    function render() {
      ticking = false;
      var p = latestP;

      var idxFloat = frameAt(p);
      var idx0 = Math.max(0, Math.min(FRAME_COUNT - 1, Math.floor(idxFloat)));
      if (idx0 !== lastIdx0) {
        drawBlend(idx0);
        lastIdx0 = idx0;
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
        drawBlend(0); lastIdx0 = 0; clearInterval(primeTimer);
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
