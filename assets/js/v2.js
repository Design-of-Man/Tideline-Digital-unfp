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

  // Home hero: a scroll-scrubbed video of the viking sequence.
  // Scroll position maps to video currentTime. The video is encoded with a
  // short GOP (keyframe every 12 frames) so seeking lands fast; an earlier
  // build used a JPEG frame sequence instead, but that forced a 1280px
  // extraction to stay under budget and looked soft on high-DPR screens.
  (function () {
    var section = document.getElementById('heroScrub');
    var stage = document.getElementById('heroScrubStage');
    var canvas = document.getElementById('heroScrubCanvas');
    if (!section || !stage) return;
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

    var ZONES = ['The Search', 'The Journey', 'The Open', 'Inside'];
    if (hudZones) {
      hudZones.innerHTML = ZONES.map(function (z, i) {
        return '<span class="dla-hud-zone" data-zone="' + i + '">' + z + '</span>';
      }).join('');
    }
    var zoneEls = hudZones ? [].slice.call(hudZones.querySelectorAll('[data-zone]')) : [];

    // Four chained Veo takes of the same two men: the walk, spotting the laptop
    // far off and closing the distance, arriving and opening it, then the push
    // into the screen. Each shot was seeded from the previous shot's frame, so
    // the camera only moves forward across the three joins.
    //
    // This is scrubbed as VIDEO, not as a JPEG frame sequence. A frame sequence
    // stores every frame standalone and throws away all temporal compression,
    // which forced a 1280px extraction to stay under budget — on a 2x-DPR
    // display that was a 2.7x upscale and looked soft. The same footage as
    // short-GOP video is 2560px wide for a fraction of the bytes.
    var VIDEO_W = 2560, VIDEO_H = 1302;

    // Clip boundaries in SECONDS (clip 4 is trimmed at 5.2s, before the camera
    // descends far enough to lose both men out of frame).
    var CLIP_ENDS_T = [8, 16, 24, 29.2];
    var DURATION = CLIP_ENDS_T[CLIP_ENDS_T.length - 1];
    var REVEAL_AT = 0.88;

    // Scroll is NOT spent evenly across footage time. A walk cycle needs more
    // scroll than a lid-lift to feel deliberate; mapping them 1:1 is what made
    // an earlier cut read as sped-up. SHARES is each clip's slice of total
    // scroll — the walk and the long approach deliberately get more scroll than
    // their share of footage, so they advance more slowly under the thumb.
    var SHARES = [0.30, 0.30, 0.22, 0.18];
    var SEGMENTS = (function () {
      var sum = SHARES.reduce(function (a, b) { return a + b; }, 0);
      var out = [], p = 0, t0 = 0;
      for (var c = 0; c < CLIP_ENDS_T.length; c++) {
        var p1 = c === CLIP_ENDS_T.length - 1 ? 1 : p + SHARES[c] / sum;
        out.push({ p0: p, p1: p1, t0: t0, t1: CLIP_ENDS_T[c] });
        p = p1; t0 = CLIP_ENDS_T[c];
      }
      return out;
    })();

    // Frames are spent over [0, REVEAL_AT]; past that the footage HOLDS on its
    // final frame while the site panel grows out of the screen, so the panel
    // lines up with the laptop instead of growing from where it used to be.
    function timeAt(p) {
      p = Math.min(1, p / REVEAL_AT);
      for (var i = 0; i < SEGMENTS.length; i++) {
        var sg = SEGMENTS[i];
        if (p <= sg.p1 || i === SEGMENTS.length - 1) {
          var t = Math.max(0, Math.min(1, (p - sg.p0) / (sg.p1 - sg.p0)));
          return sg.t0 + t * (sg.t1 - sg.t0);
        }
      }
      return 0;
    }

    // The video is the hero image itself, shown directly with object-fit:cover
    // rather than drawn to a canvas. Two reasons: a detached <video> silently
    // refuses to seek (readyState 4, currentTime stays 0), and native video
    // scaling is sharper than canvas resampling at high DPR.
    var video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.className = 'hero-scrub-video';
    video.poster = '/assets/img/viking-poster.jpg?v=20260822b';
    if (canvas && canvas.parentNode) canvas.parentNode.replaceChild(video, canvas);
    else stage.insertBefore(video, stage.firstChild);
    (function () {
      var base = '/assets/video/viking-hero';
      var canMp4 = video.canPlayType('video/mp4; codecs="avc1.640028"');
      // mp4 first: smaller than the vp9 build here and hardware-decoded almost
      // everywhere. webm only covers builds without H.264 (e.g. some Linux).
      video.src = (canMp4 === 'probably' || canMp4 === 'maybe') ? base + '.mp4?v=20260822b'
                                                                : base + '.webm?v=20260822b';
    })();

    var frameReady = false;
    window.__heroVideo = video;
    video.addEventListener('loadeddata', function () { frameReady = true; draw(); });
    video.addEventListener('seeked', function () { frameReady = true; draw(); release(); flush(); });

    window.addEventListener('resize', function () { render(); }, { passive: true });

    function draw() { /* video paints itself; nothing to blit */ }

    // Seeks are coalesced, never queued. A queued seek backlog is what makes
    // video scrubbing feel laggy — if a seek is in flight we just remember the
    // newest target and issue it once the current one lands.
    // Two things must be guarded or scrubbing deadlocks:
    //  - seeking to the time the video is ALREADY at fires no 'seeked' event,
    //    so `pending` would never clear and every later seek is blocked;
    //  - a seek into an unbuffered range can stall, so a watchdog releases it.
    var pending = false, wantT = -1, lastT = -1, watchdog = null;
    function release() {
      pending = false;
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
    }
    function flush() {
      if (pending || wantT < 0) return;
      if (Math.abs(wantT - lastT) < 0.012) return;             // sub-frame, skip
      if (Math.abs(wantT - video.currentTime) < 0.004) {        // already there
        lastT = wantT; return;
      }
      lastT = wantT;
      pending = true;
      if (watchdog) clearTimeout(watchdog);
      watchdog = setTimeout(function () { release(); flush(); }, 400);
      try { video.currentTime = wantT; }
      catch (e) { release(); }
    }
    function seekTo(t) { wantT = Math.max(0, Math.min(DURATION - 0.05, t)); flush(); }

    // The last shot ends on the laptop centred with a clean white screen.
    // Rather than fading the site in over the whole viewport, the site panel
    // starts exactly on that screen rectangle and grows to fill the frame, so
    // the site reads as the thing running on the laptop.
    // Measured off the final frame; normalised to the frame, then mapped
    // through the same cover-fit maths the canvas uses.
    var SCREEN = { x: 0.5469, y: 0.4378, w: 0.1719, h: 0.4301 };

    function screenRectCss() {
      var iw = VIDEO_W, ih = VIDEO_H;
      var cw = stage.clientWidth, ch = stage.clientHeight;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale, dh = ih * scale;
      var ox = (cw - dw) / 2, oy = (ch - dh) / 2;
      return { l: ox + SCREEN.x * dw, t: oy + SCREEN.y * dh, w: SCREEN.w * dw, h: SCREEN.h * dh };
    }

    function reveal(t) {
      if (!screenEl) return;
      var v = Math.max(0, Math.min(1, t));
      if (v <= 0) {
        screenEl.style.opacity = '0';
        screenEl.style.clipPath = '';
        if (screenInner) screenInner.style.transform = '';
        video.style.transform = '';
        screenEl.classList.remove('is-live');
        if (ui) ui.style.opacity = '1';
        return;
      }
      // ease-out so it lifts off the screen quickly then settles
      var e = 1 - Math.pow(1 - v, 3);
      var r = screenRectCss();
      var cw = stage.clientWidth, ch = stage.clientHeight;
      var l = r.l * (1 - e), tp = r.t * (1 - e);
      var rt = (cw - (r.l + r.w)) * (1 - e), bt = (ch - (r.t + r.h)) * (1 - e);
      screenEl.style.clipPath = 'inset(' + tp.toFixed(1) + 'px ' + rt.toFixed(1) + 'px ' +
                                bt.toFixed(1) + 'px ' + l.toFixed(1) + 'px)';

      // Scale the content along with the aperture, anchored on the screen's
      // centre. Without this the copy renders at full viewport size inside a
      // small window, which reads as looking THROUGH a hole at the site rather
      // than the site being what is on the laptop.
      var cx = r.l + r.w / 2, cy = r.t + r.h / 2;
      if (screenInner) {
        var k = (r.w / cw) + e * (1 - r.w / cw);
        var ox = (cw / 2 - cx) * (1 - e), oy = (ch / 2 - cy) * (1 - e);
        screenInner.style.transformOrigin = '50% 50%';
        screenInner.style.transform = 'translate(' + (-ox).toFixed(1) + 'px,' + (-oy).toFixed(1) +
                                      'px) scale(' + k.toFixed(4) + ')';
      }
      // Push the FOOTAGE into the screen as the panel opens. Without this the
      // video sits frozen while a rectangle grows over it, which reads as a
      // panel wiping on rather than the camera flying into the display. The
      // video scales about the laptop screen's own centre so the growing
      // aperture and the footage converge on the same point.
      var ZOOM = 2.6;
      var vk = 1 + (ZOOM - 1) * e;
      video.style.transformOrigin = ((cx / cw) * 100).toFixed(2) + '% ' +
                                    ((cy / ch) * 100).toFixed(2) + '%';
      video.style.transform = 'scale(' + vk.toFixed(4) + ')';

      screenEl.style.opacity = Math.min(1, v * 4).toFixed(3);
      screenEl.classList.toggle('is-live', v > 0.6);
      if (ui) ui.style.opacity = Math.max(0, 1 - v * 2).toFixed(3);
    }

    // Captions change on the clip boundaries, so the copy turns over exactly
    // when the shot does.
    function step(p) {
      if (p >= REVEAL_AT) return caps.length;
      for (var i = 0; i < SEGMENTS.length; i++) if (p < SEGMENTS[i].p1) return i;
      return SEGMENTS.length - 1;
    }

    var latestP = 0, lastStep = -1, ticking = false, hudVisible = false;
    function onScroll() {
      var rect = section.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      latestP = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }
    function render() {
      ticking = false;
      var p = latestP;

      seekTo(timeAt(p));

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

    // Nudge the first real frame in so the hero is footage, not poster, asap.
    var primeTimer = setInterval(function () {
      if (video.readyState >= 2) { draw(); clearInterval(primeTimer); }
    }, 80);
    setTimeout(function () { clearInterval(primeTimer); }, 8000);

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
