/* The fixed header carries a gradient ground that fades to transparent at its
   lower edge. That reads well over the film, but a heading scrolling past it
   painted straight through the nav — "Design of Man" and an <h2> occupying the
   same pixels. Past the first fold the bar takes a solid ground instead, and
   the gradient stands down. */
(function () {
  'use strict';

  var bar = document.querySelector('.bar');
  if (!bar) return;

  var solid = false, ticking = false;

  function read() {
    ticking = false;
    var want = (window.scrollY || window.pageYOffset) > 24;
    if (want === solid) return;
    solid = want;
    bar.classList.toggle('bar--solid', want);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(read);
  }

  addEventListener('scroll', onScroll, { passive: true });
  read();
})();
