/* The ambient lighthouse loop. Deliberately separate from page.js: this is
   the one piece of homepage-only behaviour, and it is small enough that
   folding it into the shared file would make page.js homepage-aware for no
   reason.

   The poster (a real <img>, not just the video's poster attribute) is what
   actually paints first and is what a reduced-motion or save-data visitor
   sees permanently. The <video> only gets a src at all once the browser has
   said motion is welcome, so nobody pays for several megabytes of footage
   they will never see play. */
(function () {
  'use strict';

  var v = document.getElementById('heroVideo');
  if (!v) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));

  if (reduce || saveData) return; // poster stands in permanently

  /* A browser with no licensed H.264 decoder (mainly Firefox on Linux, and
     Chromium built without proprietary codecs) needs the .webm sibling of
     each source or the video never plays at all -- exactly the failure the
     film hero on this site was already built to avoid. */
  var wantsWebm = !v.canPlayType('video/mp4; codecs="avc1.640028"')
                && !!v.canPlayType('video/webm; codecs="vp9"');

  var sources = v.querySelectorAll('source[data-src]');
  Array.prototype.forEach.call(sources, function (s) {
    var src = s.getAttribute('data-src');
    s.setAttribute('src', wantsWebm ? src.replace('.mp4', '.webm') : src);
  });

  v.addEventListener('playing', function () { v.classList.add('is-ready'); }, { once: true });
  v.load();
  var p = v.play();
  if (p && p.catch) p.catch(function () { /* autoplay blocked -- poster stands in */ });
})();
