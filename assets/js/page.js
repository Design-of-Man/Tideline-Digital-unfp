/* Interior pages. They declare no [data-sc-act], so mounting the engine here
   buys the reveal observer and the magnet/spotlight helpers and nothing else.
   Everything bespoke to a document page lives below the mount. */
(function () {
  'use strict';

  if (window.ScrollCraft && ScrollCraft.mount) ScrollCraft.mount(document.body);

  /* BEFORE / AFTER.
     The control is a real <input type="range"> lying invisibly over the frame,
     so the comparison works with a mouse, a finger, arrow keys and a screen
     reader without a line of pointer-event code. All this listener does is
     copy the value into the custom property the clip-path reads. Pages with no
     comparison get an empty NodeList and this costs nothing. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-ba]'), function (ba) {
    var input = ba.querySelector('.ba__range');
    if (!input) return;
    function paint() { ba.style.setProperty('--split', input.value + '%'); }
    input.addEventListener('input', paint);
    paint();
  });
})();
