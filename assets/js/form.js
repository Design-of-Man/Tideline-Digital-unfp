/* Contact form delivery, and the copy that has to match it.

   FormSubmit, chosen so we do not add a fourth service — three client sites
   already use it. It has one documented failure mode and this file exists mostly
   to make that failure impossible to miss.

   THE FAILURE: FormSubmit accepts submissions to an unactivated address with
   HTTP 200 and a body of {"success":"false"}. A handler that checks r.ok sees a
   200, shows a thank-you, and the lead is gone with nobody aware. Two client
   sites check r.ok and cannot detect this. That pattern is not repeated here.

   So the check below is on the BODY, not the status:

       String(data.success) === 'true'

   String() because FormSubmit returns the boolean as a string in some responses
   and a real boolean in others; === 'true' against a raw boolean would read every
   successful submission as a failure, and == would read the string "false" as
   truthy in neither direction reliably. Compare the stringified value.

   Anything that is not an explicit success is treated as a failure, including a
   network error, a non-JSON body, and a 200 that says success:false. The visitor
   is then handed the mailto path with their answers preserved, rather than a
   thank-you the submission did not earn.

   NO-JAVASCRIPT PATH: the form's action is FormSubmit's normal endpoint, not the
   /ajax/ one, so a visitor without JavaScript posts natively and gets FormSubmit's
   own response page. An unactivated address is visible to them too. The /ajax/
   endpoint is used only by the handler below.

   The note under the form is set from the same state that decides behaviour, so
   the copy cannot drift from what the form actually does. */
(function () {
  'use strict';
  var form = document.getElementById('consultForm');
  if (!form) return;

  var MAIL = 'hello@designofman.com';
  var AJAX = 'https://formsubmit.co/ajax/' + MAIL;

  var note = form.querySelector('.form__note');
  var button = form.querySelector('button[type="submit"]');

  function placeholder() {
    var a = form.getAttribute('action') || '';
    return a.indexOf('YOUR_FORM_ID') !== -1 || a.indexOf('REPLACE_') !== -1;
  }

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  function composed() {
    return [
      'Name: ' + val('cf-name'),
      'Email: ' + val('cf-email'),
      'Business: ' + (val('cf-company') || '—'),
      'Looking for: ' + val('cf-project'),
      '',
      val('cf-message')
    ].join('\n');
  }

  function mailtoHref() {
    var name = val('cf-name');
    return 'mailto:' + MAIL
      + '?subject=' + encodeURIComponent('Consult request' + (name ? ' — ' + name : ''))
      + '&body=' + encodeURIComponent(composed());
  }

  function say(html) { if (note) note.innerHTML = html; }

  /* The submission did not get through. Say so plainly and hand over the path that
     always works, with the answers already written out. Never a thank-you. */
  function fallback(reason) {
    say('That did not send (' + reason + '). Your answers are ready in an email instead — '
      + '<a href="' + mailtoHref() + '">open it here</a>, or write to '
      + '<a href="mailto:' + MAIL + '">' + MAIL + '</a>.');
    if (button) { button.disabled = false; button.textContent = 'Book my consult'; }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    /* An action still carrying a placeholder would 404. Skip the network entirely
       and go straight to mail rather than showing the visitor an error page. */
    if (placeholder()) {
      say('Opening your email app with this filled in. If nothing happens, send it to '
        + MAIL + ' and we will pick it up from there.');
      location.href = mailtoHref();
      return;
    }

    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    say('Sending…');

    fetch(AJAX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: val('cf-name'),
        email: val('cf-email'),
        company: val('cf-company'),
        project: val('cf-project'),
        message: val('cf-message'),
        _subject: 'Consult request from designofman.com',
        _template: 'table'
      })
    }).then(function (r) {
      return r.json().catch(function () { return null; });
    }).then(function (data) {
      /* The whole point. Not r.ok — the body. */
      if (data && String(data.success) === 'true') {
        say('Sent. It is in our inbox at ' + MAIL + '.');
        if (button) { button.disabled = true; button.textContent = 'Sent'; }
        form.reset();
        return;
      }
      /* A 200 with success:false is the unactivated-address state. Name it, because
         it is a thing we can fix and the visitor should not be left guessing. */
      fallback(data ? 'the form service did not accept it' : 'no readable response');
    }).catch(function () {
      fallback('the request did not complete');
    });
  });
})();
