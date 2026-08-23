/* Design of Man — the signature move.
   The engine is never edited per project, so everything bespoke lives here and
   is driven off scroll geometry and the engine's own act elements. */
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

  ScrollCraft.mount(document.body);

  var glass  = document.getElementById('glass');
  var still  = document.getElementById('glassStill');
  var panel  = document.getElementById('panel');
  var bezel  = document.getElementById('bezel');
  var peak   = document.getElementById('peak');
  var join   = document.getElementById('join');
  var close  = document.getElementById('closeStage');
  var closeCta = document.querySelector('.close__inner .btn');
  if (!glass || !peak || !join) return;

  close.style.setProperty('--moor-src', 'url("/assets/video/sc/film-end.jpg' + V + '")');

  /* The laptop's lit screen on the film's final frame, normalised to the frame,
     from the same track that welded the panel to the glass in the previous
     build: [x, y, w, h]. film-end.jpg IS that frame, so the panel opens exactly
     on the display and the cut from film to still is invisible. */
  var QUAD = [0.33358, 0.27761, 0.33773, 0.42257];
  var AR = 2560 / 1302;

  /* Where the flight finishes. The remaining scroll is dwell: the payoff needs
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

  /* The screen quad in CSS pixels, matching object-fit:cover on the viewport. */
  function quadRect(vw, vh) {
    var dw, dh;
    if (vw / vh > AR) { dw = vw; dh = vw / AR; } else { dh = vh; dw = vh * AR; }
    var ox = (vw - dw) / 2, oy = (vh - dh) / 2;
    return { l: ox + QUAD[0] * dw, t: oy + QUAD[1] * dh, w: QUAD[2] * dw, h: QUAD[3] * dh };
  }

  var live = false, inert = true, ctaOff = false, raf = 0;

  /* The closing CTA is itself a cue, so the engine parks it at opacity 0 until
     its act is live. Opacity alone does not remove a link from the tab order,
     which is the WCAG 4.1.2 failure of a keyboard user landing on something
     nobody can see. Mirror the engine's own opacity into inertness. */
  function syncCloseCta() {
    if (!closeCta) return;
    var op = closeCta.style.opacity;
    var hide = op !== '' && parseFloat(op) < 0.05;
    if (hide === ctaOff) return;
    ctaOff = hide;
    if (hide) closeCta.setAttribute('inert', ''); else closeCta.removeAttribute('inert');
  }

  function setLive(on) {
    if (on === live) return;
    live = on;
    glass.classList.toggle('is-live', on);
  }
  /* The panel holds a real CTA. A link nobody can see must not be tabbable
     (WCAG 4.1.2), so it comes back only once the panel is big enough to use. */
  function setInert(on) {
    if (on === inert) return;
    inert = on;
    if (on) { glass.setAttribute('inert', ''); glass.setAttribute('aria-hidden', 'true'); }
    else { glass.removeAttribute('inert'); glass.removeAttribute('aria-hidden'); }
    glass.style.pointerEvents = on ? 'none' : 'auto';
  }

  function render() {
    raf = 0;
    var vh = window.innerHeight, vw = window.innerWidth;
    var y = window.pageYOffset || document.documentElement.scrollTop;

    /* The peak owns the whole life of its stage on screen: one viewport before
       the pin (the film stage sliding away, which the glass hides because the
       still under it is the frame the film ended on) and the pinned travel.
       It deliberately stops at the pin rather than covering the exit slide too:
       stretched over the slide, the payoff sits still for a third of the page,
       and a peak you can hold at a standstill is not a peak. The dark beat the
       slide leaves behind is the breath before act 4. */
    var pTop = absTop(peak), pH = peak.offsetHeight;
    var g = clamp01((y - (pTop - vh)) / Math.max(pH, 1));

    setLive(g > 0 && g < 1);

    if (live) {
      if (reduce) {
        /* Every position change is dropped; opacity carries the reveal. */
        panel.style.left = '0px'; panel.style.top = '0px';
        panel.style.width = vw + 'px'; panel.style.height = vh + 'px';
        panel.style.opacity = '1';
        still.style.opacity = '0';
        setInert(false);
      } else {
        var f = ease(clamp01(g / FLIGHT));
        var q = quadRect(vw, vh);
        var l = q.l + (0 - q.l) * f;
        var t = q.t + (0 - q.t) * f;
        var w = q.w + (vw - q.w) * f;
        var h = q.h + (vh - q.h) * f;
        panel.style.left = l.toFixed(1) + 'px';
        panel.style.top = t.toFixed(1) + 'px';
        panel.style.width = w.toFixed(1) + 'px';
        panel.style.height = h.toFixed(1) + 'px';
        /* Hand off to act 4 on the same ground rather than cutting. */
        panel.style.opacity = String(1 - clamp01((g - 0.93) / 0.07));
        still.style.opacity = String(1 - f);
        setInert(f < 0.5);
      }
    } else {
      setInert(true);
    }

    /* The frame that never breaks. It arrives as the site takes the screen and
       stays for act 4, then act 5 pulls back out of the machine. */
    var jTop = absTop(join), jTravel = Math.max(join.offsetHeight - vh, 1);
    var c = clamp01((y - jTop) / jTravel);
    var on = clamp01((g - 0.55) / 0.23);
    var b = Math.min(g >= 1 ? 1 : on, 1 - ease(clamp01(c / 0.7)));
    bezel.style.opacity = b.toFixed(3);
    syncCloseCta();
    close.style.setProperty('--moor', ease(clamp01(c / 0.7)).toFixed(3));
  }

  function onScroll() { if (!raf) raf = requestAnimationFrame(render); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('orientationchange', onScroll);
  render();
})();
