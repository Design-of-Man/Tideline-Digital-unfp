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

    var ZONES = ['The Search', 'The Journey', 'Inside'];
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

    // Clip boundaries in SECONDS. Three shots: the walk, the reveal of the
    // laptop far off plus the approach, then the arrival and the push into the
    // screen.
    //
    // The arrival was reshot with the laptop already open and its screen
    // already facing the direction they walk in from, and with contact banned
    // outright rather than specific verbs of moving it. Earlier takes all
    // resolved "camera behind the men" plus "screen toward camera" by having a
    // hand reach in and rotate the object, which is backwards when the man
    // doing it has his back to us. With nothing to open there is no pretext.
    var CLIP_ENDS_T = [8, 16, 24];
    var DURATION = CLIP_ENDS_T[CLIP_ENDS_T.length - 1];
    var REVEAL_AT = 0.84;

    // Scroll is NOT spent evenly across footage time. A walk cycle needs more
    // scroll than a lid-lift to feel deliberate; mapping them 1:1 is what made
    // an earlier cut read as sped-up. SHARES is each clip's slice of total
    // scroll — the walk and the long approach deliberately get more scroll than
    // their share of footage, so they advance more slowly under the thumb.
    var SHARES = [0.34, 0.34, 0.32];
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
    video.poster = '/assets/img/viking-poster.jpg?v=20260822i';
    if (canvas && canvas.parentNode) canvas.parentNode.replaceChild(video, canvas);
    else stage.insertBefore(video, stage.firstChild);
    (function () {
      var base = '/assets/video/viking-hero';
      var canMp4 = video.canPlayType('video/mp4; codecs="avc1.640028"');
      // mp4 first: smaller than the vp9 build here and hardware-decoded almost
      // everywhere. webm only covers builds without H.264 (e.g. some Linux).
      video.src = (canMp4 === 'probably' || canMp4 === 'maybe') ? base + '.mp4?v=20260822i'
                                                                : base + '.webm?v=20260822i';
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
    var SCREEN = { x: 0.3312, y: 0.2688, w: 0.3402, h: 0.4339 };

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
        if (hud) hud.style.opacity = '';
        if (bar) bar.parentNode.style.opacity = '';
        return;
      }

      var r = screenRectCss();
      var cw = stage.clientWidth, ch = stage.clientHeight;
      var cx = r.l + r.w / 2, cy = r.t + r.h / 2;

      // ONE scale factor drives the footage and the site panel. Scaling the
      // video by k about the laptop screen's own centre leaves that centre
      // fixed and puts the screen's edges at exactly r.w*k by r.h*k. Drawing
      // the panel to that same rect is what welds it to the glass: the panel
      // IS the screen, at every value of k, instead of a rectangle wiping on
      // over frozen footage. kEnd is whatever it takes for the screen to fill
      // the viewport exactly, computed from the measured rect rather than
      // guessed, so the move lands on the site with nothing left over.
      var kEnd = Math.max(cw / r.w, ch / r.h);
      // Smoothstep, not ease-out. An ease-out spends most of its travel in the
      // first sliver of the reveal, so the site flashed past the glass and was
      // full-bleed almost immediately -- you never got to see it sitting on the
      // laptop. This eases in and out instead, so it holds on the screen, flies
      // in through the middle, and settles.
      var e = v * v * (3 - 2 * v);
      // Scale grows geometrically. Interpolating k linearly makes the push look
      // like it decelerates hard, because equal steps in k are progressively
      // smaller steps in apparent size; raising kEnd to the eased power keeps
      // the rate of approach even.
      var k = Math.pow(kEnd, e);

      // The laptop screen does not sit at the centre of frame, so growing it
      // about its own centre would run it off one edge and leave the opposite
      // edge bare at full zoom. The footage therefore pans as it scales: the
      // screen's centre travels to the viewport's centre over the same easing,
      // so the last frame lands squarely full-bleed with nothing left over.
      var dx = (cw / 2 - cx) * e, dy = (ch / 2 - cy) * e;
      var px = cx + dx, py = cy + dy;

      // The panel outruns the footage after the first moment. Locked exactly to
      // the glass all the way to full-bleed, the middle of the move is a
      // webpage sitting inside a thick laptop bezel -- a product mockup, not a
      // camera going into a screen. Raising k by a small exponent for the panel
      // only keeps them welded while it matters (at v=0.1 they differ by half a
      // percent, invisible) and then lets the page edge run out past the bezel
      // and off the viewport, so the frame is swallowed instead of framing the
      // site. The exponent is set so the panel reaches full-bleed at ~3/4 of
      // the reveal; the footage keeps pushing behind it for the rest.
      var kp = Math.pow(k, 1.22);
      var pw = r.w * kp, ph = r.h * kp;
      var l = Math.max(0, px - pw / 2);
      var tp = Math.max(0, py - ph / 2);
      var rt = Math.max(0, cw - (px + pw / 2));
      var bt = Math.max(0, ch - (py + ph / 2));
      screenEl.style.clipPath = 'inset(' + tp.toFixed(1) + 'px ' + rt.toFixed(1) + 'px ' +
                                bt.toFixed(1) + 'px ' + l.toFixed(1) + 'px)';

      // The copy grows with the glass. Laid out at viewport size and scaled by
      // the aperture's own fraction of the viewport, it reads as the site being
      // what is displayed on the laptop rather than a hole punched through to
      // a full-size page behind.
      if (screenInner) {
        var sk = Math.min(1, pw / cw);
        screenInner.style.transformOrigin = '50% 50%';
        screenInner.style.transform = 'translate(' + (px - cw / 2).toFixed(1) + 'px,' +
                                      (py - ch / 2).toFixed(1) + 'px) scale(' + sk.toFixed(4) + ')';
      }

      video.style.transformOrigin = ((cx / cw) * 100).toFixed(3) + '% ' +
                                    ((cy / ch) * 100).toFixed(3) + '%';
      video.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) +
                              'px) scale(' + k.toFixed(4) + ')';

      // Come up fast and opaque. A slow fade left the copy translucent over the
      // footage's blown-out screen, which reads as a ghost floating in front of
      // the laptop rather than as the page the laptop is displaying.
      screenEl.style.opacity = Math.min(1, v * 14).toFixed(3);
      screenEl.classList.toggle('is-live', v > 0.6);
      // The HUD rail and the progress bar sit above the screen panel, so they
      // have to go with it -- otherwise they stay painted over the revealed site.
      var chrome = Math.max(0, 1 - v * 3).toFixed(3);
      if (ui) ui.style.opacity = chrome;
      if (hud) hud.style.opacity = chrome;
      if (bar) bar.parentNode.style.opacity = chrome;
    }

    // Captions change on the clip boundaries, so the copy turns over exactly
    // when the shot does.
    function step(p) {
      if (p >= REVEAL_AT) return caps.length;
      // SEGMENTS live in the same compressed space timeAt() uses -- all of the
      // footage is spent by REVEAL_AT -- so the caption boundaries have to be
      // read there too. Comparing raw scroll against them left each caption
      // running on past the shot it belongs to.
      var q = p / REVEAL_AT;
      for (var i = 0; i < SEGMENTS.length; i++) if (q < SEGMENTS[i].p1) return i;
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
