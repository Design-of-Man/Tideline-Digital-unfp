/* Design of Man — site.js
   Every interaction on every page. No framework: one scroll loop reads the
   position once per frame and hands it to whichever scroll-driven pieces
   exist on the page, so nothing measures layout inside the loop.

   Contract with the markup:
     - html.js is set in <head>; without it everything is simply visible.
     - html.reduce is set here when the visitor asks for reduced motion; the
       CSS then releases every hidden state and nothing pins or scrubs. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) doc.classList.add('reduce');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var vh = innerHeight, vw = innerWidth;

  /* ------------------------------------------------------ smooth scroll -- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.095, wheelMultiplier: 1, smoothWheel: true });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -80, duration: 1.6, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#top') { e.preventDefault(); scrollToTarget(0); return; }
    var t = id.length > 1 && document.getElementById(id.slice(1));
    if (!t) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(t);
    history.replaceState(null, '', id);
    setTimeout(function () { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }, reduce ? 0 : 900);
  });

  /* -------------------------------------------------------------- clock -- */
  var clocks = $$('[data-clock]');
  if (clocks.length) {
    var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    var tick = function () {
      var s = fmt.format(new Date());
      clocks.forEach(function (c) { c.textContent = s; });
    };
    tick(); setInterval(tick, 15000);
  }

  /* ---------------------------------------------------------- split text -- */
  /* Wrap every word of a heading in a mask, keeping inline elements (em,
     br, spans) where they are. Text nodes are replaced in place, so a
     screen reader still reads the same words in the same order. */
  $$('[data-split]').forEach(function (el) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var outer = document.createElement('span');
            outer.className = 'sw';
            var inner = document.createElement('span');
            inner.textContent = p;
            inner.style.setProperty('--w', n++);
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
  });

  /* Statement paragraphs that brighten word by word as they are read. */
  var scrubbers = $$('[data-scrub]').map(function (el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'wd'; s.textContent = p;
            words.push(s); frag.appendChild(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    })(el);
    return { el: el, words: words, top: 0, h: 0 };
  });

  /* ------------------------------------------------------------- reveal -- */
  var held = [];           // hero pieces wait for the preloader to clear
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target.__reveal || en.target;
      el.classList.add('is-in');
      io.unobserve(en.target);
      if (el.hasAttribute('data-count')) countUp(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  $$('[data-reveal], [data-split], [data-count]').forEach(function (el) {
    if (reduce || !io) { el.classList.add('is-in'); return; }
    if (el.closest('[data-hold]')) { held.push(el); return; }
    /* A clip-path reveal starts fully clipped, and a fully clipped element
       never reports as intersecting, so watch its parent instead. */
    if (el.getAttribute('data-reveal') === 'clip' && el.parentElement) {
      el.parentElement.__reveal = el; io.observe(el.parentElement); return;
    }
    io.observe(el);
  });
  function releaseHeld() {
    held.forEach(function (el) { el.classList.add('is-in'); if (el.hasAttribute('data-count')) countUp(el); });
    held = [];
  }

  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = pre + to + suf; return; }
    var t0 = performance.now(), dur = 1800;
    (function step(t) {
      var k = clamp((t - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + Math.round(to * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------------------------------------------------------- preloader -- */
  var pre = $('.pre');
  function finishIntro() { releaseHeld(); doc.classList.remove('pre-on'); }
  if (pre && doc.classList.contains('pre-on') && !reduce) {
    var count = $('.pre__count b', pre);
    var poster = $('.hero__media img');
    var ready = false, shown = 0, t0 = performance.now();
    var markReady = function () { ready = true; };
    if (!poster || poster.complete) markReady();
    else { poster.addEventListener('load', markReady); poster.addEventListener('error', markReady); }
    setTimeout(markReady, 2200);       // never hold a visitor hostage to a slow image
    if (lenis) lenis.stop();
    (function loop(t) {
      var elapsed = t - t0;
      var cap = ready ? 100 : Math.min(88, elapsed / 18);
      shown += (cap - shown) * 0.09 + 0.25;
      shown = Math.min(shown, cap);
      count.textContent = String(Math.floor(shown)).padStart(3, '0');
      if (shown >= 99.5 && elapsed > 900) {
        count.textContent = '100';
        try { sessionStorage.setItem('dom.intro.seen', '1'); } catch (e) {}
        pre.classList.add('is-out');
        setTimeout(function () { if (lenis) lenis.start(); finishIntro(); }, 380);
        setTimeout(function () { pre.remove(); }, 1200);
        return;
      }
      requestAnimationFrame(loop);
    })(t0);
  } else {
    if (pre) pre.remove();
    finishIntro();
  }

  /* ---------------------------------------------------------- hero video -- */
  var vid = $('#heroVideo');
  if (vid) {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));
    if (!reduce && !saveData) {
      /* No licensed H.264 decoder (Firefox on some Linux builds, codec-
         stripped Chromium): take the WebM sibling or it never plays. */
      var webm = !vid.canPlayType('video/mp4; codecs="avc1.640028"') && !!vid.canPlayType('video/webm; codecs="vp9"');
      $$('source[data-src]', vid).forEach(function (s) {
        var src = s.getAttribute('data-src');
        s.setAttribute('src', webm ? src.replace('.mp4', '.webm') : src);
        s.setAttribute('type', webm ? 'video/webm' : 'video/mp4');
      });
      vid.addEventListener('playing', function () { vid.classList.add('is-ready'); }, { once: true });
      vid.load();
      var p = vid.play();
      if (p && p.catch) p.catch(function () {});
      /* Stop paying for decode once the hero is off screen. */
      if (io) new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); }
        else vid.pause();
      }).observe(vid);
    }
  }

  /* ------------------------------------------------------------- header -- */
  var hdr = $('.hdr');
  var darkZones = $$('[data-dark]');
  var lastY = 0;
  var menu = $('#menu'), menuBtn = $('.menu-btn');

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
    doc.style.overflow = 'hidden';
    setTimeout(function () { var f = $('a', menu); if (f) f.focus(); }, 350);
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
    doc.style.overflow = '';
    menuBtn.focus();
  }
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  $$('[data-close-menu]').forEach(function (b) { b.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
    if (e.key === 'Tab' && menu && menu.classList.contains('is-open')) {
      var f = $$('a, button', menu), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ------------------------------------------------- scroll-driven parts -- */
  var heroWrap = $('.hero-wrap');
  var heroFrame = $('.hero__frame'), heroMedia = $('.hero__media'), heroContent = $('.hero__content'), heroCap = $('.hero__caption');
  var progressBar = $('.hdr .progress');
  var hpin = $('.hpin');
  var rail = $('.tl');
  var tlItems = $$('.tl__item');
  var tocLinks = $$('.toc a');
  var pinOK = function () { return !reduce && vw > 900 && vh > 560; };

  var M = {};   // cached measurements, refreshed on resize only
  function measure() {
    vh = innerHeight; vw = innerWidth;
    var sy = scrollY;
    var top = function (el) { return el.getBoundingClientRect().top + sy; };
    if (heroWrap) M.hero = { top: top(heroWrap), h: heroWrap.offsetHeight };
    scrubbers.forEach(function (s) { s.top = top(s.el); s.h = s.el.offsetHeight; });
    if (hpin) {
      var track = $('.hpin__track', hpin);
      if (pinOK()) {
        hpin.classList.add('is-pinned');
        var dist = Math.max(0, track.scrollWidth - track.parentNode.clientWidth + 0);
        hpin.style.setProperty('--hpin-h', (dist + vh * 1.15) + 'px');
        M.pin = { top: top(hpin), h: dist + vh * 1.15, dist: dist, track: track, bar: $('.hpin__bar i', hpin) };
        M.lastPp = -1;
      } else {
        hpin.classList.remove('is-pinned');
        hpin.style.removeProperty('--hpin-h');
        track.style.transform = '';
        M.pin = null;
      }
    }
    if (rail) M.rail = { top: top(rail), h: rail.offsetHeight };
    M.items = tlItems.map(function (it) { return top(it); });
    M.zones = darkZones.map(function (z) { return { top: top(z), bottom: top(z) + z.offsetHeight, clear: z.hasAttribute('data-clear') }; });
    M.toc = tocLinks.map(function (a) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      return t ? top(t) : 0;
    });
    M.docH = doc.scrollHeight;
    M.lastHp = -1;
    scrubbers.forEach(function (s) { s.lastP = -1; });
    beamOrigins();
  }

  function onScroll() {
    var y = scrollY;

    /* header: solid once off the top, hidden going down, back going up,
       and light-on-dark over any section that says it is dark. */
    if (hdr) {
      var probe = y + 36, onDark = false, clear = false;
      for (var i = 0; i < M.zones.length; i++) {
        var z = M.zones[i];
        if (probe >= z.top && probe < z.bottom) { onDark = true; clear = z.clear && y < z.bottom - vh * 1.05; break; }
      }
      hdr.classList.toggle('on-dark', onDark);
      hdr.classList.toggle('is-solid', y > 30 && !clear);
      var menuOpen = menu && menu.classList.contains('is-open');
      if (!menuOpen) hdr.classList.toggle('is-hidden', y > lastY && y > vh * 0.6 && !hdr.contains(document.activeElement));
      if (progressBar) progressBar.style.transform = 'scaleX(' + clamp(y / Math.max(1, M.docH - vh), 0, 1).toFixed(4) + ')';
    }
    lastY = y;

    /* Each piece writes only when its value actually changed, straight onto
       the element it moves. Writing an inherited custom property to a parent
       instead would restyle its whole subtree every frame. */
    if (M.hero && !reduce) {
      var hp = Math.round(clamp((y - M.hero.top) / Math.max(1, M.hero.h - vh), 0, 1) * 1000) / 1000;
      if (hp !== M.lastHp) {
        M.lastHp = hp;
        heroFrame.style.clipPath = hp ? 'inset(' + (hp * 7).toFixed(2) + '% ' + (hp * 5).toFixed(2) + '% ' + (hp * 13).toFixed(2) + '% round ' + (hp * 2.2).toFixed(2) + 'rem)' : '';
        heroMedia.style.transform = 'scale(' + (1.08 - hp * 0.08).toFixed(4) + ')';
        heroContent.style.opacity = clamp(1 - hp * 1.6, 0, 1).toFixed(3);
        heroContent.style.transform = hp ? 'translate3d(0,' + (-hp * 9).toFixed(2) + 'vh,0)' : '';
        heroContent.style.visibility = hp > 0.7 ? 'hidden' : '';
        if (heroCap) heroCap.style.opacity = clamp((hp - 0.55) * 3, 0, 1).toFixed(3);
      }
    }

    scrubbers.forEach(function (s) {
      var start = s.top - vh * 0.82, end = s.top + s.h - vh * 0.42;
      var p = clamp((y - start) / Math.max(1, end - start), 0, 1);
      if (p === s.lastP) return;
      s.lastP = p;
      var n = s.words.length, lit = p * (n + 6);
      for (var k = 0; k < n; k++) {
        var o = Math.round(clamp((lit - k) / 6, 0.16, 1) * 50) / 50;
        if (s.words[k].__o !== o) { s.words[k].__o = o; s.words[k].style.opacity = o; }
      }
    });

    if (M.pin) {
      var pp = Math.round(clamp((y - M.pin.top) / Math.max(1, M.pin.h - vh), 0, 1) * 2000) / 2000;
      if (pp !== M.lastPp) {
        M.lastPp = pp;
        M.pin.track.style.transform = 'translate3d(' + (-pp * M.pin.dist).toFixed(1) + 'px,0,0)';
        M.pin.bar.style.transform = 'scaleX(' + pp + ')';
      }
    }

    if (M.rail) {
      var mid = y + vh * 0.55;
      rail.style.setProperty('--tp', clamp((mid - M.rail.top) / M.rail.h, 0, 1).toFixed(4));
      M.items.forEach(function (t, j) { tlItems[j].classList.toggle('is-in', mid > t + 40); });
    }

    if (tocLinks.length) {
      var on = 0;
      M.toc.forEach(function (t, j) { if (y + vh * 0.3 >= t) on = j; });
      tocLinks.forEach(function (a, j) { a.classList.toggle('is-on', j === on); });
    }
  }

  var ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }
  if (lenis) lenis.on('scroll', requestTick);
  addEventListener('scroll', requestTick, { passive: true });
  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); onScroll(); }, 120);
  });
  addEventListener('load', function () { measure(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); onScroll(); });
  measure(); onScroll();

  /* ------------------------------------------------------------- marquee -- */
  $$('.marquee').forEach(function (m) {
    var track = $('.marquee__track', m);
    var group = $('.marquee__group', m);
    if (!track || !group || reduce) return;
    var x = 0, dir = -1, w = group.offsetWidth, last = scrollY, boost = 0, visible = true;
    addEventListener('resize', function () { w = group.offsetWidth; });
    if (io) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(m);
    var base = parseFloat(m.getAttribute('data-speed') || '0.6');
    (function loop() {
      var y = scrollY, dy = y - last; last = y;
      if (dy !== 0) dir = dy > 0 ? -1 : 1;
      boost += (Math.min(Math.abs(dy), 80) * 0.12 - boost) * 0.1;
      if (visible) {
        x += dir * (base + boost);
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      }
      requestAnimationFrame(loop);
    })();
  });

  /* ------------------------------------------------- services accordion -- */
  $$('.svc__row').forEach(function (row, i) {
    var btn = $('.svc__btn', row), panel = $('.svc__panel', row);
    var set = function (open) {
      row.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    };
    set(i === 0);
    btn.addEventListener('click', function () {
      var open = !row.classList.contains('is-open');
      $$('.svc__row').forEach(function (r) {
        if (r !== row && r.classList.contains('is-open')) {
          r.classList.remove('is-open');
          $('.svc__btn', r).setAttribute('aria-expanded', 'false');
          $('.svc__panel', r).setAttribute('inert', '');
        }
      });
      set(open);
      setTimeout(measure, 850);
    });
  });

  /* ----------------------------------------------------------------- faq -- */
  $$('.qa').forEach(function (d) {
    var sum = $('summary', d), body = $('.qa__a', d);
    if (!sum || !body || reduce) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      var opening = !d.open;
      if (opening) d.open = true;
      var h = body.scrollHeight;
      var a = body.animate(
        opening ? [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }]
                : [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
      a.onfinish = function () { if (!opening) d.open = false; delete d.dataset.busy; measure(); };
    });
  });

  /* ------------------------------------------------------- before/after -- */
  $$('[data-ba]').forEach(function (ba) {
    var r = $('.ba__range', ba);
    var set = function () { ba.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', set); set();
  });

  /* ---------------------------------------------- spotlight and magnet -- */
  if (finePointer) {
    $$('.tile, .plan').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - b.left) + 'px');
        el.style.setProperty('--my', (e.clientY - b.top) + 'px');
      });
    });
    if (!reduce) $$('[data-magnet]').forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-magnet')) || 0.3;
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
        el.style.transform = 'translate3d(' + (dx * k).toFixed(1) + 'px,' + (dy * k).toFixed(1) + 'px,0)';
        el.style.transition = 'transform .25s cubic-bezier(.16,1,.3,1), color .5s cubic-bezier(.16,1,.3,1)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
        el.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1), color .5s cubic-bezier(.16,1,.3,1)';
      });
    });
  }

  /* ---------------------------------------------------------------- beam -- */
  /* The lit copy is masked by a cone whose apex has to sit on the lamp, so
     each lit block is told where the lamp is in its own coordinates. */
  if (io) $$('.beam').forEach(function (b) {
    new IntersectionObserver(function (en) { b.classList.toggle('is-live', en[0].isIntersecting); }).observe(b);
  });
  function beamOrigins() {
    $$('.beam').forEach(function (b) {
      var lamp = $('.beam__lamp', b);
      var bb = b.getBoundingClientRect();
      var lb = lamp ? lamp.getBoundingClientRect() : null;
      var ox = lb ? lb.left + lb.width / 2 : bb.left + bb.width / 2;
      var oy = lb ? lb.top + lb.height * 0.16 : bb.bottom;
      b.style.setProperty('--ox', (ox - bb.left) + 'px');
      b.style.setProperty('--oy', (oy - bb.top) + 'px');
      $$('.lit', b).forEach(function (l) {
        var r = l.getBoundingClientRect();
        l.style.setProperty('--mx', (ox - r.left) + 'px');
        l.style.setProperty('--my', (oy - r.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------------- form -- */
  var MAIL = 'hello@designofman.com';
  $$('form[data-contact]').forEach(function (form) {
    var note = $('.form__note', form);
    var noteText = note ? note.innerHTML : '';

    var kinds = $$('input[name="kind"]', form);
    var projectField = $('[data-for="project"]', form);
    var sync = function () {
      var q = form.querySelector('input[name="kind"]:checked');
      var isQ = q && q.value === 'question';
      if (projectField) {
        projectField.hidden = isQ;
        var sel = $('select', projectField);
        if (sel) sel.required = !isQ;
      }
    };
    kinds.forEach(function (k) { k.addEventListener('change', sync); }); sync();

    if (/[?&]sent=1/.test(location.search)) showSent(form);

    form.addEventListener('submit', function (e) {
      if (!window.fetch) return;           // native POST; /api/contact redirects to _next
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (data.kind === 'question') data.project = 'Just a question';
      delete data.kind; delete data._next;
      form.classList.add('is-sending');
      setNote('Sending…', '');
      data.source = /^\/contact/.test(location.pathname) ? 'contact-page' : 'home';
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, j: j }; });
      }).then(function (res) {
        form.classList.remove('is-sending');
        /* /api/contact answers {"success":"true"} only once the enquiry was
           stored or emailed. The body decides, never the status alone. */
        if (res.j && String(res.j.success) === 'true') { showSent(form); return; }
        fallback(data);
      }).catch(function () {
        form.classList.remove('is-sending');
        fallback(data);
      });
    });

    function setNote(html, cls) {
      if (!note) return;
      note.className = 'form__note' + (cls ? ' ' + cls : '');
      note.innerHTML = html;
    }
    /* The form never claims success for a message that did not arrive. If
       the endpoint is down or not yet connected, the visitor gets the whole
       message handed to their own mail app, addressed and filled in. */
    function fallback(d, why) {
      var lines = ['Name: ' + (d.name || ''), 'Email: ' + (d.email || '')];
      if (d.company) lines.push('Business: ' + d.company);
      if (d.project) lines.push('Needs: ' + d.project);
      lines.push('', d.message || '');
      var href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Website enquiry' + (d.name ? ' — ' + d.name : '')) + '&body=' + encodeURIComponent(lines.join('\n'));
      setNote((why ? escapeHtml(why) + ' ' : 'That did not go through. ') + '<a href="' + href + '">Send it from your email app instead</a> — everything you typed is already in it.', 'is-err');
    }
    function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    void noteText;
  });

  function showSent(form) {
    var box = document.createElement('div');
    box.className = 'sent';
    box.setAttribute('role', 'status');
    box.innerHTML = '<h3>Got it. Thank you.</h3><p>A real person reads every message. Expect a reply within one business day, usually sooner. If it is urgent, call (561) 324-1658.</p>';
    form.innerHTML = '';
    form.appendChild(box);
  }
})();
