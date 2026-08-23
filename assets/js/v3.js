/* Design of Man — the signature move: the site IS what is on the laptop screen.
   The engine is never edited per project, so everything bespoke lives here and is
   driven off the film's own playback time plus page scroll geometry. */
(function () {
  'use strict';

  var V = (function () {
    var s = document.currentScript;
    var q = s && s.src ? s.src.split('?v=')[1] : '';
    return q ? '?v=' + q.split('&')[0] : '';
  })();

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Format pick before mount. The engine takes one src per clip, so the choice
     of container is the page's job. Plenty of builds ship only H.264 and lose
     the entire scrub on any browser without the licensed decoder: Firefox, and
     every Chromium compiled without proprietary codecs. Falling back to VP9
     costs a second file and is the difference between a film and a poster. */
  (function pickFormat() {
    var probe = document.createElement('video');
    if (probe.canPlayType('video/mp4; codecs="avc1.640028"')) return;
    if (!probe.canPlayType('video/webm; codecs="vp9"')) return;
    var vids = document.querySelectorAll('video[data-sc-scrub]');
    for (var i = 0; i < vids.length; i++) {
      ['data-sc-src', 'data-sc-src-mobile'].forEach(function (a) {
        var v = vids[i].getAttribute(a);
        if (v) vids[i].setAttribute(a, v.replace('.mp4', '.webm'));
      });
    }
  })();

  /* ─────────────────────────────────────────────── the gateway, not a wall ──
     The film is how you arrive at the site, but nobody should be made to scroll
     it twice. It plays once per session; after that, and for any deep link,
     `/` opens straight at the content. The film and the peak are removed BEFORE
     the engine mounts so their scroll height never exists rather than being
     hidden after the fact, which would leave a dead gap at the top of the page.

     sessionStorage rather than localStorage on purpose: coming back tomorrow
     should feel like arriving again. Wrapped because Safari private mode throws
     on access rather than returning null. */
  var KEY = 'dom.film.seen';
  function seen(v) {
    try { return v === undefined ? sessionStorage.getItem(KEY) === '1'
                                 : sessionStorage.setItem(KEY, v ? '1' : '0'); }
    catch (e) { return false; }
  }
  var deepLink = location.hash && location.hash.length > 1;
  var skipFilm = seen() || deepLink;
  if (skipFilm) {
    document.documentElement.classList.add('no-film');
    ['film', 'peak'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.parentNode.removeChild(el);
    });
    var g0 = document.getElementById('glass');
    if (g0) g0.parentNode.removeChild(g0);
  }

  ScrollCraft.mount(document.body);

  var glass  = document.getElementById('glass');
  var still  = document.getElementById('glassStill');
  var panel  = document.getElementById('panel');
  var bezel  = document.getElementById('bezel');
  var peak   = document.getElementById('peak');
  var join   = document.getElementById('join');
  var close  = document.getElementById('closeStage');
  var closeCta = document.querySelector('.close__inner .btn');
  var video  = document.querySelector('video[data-sc-scrub]');

  /* No film this visit: the close act still needs its moor and the bezel still
     needs to retreat, so run a reduced loop rather than bailing out entirely. */
  if (skipFilm) {
    if (!join || !close) return;
    close.style.setProperty('--moor-src', 'url("/assets/video/sc/film-end.jpg' + V + '")');
    var rafB = 0;
    var paintClose = function () {
      rafB = 0;
      var vh2 = window.innerHeight;
      var y2 = window.pageYOffset || document.documentElement.scrollTop;
      var jT = absTop(join), jTr = Math.max(join.offsetHeight - vh2, 1);
      var c2 = clamp01((y2 - jT) / jTr);
      if (bezel) bezel.style.opacity = String(1 - ease(clamp01(c2 / 0.7)));
      close.style.setProperty('--moor', ease(clamp01(c2 / 0.7)).toFixed(3));
      syncCloseCta();
    };
    addEventListener('scroll', function () { if (!rafB) rafB = requestAnimationFrame(paintClose); }, { passive: true });
    addEventListener('resize', paintClose);
    paintClose();
    return;
  }

  if (!glass || !peak || !join) return;

  /* Once the payoff has been seen, remember it. Set at the moment the boot
     completes rather than on load, so a reader who bounces in the first two
     seconds still gets the film next time. */
  function markSeen() { seen(true); }

  close.style.setProperty('--moor-src', 'url("/assets/video/sc/film-end.jpg' + V + '")');

  /* The screen on the film's LAST frame, normalised to the video frame, as
     [x, y, w, h]. One rectangle is all this needs now: nothing is drawn on the
     glass while the film runs -- the white screen you see is the footage's own.
     This rect only says where to aim the push-in. Measured by fitting the four
     edges of the blown-out screen region and taking their bounding box. */
  var SCREEN = [0.32621, 0.26920, 0.34530, 0.44052];
  var AR = 2560 / 1302;

  /* Where the flight finishes. The rest of the peak is dwell: the payoff needs
     room to be read, not just room to arrive. */
  var FLIGHT = 0.58;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  /* Smootherstep. Zero velocity at both ends, so the camera neither snaps into
     the screen nor stops dead against it. */
  function ease(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  function absTop(el) {
    var t = 0;
    for (var n = el; n; n = n.offsetParent) t += n.offsetTop;
    return t;
  }

  /* Where the laptop's screen sits on the last frame, in CSS pixels, matching
     object-fit:cover on the stage. */
  function screenRect(vw, vh) {
    var dw, dh;
    if (vw / vh > AR) { dw = vw; dh = vw / AR; } else { dh = vh; dw = vh * AR; }
    var ox = (vw - dw) / 2, oy = (vh - dh) / 2;
    return { l: ox + SCREEN[0] * dw, t: oy + SCREEN[1] * dh,
             w: SCREEN[2] * dw,      h: SCREEN[3] * dh };
  }

  /* How far to push in before the screen has swallowed the viewport. Scaling
     happens about the screen's own centre, so the reach in each direction is to
     the furthest viewport edge FROM THAT CENTRE, not half the viewport. */
  function zoomTo(vw, vh) {
    var r = screenRect(vw, vh);
    var cx = r.l + r.w / 2, cy = r.t + r.h / 2;
    var sx = 2 * Math.max(cx, vw - cx) / r.w;
    var sy = 2 * Math.max(cy, vh - cy) / r.h;
    return { cx: cx, cy: cy, s: Math.max(sx, sy) * 1.04 };
  }

  var live = false, inert = true, ctaOff = false, raf = 0;

  function setLive(on) {
    if (on === live) return;
    live = on;
    glass.classList.toggle('is-live', on);
  }
  /* The panel holds a real CTA. A link nobody can see must not be tabbable
     (WCAG 4.1.2), so it comes back only once the site is actually up. */
  function setInert(on) {
    if (on === inert) return;
    inert = on;
    if (on) { glass.setAttribute('inert', ''); glass.setAttribute('aria-hidden', 'true'); }
    else { glass.removeAttribute('inert'); glass.removeAttribute('aria-hidden'); }
    glass.style.pointerEvents = on ? 'none' : 'auto';
  }
  /* The closing CTA is itself a cue, so the engine parks it at opacity 0 until
     its act is live. Opacity alone does not remove a link from the tab order. */
  function syncCloseCta() {
    if (!closeCta) return;
    var op = closeCta.style.opacity;
    var hide = op !== '' && parseFloat(op) < 0.05;
    if (hide === ctaOff) return;
    ctaOff = hide;
    if (hide) closeCta.setAttribute('inert', ''); else closeCta.removeAttribute('inert');
  }

  /* The three beats of the payoff, as fractions of the peak act's travel. */
  var ZOOM_END = 0.52;   /* push-in finishes: the viewport is the white screen */
  var MARK_IN  = 0.46, MARK_FULL = 0.60;
  var BOOT_IN  = 0.72, BOOT_FULL = 0.92;

  function render() {
    raf = 0;
    var vh = window.innerHeight, vw = window.innerWidth;
    var y = window.pageYOffset || document.documentElement.scrollTop;

    var pTop = absTop(peak), pH = peak.offsetHeight;
    var g = clamp01((y - (pTop - vh)) / Math.max(pH, 1));

    if (reduce) {
      /* Every position change is dropped; opacity carries the reveal. */
      var on = g > 0 && g < 1;
      setLive(on);
      if (on) {
        still.style.transform = 'none';
        still.style.opacity = '0';
        panel.style.setProperty('--boot', '1');
        panel.style.setProperty('--mark', '0');
        panel.style.opacity = '1';
        setInert(false);
      } else { setInert(true); }
    } else if (g <= 0) {
      /* THE FILM RUNS UNTOUCHED. Nothing is drawn on the glass: the white screen
         on the laptop is the footage's own, so there is no composite to
         mis-track and nothing to give the trick away. */
      setLive(false);
      setInert(true);
    } else {
      /* PUSH IN, then the mark, then the site.
         The still is the film's own final frame, so it takes over from the scrub
         stage without a seam and can then be scaled past the frame edge. Scaling
         about the screen's centre is what turns the machine's screen into the
         page: at the end of the push-in the viewport IS the white screen. */
      /* Stand down once the peak is finished. g clamps to 1, so `g > 0` stays
         true for the whole rest of the document: leaving the overlay live left
         an opaque canvas-coloured sheet fixed over every section below, which
         is exactly as visible as it sounds and shipped once already. The
         harness could not catch it -- "no dead scroll" measures whether the
         clip advances, not whether something is painted on top of the page. */
      setLive(g < 1);
      if (g >= 1) { setInert(true); syncCloseCta(); paintFrame(y, vh); return; }

      var z = ease(clamp01(g / ZOOM_END));
      var zt = zoomTo(vw, vh);
      var sc = 1 + (zt.s - 1) * z;
      still.style.transformOrigin = zt.cx.toFixed(1) + 'px ' + zt.cy.toFixed(1) + 'px';
      still.style.transform = 'scale(' + sc.toFixed(4) + ')';

      var mark = ease(clamp01((g - MARK_IN) / (MARK_FULL - MARK_IN)));
      var boot = ease(clamp01((g - BOOT_IN) / (BOOT_FULL - BOOT_IN)));
      /* The white goes out with the boot. Leaving it up meant that when the
         panel released at the very end of the act, the machine's screen came
         back from underneath the site. */
      still.style.opacity = String(1 - boot);
      panel.style.setProperty('--mark', mark.toFixed(3));
      panel.style.setProperty('--boot', boot.toFixed(3));
      if (boot > 0.98) markSeen();
      /* Hand off to act 4 on the same ground rather than cutting. */
      panel.style.opacity = String(1 - clamp01((g - 0.95) / 0.05));
      setInert(boot < 0.5);
    }

    paintFrame(y, vh, g);
    syncCloseCta();
  }

  /* The frame that never breaks. It arrives as the site comes up and stays for
     everything below, then the close pulls back out of the machine. */
  function paintFrame(y, vh, g) {
    var jTop = absTop(join), jTravel = Math.max(join.offsetHeight - vh, 1);
    var c = clamp01((y - jTop) / jTravel);
    var on = (g === undefined || g >= 1) ? 1 : clamp01((g - BOOT_IN) / 0.20);
    bezel.style.opacity = Math.min(on, 1 - ease(clamp01(c / 0.7))).toFixed(3);
    close.style.setProperty('--moor', ease(clamp01(c / 0.7)).toFixed(3));
  }

  function onScroll() { if (!raf) raf = requestAnimationFrame(render); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('orientationchange', onScroll);
  /* The scrub video settles asynchronously after a scroll stops, so a
     scroll-only loop leaves the panel on a stale frame. Keep rendering while
     the overlay is live. */
  (function tick() { if (live) render(); requestAnimationFrame(tick); })();
  render();
})();
