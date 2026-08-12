/* ============================================================================
   Design of Man — conversational lead capture
   ----------------------------------------------------------------------------
   A chat-styled qualifying flow that ends in a Formspree submission. No backend,
   no API key, no model — so it can never invent a price or a timeline. Every
   reply it gives is one you wrote, in FLOW below.

   Usage:
     <script src="/assets/js/chat-widget.js"
             data-endpoint="https://formspree.io/f/XXXXXXX"
             data-phone="+15615550100"
             data-phone-label="(561) 555-0100"
             data-email="hello@designofman.com" defer></script>

   Self-mounts. Injects its own styles. Inherits --dom-display/body/mono if set.
   ========================================================================== */
(function () {
  'use strict';

  var SELF = document.currentScript;
  var CFG = {
    endpoint: (SELF && SELF.dataset.endpoint) || '',
    phone: (SELF && SELF.dataset.phone) || '+15615550100',
    phoneLabel: (SELF && SELF.dataset.phoneLabel) || '(561) 555-0100',
    email: (SELF && SELF.dataset.email) || 'hello@designofman.com',
    name: (SELF && SELF.dataset.name) || 'Design of Man'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ flow */
  /* Each step: what the bot says, then how the visitor answers.
     type 'choice' renders quick-reply chips; 'text' and 'email' render inputs. */
  var FLOW = [
    {
      key: 'intent',
      say: ['Hi — thanks for stopping by.', 'What brings you to Design of Man today?'],
      type: 'choice',
      options: [
        'A brand new website',
        'Rebuilding an existing site',
        'A web app or internal tool',
        'Hosting & ongoing care',
        'Something else'
      ]
    },
    {
      key: 'timeline',
      say: function (a) {
        if (a.intent === 'Hosting & ongoing care') return ['Good — that is the part most people forget.', 'When would you want us to take it over?'];
        return ['Nice one.', 'Roughly when are you hoping to launch?'];
      },
      type: 'choice',
      options: ['As soon as possible', 'In the next 1–3 months', '3–6 months out', 'Just exploring for now']
    },
    {
      key: 'business',
      say: ['Helpful, thank you.', 'In a sentence — what does your business do?'],
      type: 'text',
      placeholder: 'e.g. We are a physical therapy clinic in North Palm Beach'
    },
    {
      key: 'name',
      say: ['Got it. Two quick details and I will pass this to the team.', 'What is your name?'],
      type: 'text',
      placeholder: 'Your name'
    },
    {
      key: 'email',
      say: ['And the best email to reach you on?'],
      type: 'email',
      placeholder: 'you@company.com'
    }
  ];

  var CLOSING = [
    'That is everything — thank you.',
    'Someone will read this personally and come back to you within one business day. No automated sequence, no drip campaign.'
  ];

  /* ----------------------------------------------------------------- styles */
  var CSS = [
    '.domc-launch{position:fixed;right:1.25rem;bottom:1.25rem;z-index:9998;display:inline-flex;align-items:center;gap:.55rem;',
    'padding:.85rem 1.2rem;background:#16233B;color:#F7F2E9;border:1px solid rgba(247,242,233,.18);border-radius:999px;',
    'cursor:pointer;font:600 .9rem/1 var(--dom-body,"Work Sans",system-ui,sans-serif);box-shadow:0 18px 40px -18px rgba(6,16,28,.7);',
    'transition:background .22s cubic-bezier(.22,1,.36,1),transform .22s cubic-bezier(.22,1,.36,1)}',
    '.domc-launch:hover{background:#C15F3C;transform:translateY(-2px)}',
    '.domc-launch svg{width:17px;height:17px;flex:none}',
    '.domc-launch .domc-dot{width:7px;height:7px;border-radius:50%;background:#8fd694;flex:none}',
    '@media(max-width:600px){.domc-launch{right:1rem;bottom:1rem;padding:.8rem .95rem}.domc-launch .domc-txt{display:none}}',

    '.domc-panel{position:fixed;right:1.25rem;bottom:5.2rem;z-index:9999;width:min(380px,calc(100vw - 2rem));',
    'max-height:min(600px,calc(100vh - 8rem));display:flex;flex-direction:column;background:#F7F2E9;',
    'border:1px solid rgba(46,42,34,.16);border-radius:16px;overflow:hidden;box-shadow:0 30px 70px -25px rgba(6,16,28,.6);',
    'opacity:0;visibility:hidden;transform:translateY(12px) scale(.98);',
    'transition:opacity .22s cubic-bezier(.22,1,.36,1),transform .22s cubic-bezier(.22,1,.36,1),visibility .22s}',
    '.domc-panel[data-open="true"]{opacity:1;visibility:visible;transform:none}',
    '@media(max-width:600px){.domc-panel{right:.75rem;left:.75rem;bottom:4.6rem;width:auto;max-height:calc(100vh - 7rem)}}',

    '.domc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.1rem 1.2rem;',
    'background:#16233B;color:#F7F2E9;flex:none}',
    '.domc-head h2{margin:0;font:600 1.05rem/1.2 var(--dom-display,"Fraunces",Georgia,serif);color:#F7F2E9}',
    '.domc-head p{margin:.25rem 0 0;font:400 .78rem/1.45 var(--dom-body,"Work Sans",system-ui,sans-serif);color:rgba(247,242,233,.7)}',
    '.domc-close{background:none;border:0;color:rgba(247,242,233,.7);font-size:1.5rem;line-height:1;cursor:pointer;padding:0 .2rem}',
    '.domc-close:hover{color:#F7F2E9}',

    '.domc-log{flex:1 1 auto;overflow-y:auto;padding:1.1rem;display:flex;flex-direction:column;gap:.6rem;',
    'font:400 .9rem/1.55 var(--dom-body,"Work Sans",system-ui,sans-serif);color:#2E2A22}',
    '.domc-msg{max-width:86%;padding:.65rem .85rem;border-radius:14px;animation:domc-in .3s cubic-bezier(.22,1,.36,1) both}',
    '.domc-msg.bot{align-self:flex-start;background:#fff;border:1px solid rgba(46,42,34,.1);border-bottom-left-radius:5px}',
    '.domc-msg.me{align-self:flex-end;background:#16233B;color:#F7F2E9;border-bottom-right-radius:5px}',
    '@keyframes domc-in{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}',
    '.domc-typing{align-self:flex-start;display:flex;gap:4px;padding:.7rem .85rem;background:#fff;',
    'border:1px solid rgba(46,42,34,.1);border-radius:14px;border-bottom-left-radius:5px}',
    '.domc-typing i{width:6px;height:6px;border-radius:50%;background:rgba(46,42,34,.35);animation:domc-b 1.1s infinite}',
    '.domc-typing i:nth-child(2){animation-delay:.15s}.domc-typing i:nth-child(3){animation-delay:.3s}',
    '@keyframes domc-b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}',

    '.domc-foot{flex:none;border-top:1px solid rgba(46,42,34,.12);padding:.85rem 1.1rem 1rem;background:#F4EEE0}',
    '.domc-chips{display:flex;flex-wrap:wrap;gap:.45rem}',
    '.domc-chip{padding:.55rem .85rem;background:#fff;border:1px solid rgba(46,42,34,.22);border-radius:999px;',
    'font:500 .84rem/1 var(--dom-body,"Work Sans",system-ui,sans-serif);color:#2E2A22;cursor:pointer;',
    'transition:background .18s,border-color .18s,color .18s}',
    '.domc-chip:hover{background:#16233B;border-color:#16233B;color:#F7F2E9}',
    '.domc-form{display:flex;gap:.5rem}',
    '.domc-form input{flex:1 1 auto;min-width:0;padding:.7rem .8rem;border:1px solid rgba(46,42,34,.24);',
    'border-radius:9px;background:#fff;font:400 .9rem var(--dom-body,"Work Sans",system-ui,sans-serif);color:#2E2A22}',
    '.domc-form input:focus{outline:none;border-color:#C15F3C;box-shadow:0 0 0 3px rgba(193,95,60,.18)}',
    '.domc-send{flex:none;padding:.7rem 1rem;background:#C15F3C;color:#fff;border:0;border-radius:9px;cursor:pointer;',
    'font:600 .85rem var(--dom-body,"Work Sans",system-ui,sans-serif)}',
    '.domc-send:hover{background:#A44B2C}.domc-send:disabled{opacity:.55;cursor:default}',
    '.domc-err{margin:.5rem 0 0;font-size:.78rem;color:#A44B2C}',
    '.domc-alt{margin:.7rem 0 0;font-size:.75rem;color:rgba(46,42,34,.62);text-align:center}',
    '.domc-alt a{color:#A44B2C}',
    '.domc-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    ':where(.domc-launch,.domc-chip,.domc-send,.domc-close,.domc-form input):focus-visible{outline:2.5px solid #C15F3C;outline-offset:2px}',
    '@media(prefers-reduced-motion:reduce){.domc-panel,.domc-launch,.domc-msg,.domc-typing i{transition:none!important;animation:none!important}}'
  ].join('');

  /* ------------------------------------------------------------------ build */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var answers = {}, transcript = [], step = 0, done = false;
  var launch, panel, log, foot, statusLine;

  function mount() {
    var style = el('style'); style.id = 'domc-styles'; style.textContent = CSS;
    document.head.appendChild(style);

    launch = el('button', 'domc-launch');
    launch.type = 'button';
    launch.setAttribute('aria-expanded', 'false');
    launch.setAttribute('aria-controls', 'domc-panel');
    launch.innerHTML = '<span class="domc-dot"></span><span class="domc-txt">Chat with us</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.4-9 8.4 8.4 0 0 1 8.6 8.3Z"/></svg>';
    document.body.appendChild(launch);

    panel = el('div', 'domc-panel');
    panel.id = 'domc-panel';
    panel.setAttribute('data-open', 'false');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', CFG.name + ' — chat');
    panel.innerHTML =
      '<div class="domc-head"><div><h2>Let\u2019s talk</h2>' +
      '<p>A few quick questions, then a real person replies.</p></div>' +
      '<button type="button" class="domc-close" aria-label="Close chat">&times;</button></div>' +
      '<div class="domc-log" role="log" aria-live="polite" aria-atomic="false"></div>' +
      '<div class="domc-foot"></div>';
    document.body.appendChild(panel);

    log = panel.querySelector('.domc-log');
    foot = panel.querySelector('.domc-foot');

    launch.addEventListener('click', toggle);
    panel.querySelector('.domc-close').addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.getAttribute('data-open') === 'true') close(true);
    });
  }

  function toggle() {
    if (panel.getAttribute('data-open') === 'true') close(true);
    else open();
  }
  function open() {
    panel.setAttribute('data-open', 'true');
    launch.setAttribute('aria-expanded', 'true');
    if (!log.children.length) runStep();
    else focusInput();
  }
  function close(returnFocus) {
    panel.setAttribute('data-open', 'false');
    launch.setAttribute('aria-expanded', 'false');
    if (returnFocus) launch.focus();
  }

  function say(text, who) {
    var m = el('div', 'domc-msg ' + who, esc(text));
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }
  function typing(on) {
    var t = log.querySelector('.domc-typing');
    if (on && !t) {
      t = el('div', 'domc-typing', '<i></i><i></i><i></i>');
      log.appendChild(t); log.scrollTop = log.scrollHeight;
    } else if (!on && t) t.remove();
  }

  /* say lines with a human pause, then render the answer control */
  function botLines(lines, cb) {
    var i = 0;
    (function next() {
      if (i >= lines.length) { cb && cb(); return; }
      typing(true);
      setTimeout(function () {
        typing(false);
        say(lines[i++], 'bot');
        next();
      }, reduced ? 0 : (i === 0 ? 420 : 620));
    })();
  }

  function runStep() {
    foot.innerHTML = '';
    if (step >= FLOW.length) { finish(); return; }
    var s = FLOW[step];
    var lines = typeof s.say === 'function' ? s.say(answers) : s.say;
    botLines(lines, function () { renderControl(s); });
  }

  function renderControl(s) {
    foot.innerHTML = '';
    if (s.type === 'choice') {
      var wrap = el('div', 'domc-chips');
      s.options.forEach(function (opt) {
        var c = el('button', 'domc-chip', esc(opt));
        c.type = 'button';
        c.addEventListener('click', function () { accept(s, opt); });
        wrap.appendChild(c);
      });
      foot.appendChild(wrap);
      var first = wrap.querySelector('.domc-chip');
      if (first) first.focus();
    } else {
      var form = el('form', 'domc-form');
      // Native validation would swallow the submit event before our handler
      // runs, so the inline error never appeared. Validate ourselves instead.
      form.noValidate = true;
      var input = el('input');
      input.type = s.type === 'email' ? 'email' : 'text';
      input.placeholder = s.placeholder || '';
      input.setAttribute('aria-label', s.placeholder || 'Your answer');
      if (s.type === 'email') input.autocomplete = 'email';
      if (s.key === 'name') input.autocomplete = 'name';
      var send = el('button', 'domc-send', 'Send');
      send.type = 'submit';
      form.appendChild(input); form.appendChild(send);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (!v) return;
        if (s.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
          showErr('That email does not look right — mind checking it?');
          return;
        }
        accept(s, v);
      });
      foot.appendChild(form);
      input.focus();
    }
    addAlt();
  }

  function showErr(msg) {
    var old = foot.querySelector('.domc-err');
    if (old) old.remove();
    var p = el('p', 'domc-err', esc(msg));
    foot.insertBefore(p, foot.querySelector('.domc-alt') || null);
  }

  function addAlt() {
    var p = el('p', 'domc-alt',
      'Rather talk? <a href="tel:' + esc(CFG.phone) + '">' + esc(CFG.phoneLabel) + '</a>' +
      ' &nbsp;·&nbsp; <a href="mailto:' + esc(CFG.email) + '">Email us</a>');
    foot.appendChild(p);
  }

  function accept(s, value) {
    answers[s.key] = value;
    transcript.push({ q: (typeof s.say === 'function' ? s.say(answers) : s.say).join(' '), a: value });
    say(value, 'me');
    step++;
    runStep();
  }

  function focusInput() {
    var f = foot.querySelector('input, .domc-chip, .domc-send');
    if (f) f.focus();
  }

  /* ---------------------------------------------------------------- submit */
  function finish() {
    if (done) return;
    done = true;
    foot.innerHTML = '';
    typing(true);

    var body = new FormData();
    body.append('name', answers.name || '');
    body.append('email', answers.email || '');
    body.append('_subject', 'Website chat enquiry — ' + (answers.name || 'new lead'));
    body.append('inquiry_type', answers.intent || '');
    body.append('timeline', answers.timeline || '');
    body.append('business', answers.business || '');
    body.append('transcript', transcript.map(function (t) { return 'Q: ' + t.q + '\nA: ' + t.a; }).join('\n\n'));
    body.append('page', location.href);

    var ok = function () {
      typing(false);
      botLines(CLOSING, function () {
        foot.innerHTML = '';
        addAlt();
      });
      if (window.dataLayer) window.dataLayer.push({ event: 'chat_lead', intent: answers.intent });
    };
    var fail = function () {
      typing(false);
      botLines([
        'Something went wrong sending that — which is on us, not you.',
        'Please call ' + CFG.phoneLabel + ' or email ' + CFG.email + ' and we will pick it straight up.'
      ], function () { foot.innerHTML = ''; addAlt(); });
    };

    if (CFG.endpoint.indexOf('formspree.io') === -1) {
      // Endpoint not configured yet — don't pretend it sent.
      setTimeout(function () {
        typing(false);
        botLines([
          'Heads up: the form endpoint has not been connected yet, so this was not delivered.',
          'Set data-endpoint on the script tag to your Formspree URL.'
        ], function () { foot.innerHTML = ''; addAlt(); });
      }, 500);
      return;
    }

    fetch(CFG.endpoint, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw 0; ok(); })
      .catch(fail);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
