/* POST /api/contact — the one path a lead can take into the studio.
 *
 * This replaces a Formspree URL that shipped with a literal YOUR_FORM_ID in
 * it, and a client-side fallback that handed the visitor a mailto: link. The
 * mailto: fallback is still in form.js and still correct as a last resort,
 * but it silently loses anyone on a device with no mail client configured,
 * which is most phones with a webmail-only user.
 *
 * It degrades all the way down: with JavaScript the form fetches this and
 * stays on the page; with JavaScript off the browser posts the form natively
 * and this answers with a 303 to a thank-you URL. Both paths are exercised in
 * scrollcraft/verify/form-check.cjs.
 *
 * Configuration (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY   required. Without it the function returns 503 and says so
 *                    rather than accepting a lead it cannot deliver.
 *   CONTACT_TO       optional, defaults to hello@designofman.com
 *   CONTACT_FROM     optional, defaults to site@designofman.com — must be on a
 *                    domain verified in Resend or delivery fails.
 */

const TO       = process.env.CONTACT_TO   || 'hello@designofman.com';
const FROM     = process.env.CONTACT_FROM || 'Design of Man <site@designofman.com>';
const API_KEY  = process.env.RESEND_API_KEY;

/* Only our own pages may post here. This is not a security boundary on its
   own — Origin is trivially forged outside a browser — but it costs nothing
   and stops the endpoint being used as a free relay from someone else's page. */
const ALLOWED_HOSTS = new Set([
  'www.designofman.com', 'designofman.com', 'localhost:8899', '127.0.0.1:8899',
]);

/* Field name → [label, maxLength, required]. Anything not named here is
   dropped rather than forwarded, so a bot padding the body with extra keys
   cannot inflate the email. */
const FIELDS = {
  name:    ['Name',     120,  true],
  email:   ['Email',    254,  true],
  company: ['Business', 160,  false],
  project: ['Needs',    120,  false],
  message: ['Message',  5000, true],
  invoice: ['Invoice',  120,  false],
};

/* Deliberately loose. Strict RFC 5322 validation rejects real addresses, and
   the only thing that actually proves an address is sending to it. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Best-effort per-IP throttle. A serverless instance is not shared across all
   traffic, so this catches a single-source flood hitting one warm instance
   and nothing more. Real abuse protection is Vercel's own rate limiting; this
   is here so the obvious case does not reach Resend at all.
 *
 * Two counters, because one is a usability bug. Counting every request against
 * a limit of five means a visitor who mistypes their email address five times
 * is locked out for ten minutes, having never successfully sent anything. So
 * SENDS counts only submissions that passed validation and are about to cost
 * us an email, and REQS is a much looser ceiling on raw traffic. A person
 * correcting a typo touches only REQS; a script hammering the endpoint hits
 * both. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS = 5;      // valid, deliverable submissions per IP per window
const MAX_REQS  = 40;     // any POST at all, valid or not

const SENDS = new Map();
const REQS  = new Map();

function bump(map, ip, limit) {
  const now = Date.now();
  const seen = (map.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  seen.push(now);
  map.set(ip, seen);
  if (map.size > 5000) map.clear();             // bounded; this is a cache, not a ledger
  return seen.length > limit;
}

const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;   // Vercel pre-parsed
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 64 * 1024) throw new Error('too large');            // cap before parsing
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) return JSON.parse(raw || '{}');
  return Object.fromEntries(new URLSearchParams(raw));
}

export default async function handler(req, res) {
  const wantsJson = String(req.headers.accept || '').includes('application/json');

  const done = (code, payload, redirect) => {
    if (!wantsJson && redirect) {
      res.statusCode = 303;
      res.setHeader('Location', redirect);
      return res.end();
    }
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify(payload));
  };

  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return done(405, { ok: false, error: 'Use POST.' });
  }

  const origin = req.headers.origin;
  if (origin) {
    let host;
    try { host = new URL(origin).host; } catch { host = null; }
    if (!host || !ALLOWED_HOSTS.has(host)) {
      return done(403, { ok: false, error: 'Bad origin.' });
    }
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (bump(REQS, ip, MAX_REQS)) {
    return done(429, { ok: false, error: 'Too many requests. Try again shortly, or email us directly.' });
  }

  let body;
  try { body = await readBody(req); }
  catch { return done(413, { ok: false, error: 'That message is too large to send here.' }); }

  /* Two silent bot filters. Neither is shown to a person: the honeypot is
     visually hidden and off the tab order, and the timestamp is stamped by
     form.js at page load. A human cannot fill this form in under two seconds
     and a script almost always does. Both fail closed to a 200 so a bot
     learns nothing from the response. */
  if (String(body._gotcha || '').trim() !== '') return done(200, { ok: true }, '/contact?sent=1');
  const stamped = Number(body._t || 0);
  if (stamped && Date.now() - stamped < 2000) return done(200, { ok: true }, '/contact?sent=1');

  const clean = {};
  const errors = [];
  for (const [key, [label, max, required]] of Object.entries(FIELDS)) {
    const value = String(body[key] ?? '').trim();
    if (!value) {
      if (required) errors.push(`${label} is required.`);
      continue;
    }
    if (value.length > max) { errors.push(`${label} is too long.`); continue; }
    clean[key] = value;
  }
  if (clean.email && !EMAIL_RE.test(clean.email)) errors.push('That email address does not look right.');
  /* A header injected through a field would let someone add their own Bcc. */
  if (/[\r\n]/.test(clean.email || '') || /[\r\n]/.test(clean.name || '')) {
    errors.push('That email address does not look right.');
  }
  if (errors.length) return done(422, { ok: false, error: errors[0], errors });

  /* Only now, with a submission we would actually deliver, does it count
     against the send budget. */
  if (bump(SENDS, ip, MAX_SENDS)) {
    return done(429, {
      ok: false,
      error: `That is a lot of messages in a short time. Try again shortly, or email ${TO} directly.`,
    });
  }

  if (!API_KEY) {
    /* Never answer 200 to a lead that was not delivered. The visitor is told
       to email instead, which is a worse outcome than a working form but a
       far better one than a success message over a dropped message. */
    console.error('contact: RESEND_API_KEY is not set; refusing to accept the submission');
    return done(503, {
      ok: false,
      error: `The form is not connected yet. Please email ${TO} and we will pick it up from there.`,
    });
  }

  const rows = Object.entries(FIELDS)
    .filter(([k]) => clean[k])
    .map(([k, [label]]) => `<tr><td style="padding:4px 14px 4px 0;color:#667;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(clean[k])}</td></tr>`)
    .join('');

  const subject = `Website enquiry — ${clean.name}${clean.company ? ` (${clean.company})` : ''}`;
  const text = Object.entries(FIELDS)
    .filter(([k]) => clean[k])
    .map(([k, [label]]) => `${label}: ${clean[k]}`)
    .join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: clean.email,
        subject,
        text,
        html: `<table style="font:15px/1.5 -apple-system,Segoe UI,sans-serif">${rows}</table>`,
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error('contact: resend rejected the send', r.status, detail.slice(0, 400));
      return done(502, {
        ok: false,
        error: `We could not send that just now. Please email ${TO} directly.`,
      });
    }
  } catch (err) {
    console.error('contact: resend request failed', err);
    return done(502, {
      ok: false,
      error: `We could not send that just now. Please email ${TO} directly.`,
    });
  }

  return done(200, { ok: true }, '/contact?sent=1');
}
