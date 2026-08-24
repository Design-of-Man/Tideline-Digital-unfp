/* Contact form fail-safe, and the copy that has to match it.
   The Formspree action still carries a placeholder ID (see PRELAUNCH.md), and a
   POST to it 404s — the visitor sees an error page and the lead is gone. Until a
   real endpoint is wired, hand the submission to the visitor's mail client with
   every field already filled in, so nothing is silently dropped. Once the action
   is a real Formspree URL this handler steps aside and the native POST runs.

   The note under the form is now set from the same check that decides the
   behaviour, rather than being written into the HTML and left to rot. Two states,
   one source of truth: setting the real ID changes what the form does AND what it
   claims, in the same moment. The alternative — static copy plus a separate edit
   later — is how a page ends up promising delivery it can no longer make, or,
   once wired, telling people to open their email app when it no longer does that.

   Neither string promises a reply time. How fast we answer is a commitment we
   make, not something a form can guarantee, and the two were previously conflated
   in copy sitting directly above a form that could not deliver at all. */
(function () {
  'use strict';
  var form = document.getElementById('consultForm');
  if (!form) return;

  var MAIL = 'hello@designofman.com';

  function configured() {
    var a = form.getAttribute('action') || '';
    return a.indexOf('formspree.io/f/') !== -1 && a.indexOf('YOUR_FORM_ID') === -1;
  }

  var note = form.querySelector('.form__note');

  /* Set the claim to match the behaviour, before anyone reads it. The HTML ships
     with the unconfigured wording, so a visitor with JavaScript off sees the more
     cautious of the two — which is also the true one for them, since the mailto
     handler is precisely what they do not have. */
  if (note && configured()) {
    note.innerHTML = 'Goes straight to <a href="mailto:' + MAIL + '">' + MAIL + '</a>.';
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

    if (note) {
      note.textContent = 'Opening your email app with this filled in. If nothing '
        + 'happens, send it to ' + MAIL + ' and we will pick it up from there.';
    }

    location.href = 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent('Consult request' + (name ? ' — ' + name : ''))
      + '&body=' + encodeURIComponent(body);
  });
})();
