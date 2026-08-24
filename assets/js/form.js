/* Form delivery, and the copy that has to match it.

   This file is the merge of two efforts that arrived at once, and both halves
   are kept because each covers what the other misses.

   FROM THE PRE-LAUNCH FAIL-SAFES: coverage. Every form on the site is wired,
   not just the consult form — #resendForm on /pay matters most, because there
   the visitor is a client chasing an invoice. The Stripe portal button carrying
   REPLACE_PORTAL_LINK is guarded too, and the email body is built from each
   field's own label so it reads like the form rather than a list of input names.

   FROM THE FORMSUBMIT WIRING: an endpoint that actually delivers, and the check
   that makes its one failure mode impossible to miss.

   THE ENDPOINT is FormSubmit, so we do not add a fourth service — three client
   sites already use it. Its documented failure is that it accepts submissions to
   an unactivated address with HTTP 200 and a body of {"success":"false"}. A
   handler that checks r.ok sees a 200, shows a thank-you, and the lead is gone
   with nobody aware. Two client sites check r.ok and cannot detect this. So the
   check here is on the BODY, not the status:

       String(data.success) === 'true'

   String() because FormSubmit returns that field as a string in some responses
   and a real boolean in others; comparing === 'true' against a raw boolean would
   read every success as a failure. Anything that is not an explicit success —
   a network error, an unreadable body, a 200 saying success:false — is a failure,
   and the visitor gets the mailto path with their answers preserved rather than a
   thank-you the submission did not earn.

   A FORM STILL ON A PLACEHOLDER never reaches the network at all. It goes
   straight to mail, because a POST to formspree.io/f/YOUR_FORM_ID 404s and an
   error page is worse than an email client. That is still true of /pay's
   #resendForm, which has no real endpoint yet.

   NO-JAVASCRIPT: a wired form's action is FormSubmit's normal endpoint rather
   than the /ajax/ one, so a visitor without JavaScript posts natively and gets
   FormSubmit's own response — an unactivated address is visible to them too. The
   /ajax/ endpoint is used only by the handler below.

   Every guard tests the live attribute, so dropping a real value in makes the
   handler step aside without any other change. */
(function () {
  'use strict';

  var MAIL = 'hello@designofman.com';
  var AJAX = 'https://formsubmit.co/ajax/' + MAIL;
  var PLACEHOLDERS = ['YOUR_FORM_ID', 'REPLACE_FORM_ID', 'REPLACE_'];

  /* ---------------------------------------------------------------- forms -- */

  /** A form whose action still carries a placeholder cannot deliver anywhere. */
  function onPlaceholder(form) {
    var a = form.getAttribute('action') || '';
    for (var i = 0; i < PLACEHOLDERS.length; i++) {
      if (a.indexOf(PLACEHOLDERS[i]) !== -1) return true;
    }
    return false;
  }

  /** A form pointed at FormSubmit, which the AJAX path below can actually use. */
  function onFormSubmit(form) {
    return (form.getAttribute('action') || '').indexOf('formsubmit.co/') !== -1;
  }

  /* Label text for a field, so the email reads like the form rather than like a
     list of input names. Falls back to the name attribute. */
  function labelFor(form, el) {
    var l = el.id ? form.querySelector('label[for="' + el.id + '"]') : null;
    if (!l) return el.name;
    var t = (l.textContent || '').replace(/\s+/g, ' ').replace(/\s*optional\s*$/i, '').trim();
    return t || el.name;
  }

  function fieldsOf(form) {
    var out = [], trailing = '', pairs = {};
    var fields = form.querySelectorAll('input, textarea, select');
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      if (!el.name) continue;
      if (el.name.charAt(0) === '_') continue;             // _honey, _subject, _template
      if (el.type === 'hidden' || el.type === 'submit') continue;
      var v = (el.value || '').trim();
      pairs[el.name] = v;
      if (el.tagName === 'TEXTAREA') { trailing = v; continue; }
      out.push(labelFor(form, el) + ': ' + (v || '—'));
    }
    if (trailing) { out.push('', trailing); }
    return { text: out.join('\n'), pairs: pairs };
  }

  function subjectOf(form) {
    var s = form.querySelector('input[name="_subject"]');
    if (s && s.value) return s.value;
    return form.id === 'consultForm' ? 'Consult request' : 'Website enquiry';
  }

  function mailtoHref(form) {
    var nameEl = form.querySelector('input[name="name"]');
    var who = nameEl ? nameEl.value.trim() : '';
    return 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent(subjectOf(form) + (who ? ' — ' + who : ''))
      + '&body=' + encodeURIComponent(fieldsOf(form).text);
  }

  function noteOf(form) { return form.querySelector('.form__note'); }

  function say(form, html) {
    var n = noteOf(form);
    if (n) n.innerHTML = html;
  }

  function toMail(form, lead) {
    say(form, lead + ' Your answers are ready in an email instead — '
      + '<a href="' + mailtoHref(form) + '">open it here</a>, or write to '
      + '<a href="mailto:' + MAIL + '">' + MAIL + '</a>.');
  }

  function wire(form) {
    if (!form) return;
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button ? button.textContent : '';

    form.addEventListener('submit', function (e) {
      /* A real endpoint that is not FormSubmit: let the browser post it natively
         rather than guessing at another service's response shape. */
      if (!onPlaceholder(form) && !onFormSubmit(form)) return;

      if (!form.reportValidity()) { e.preventDefault(); return; }
      e.preventDefault();

      if (onPlaceholder(form)) {
        say(form, 'Opening your email app with this filled in. If nothing happens, send it to '
          + MAIL + ' and we will pick it up from there.');
        location.href = mailtoHref(form);
        return;
      }

      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      say(form, 'Sending…');

      var payload = fieldsOf(form).pairs;
      payload._subject = subjectOf(form) + ' from designofman.com';
      payload._template = 'table';

      fetch(AJAX, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return null; });
      }).then(function (data) {
        /* The whole point. Not r.ok — the body. */
        if (data && String(data.success) === 'true') {
          say(form, 'Sent. It is in our inbox at ' + MAIL + '.');
          if (button) { button.disabled = true; button.textContent = 'Sent'; }
          form.reset();
          return;
        }
        /* A 200 with success:false is the unactivated-address state. Name it —
           it is a thing we can fix, and the visitor should not be left guessing. */
        if (button) { button.disabled = false; button.textContent = buttonText; }
        toMail(form, data
          ? 'That did not send — the form service did not accept it.'
          : 'That did not send — no readable response.');
      }).catch(function () {
        if (button) { button.disabled = false; button.textContent = buttonText; }
        toMail(form, 'That did not send — the request did not complete.');
      });
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
