/* Contact form fail-safe.
   The Formspree action still carries a placeholder ID (see PRELAUNCH.md), and a
   POST to it 404s — the visitor sees an error page and the lead is gone. Until a
   real endpoint is wired, hand the submission to the visitor's mail client with
   every field already filled in, so nothing is silently dropped. Once the action
   is a real Formspree URL this handler steps aside and the native POST runs. */
(function () {
  'use strict';
  var form = document.getElementById('consultForm');
  if (!form) return;

  var MAIL = 'hello@designofman.com';

  function configured() {
    var a = form.getAttribute('action') || '';
    return a.indexOf('formspree.io/f/') !== -1 && a.indexOf('YOUR_FORM_ID') === -1;
  }

  form.addEventListener('submit', function (e) {
    if (configured()) return;
    if (!form.reportValidity()) { e.preventDefault(); return; }
    e.preventDefault();

    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    var name = val('cf-name');
    var body = [
      'Name: ' + name,
      'Email: ' + val('cf-email'),
      'Business: ' + (val('cf-company') || '—'),
      'Looking for: ' + val('cf-project'),
      '',
      val('cf-message')
    ].join('\n');

    var note = form.querySelector('.form__note');
    if (note) {
      note.textContent = 'Opening your email app with this filled in. If nothing '
        + 'happens, send it to ' + MAIL + ' and we will pick it up from there.';
    }

    location.href = 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent('Consult request' + (name ? ' — ' + name : ''))
      + '&body=' + encodeURIComponent(body);
  });
})();
