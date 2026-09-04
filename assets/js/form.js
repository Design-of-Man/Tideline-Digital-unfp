/* The forms, and the one billing button that still has no real destination.
 *
 * The forms post to /api/contact (api/contact.mjs) on our own origin. This
 * file is an enhancement over that, never a requirement: with it off, the
 * browser submits natively and the function answers with a 303. With it on,
 * the submission goes as JSON, the visitor stays on the page, and a failure
 * is said out loud instead of being swallowed.
 *
 * The mailto: path that used to be the primary route is still here, but only
 * where it belongs: as the fallback after the endpoint has actually failed.
 * It loses anyone with no mail client configured, which is why it is no
 * longer the first thing tried.
 */
(function () {
  'use strict';

  var MAIL = 'hello@designofman.com';

  /* Field label text, so a fallback email reads like the form rather than
     like a list of input names. */
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
      if (!el.name || el.name.charAt(0) === '_') continue;
      if (el.type === 'hidden' || el.type === 'submit') continue;
      var v = (el.value || '').trim();
      if (el.tagName === 'TEXTAREA') { trailing = v; continue; }
      out.push(labelFor(form, el) + ': ' + (v || '—'));
    }
    if (trailing) out.push('', trailing);
    return out.join('\n');
  }

  function note(form) {
    return form.querySelector('.form__note');
  }

  function say(form, msg, tone) {
    var n = note(form);
    if (!n) return;
    n.textContent = msg;
    n.setAttribute('data-tone', tone || '');
  }

  /* Last resort, and only after the endpoint has failed. */
  function handToMailClient(form) {
    var nameEl = form.querySelector('input[name="name"]');
    var who = nameEl ? nameEl.value.trim() : '';
    var subject = form.id === 'resendForm' ? 'Invoice resend request' : 'Consult request';
    say(form, 'We could not send that from here. Opening your email app with it filled '
            + 'in — if nothing happens, send it to ' + MAIL + ' and we will pick it up.', 'warn');
    location.href = 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent(subject + (who ? ' — ' + who : ''))
      + '&body=' + encodeURIComponent(bodyOf(form));
  }

  function wire(form) {
    if (!form) return;

    /* Stamp the load time. The endpoint drops anything returned in under two
       seconds; a person cannot fill this in that fast and a script usually
       does. Stamped here rather than rendered into the HTML so a cached page
       does not carry a stale timestamp. */
    var t = form.querySelector('input[name="_t"]');
    if (t) t.value = String(Date.now());

    if (!window.fetch) return;                        // native POST still works

    form.addEventListener('submit', function (e) {
      if (!form.reportValidity()) { e.preventDefault(); return; }
      e.preventDefault();

      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      say(form, 'Sending…', '');

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; });
      }).then(function (res) {
        if (res.ok && res.body && res.body.ok) {
          form.reset();
          if (t) t.value = String(Date.now());
          say(form, form.id === 'resendForm'
            ? 'Sent. We will resend the invoice to the email on your account, usually within a business day.'
            : 'Sent. We reply within one business day, from the person who would do the work.', 'ok');
          if (btn) btn.textContent = 'Sent';
          return;
        }
        if (btn) { btn.disabled = false; btn.textContent = label; }
        /* 422 is the visitor's own input and is theirs to correct. Anything
           else is our fault, so fall through to the mail client. */
        if (res.status === 422 && res.body && res.body.error) {
          say(form, res.body.error, 'warn');
          return;
        }
        handToMailClient(form);
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        handToMailClient(form);
      });
    });
  }

  wire(document.getElementById('consultForm'));
  wire(document.getElementById('resendForm'));

  /* A visitor arriving back from the no-JavaScript 303 gets the same
     confirmation the fetch path shows. */
  if (/[?&]sent=1(&|$)/.test(location.search)) {
    var f = document.getElementById('consultForm');
    if (f) say(f, 'Sent. We reply within one business day, from the person who would do the work.', 'ok');
  }

  /* ------------------------------------------------------- stripe portal --
     Still a placeholder: the Customer Portal login URL is issued by Stripe
     and nobody can invent it. Until it is set, clicking through would land a
     paying client on a Stripe error page, so the button is rewritten to reach
     us instead. The guard tests the live attribute, so dropping the real URL
     into build_pay.py turns all of this off by itself. */
  var portal = document.querySelector('a[href*="REPLACE_PORTAL_LINK"]');
  if (portal) {
    portal.setAttribute('href', 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent('Billing dashboard access')
      + '&body=' + encodeURIComponent(
          'Please send me the link to my billing dashboard.\n\nBusiness:\nEmail on the account:\n'));
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
      p.textContent = 'Self-serve access is being switched on. Until then we send your '
        + 'dashboard link by hand, usually the same business day.';
      card.appendChild(p);
    }
  }
})();
