/* Pre-launch fail-safes for anything still pointing at a placeholder endpoint
   (see PRELAUNCH.md).

   Two failure modes, both silent, and both worse on /pay than anywhere else
   because there the visitor is a client trying to pay or chase an invoice:

     1. A Formspree action still carrying a placeholder ID. A POST to it 404s —
        the visitor sees an error page and the submission is gone. Until a real
        endpoint is wired, hand the submission to the visitor's mail client with
        every field already filled in.
     2. The Stripe Customer Portal button still carrying REPLACE_PORTAL_LINK.
        Clicking it lands the client on a Stripe error page. Until the real
        login URL is set, point it at us instead and say so plainly.

   Each guard tests the live attribute, so the moment a real value is dropped in
   the handler steps aside and native behaviour resumes. No other change needed. */
(function () {
  'use strict';

  var MAIL = 'hello@designofman.com';
  var PLACEHOLDERS = ['YOUR_FORM_ID', 'REPLACE_FORM_ID'];

  /* ---------------------------------------------------------------- forms -- */

  function unconfigured(form) {
    var a = form.getAttribute('action') || '';
    if (a.indexOf('formspree.io/f/') === -1) return true;
    for (var i = 0; i < PLACEHOLDERS.length; i++) {
      if (a.indexOf(PLACEHOLDERS[i]) !== -1) return true;
    }
    return false;
  }

  /* Label text for a field, so the email reads like the form rather than like a
     list of input names. Falls back to the name attribute. */
  function labelFor(form, el) {
    var l = el.id ? form.querySelector('label[for="' + el.id + '"]') : null;
    if (!l) return el.name;
    var t = (l.textContent || '').replace(/\s+/g, ' ').replace(/\s*optional\s*$/i, '').trim();
    return t || el.name;
  }

  function bodyOf(form) {
    var out = [], trailing = '';
    var fields = form.querySelectorAll('input, textarea, select');
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      if (!el.name) continue;
      if (el.name.charAt(0) === '_') continue;             // _gotcha, _subject
      if (el.type === 'hidden' || el.type === 'submit') continue;
      var v = (el.value || '').trim();
      if (el.tagName === 'TEXTAREA') { trailing = v; continue; }
      out.push(labelFor(form, el) + ': ' + (v || '—'));
    }
    if (trailing) { out.push('', trailing); }
    return out.join('\n');
  }

  function subjectOf(form) {
    var s = form.querySelector('input[name="_subject"]');
    if (s && s.value) return s.value;
    return form.id === 'consultForm' ? 'Consult request' : 'Website enquiry';
  }

  function wire(form) {
    if (!form) return;
    form.addEventListener('submit', function (e) {
      if (!unconfigured(form)) return;                      // real endpoint — let it POST
      if (!form.reportValidity()) { e.preventDefault(); return; }
      e.preventDefault();

      var nameEl = form.querySelector('input[name="name"]');
      var who = nameEl ? nameEl.value.trim() : '';

      var note = form.querySelector('.form__note');
      if (note) {
        note.textContent = 'Opening your email app with this filled in. If nothing '
          + 'happens, send it to ' + MAIL + ' and we will pick it up from there.';
      }

      location.href = 'mailto:' + MAIL
        + '?subject=' + encodeURIComponent(subjectOf(form) + (who ? ' — ' + who : ''))
        + '&body=' + encodeURIComponent(bodyOf(form));
    });
  }

  wire(document.getElementById('consultForm'));
  wire(document.getElementById('resendForm'));

  /* ------------------------------------------------------- stripe portal -- */

  var portal = document.querySelector('a[href*="REPLACE_PORTAL_LINK"]');
  if (portal) {
    portal.setAttribute('href', 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent('Billing dashboard access')
      + '&body=' + encodeURIComponent(
          'Please send me the link to my billing dashboard.\n\n'
        + 'Business:\nEmail on the account:\n'));
    portal.textContent = 'Email us for your dashboard link';
    portal.removeAttribute('rel');

    var card = portal.parentNode;
    while (card && !(card.className && String(card.className).indexOf('card') !== -1)) {
      card = card.parentNode;
    }
    if (card && !card.querySelector('.portal-note')) {
      var p = document.createElement('p');
      p.className = 'form__note portal-note';
      p.setAttribute('role', 'status');
      p.textContent = 'Self-serve access is being switched on. Until then we send '
        + 'your dashboard link by hand, usually the same business day.';
      card.appendChild(p);
    }
  }
})();
