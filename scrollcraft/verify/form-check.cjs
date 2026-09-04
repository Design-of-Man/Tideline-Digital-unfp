/* The contact endpoint, exercised the way the two real callers exercise it.
 *
 * This exists because the form is the only thing on the site that can lose a
 * lead silently, and every previous version of it did: a Formspree action with
 * a literal YOUR_FORM_ID in it, then a mailto: fallback that does nothing on a
 * device with no mail client. A green run here means a submission either
 * arrives or the visitor is told it did not.
 *
 * Run:  node scrollcraft/verify/form-check.cjs
 */
const http = require('node:http');
const assert = require('node:assert');

const FAKE_KEY = 'test_key_not_a_real_one';

(async () => {
  process.env.RESEND_API_KEY = FAKE_KEY;

  // Intercept the Resend call so the check never sends mail or needs a key.
  const realFetch = globalThis.fetch;
  let lastSend = null;
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('api.resend.com')) {
      lastSend = JSON.parse(opts.body);
      return new Response('{"id":"stub"}', { status: 200 });
    }
    return realFetch(url, opts);
  };

  const { default: handler } = await import('../../api/contact.mjs');
  const srv = http.createServer((q, s) => handler(q, s));
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}/api/contact`;

  let ip = 0;
  const post = (body, { form = false, headers = {} } = {}) =>
    realFetch(base, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json',
        ...(form ? {} : { Accept: 'application/json' }),
        'x-forwarded-for': headers['x-forwarded-for'] || `10.0.0.${++ip}`,
        ...headers,
      },
      body: form ? new URLSearchParams(body).toString() : JSON.stringify(body),
    });

  const good = () => ({
    name: 'Test Person', email: 'test@example.com',
    message: 'A real enquiry about a rebuild.', _t: Date.now() - 9000,
  });

  const fails = [];
  const check = async (label, fn) => {
    try { await fn(); } catch (e) { fails.push(`${label}: ${e.message}`); }
  };

  await check('GET is rejected', async () =>
    assert.equal((await realFetch(base)).status, 405));

  await check('a missing required field is a 422', async () =>
    assert.equal((await post({ name: 'x', _t: Date.now() - 9000 })).status, 422));

  await check('a malformed address is a 422', async () =>
    assert.equal((await post({ ...good(), email: 'nope' })).status, 422));

  await check('a header injected through a field is a 422', async () =>
    assert.equal((await post({ ...good(), email: 'a@b.co\nBcc: evil@example.com' })).status, 422));

  await check('an oversized message is a 422', async () =>
    assert.equal((await post({ ...good(), message: 'x'.repeat(6000) })).status, 422));

  await check('a filled honeypot is accepted and dropped', async () => {
    lastSend = null;
    const r = await post({ ...good(), _gotcha: 'spam' });
    assert.equal(r.status, 200, 'bot must learn nothing from the status');
    assert.equal(lastSend, null, 'honeypot submission must not be delivered');
  });

  await check('a sub-two-second submission is accepted and dropped', async () => {
    lastSend = null;
    const r = await post({ ...good(), _t: Date.now() - 100 });
    assert.equal(r.status, 200);
    assert.equal(lastSend, null, 'timed-out submission must not be delivered');
  });

  await check('another origin is refused', async () =>
    assert.equal((await post(good(), { headers: { Origin: 'https://evil.example' } })).status, 403));

  await check('our own origin is allowed', async () =>
    assert.equal((await post(good(), { headers: { Origin: 'https://www.designofman.com' } })).status, 200));

  await check('a valid submission is delivered, escaped, and replies to the sender', async () => {
    lastSend = null;
    const r = await post({ ...good(), company: 'Acme', message: '<script>alert(1)</script>' });
    assert.equal(r.status, 200);
    assert.ok(lastSend, 'nothing was sent');
    assert.equal(lastSend.reply_to, 'test@example.com');
    assert.ok(lastSend.subject.includes('Acme'), 'business name missing from subject');
    assert.ok(!lastSend.html.includes('<script>alert'), 'HTML was not escaped');
  });

  await check('without JavaScript the browser is redirected, not shown JSON', async () => {
    const r = await post(good(), { form: true });
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('location'), '/contact?sent=1');
  });

  await check('correcting a typo repeatedly never locks the visitor out', async () => {
    for (let i = 0; i < 8; i++) {
      const r = await post({ ...good(), email: 'nope' }, { headers: { 'x-forwarded-for': '7.7.7.7' } });
      assert.equal(r.status, 422, `attempt ${i + 1} was throttled; a typo must not count as a send`);
    }
  });

  await check('a flood of valid sends from one address is throttled', async () => {
    let throttled = false;
    for (let i = 0; i < 8; i++) {
      const r = await post(good(), { headers: { 'x-forwarded-for': '8.8.8.8' } });
      if (r.status === 429) { throttled = true; break; }
    }
    assert.ok(throttled, 'the send budget never engaged');
  });

  await check('a delivery failure is never reported as success', async () => {
    globalThis.fetch = async (url, opts) => {
      if (String(url).includes('api.resend.com')) return new Response('nope', { status: 500 });
      return realFetch(url, opts);
    };
    const r = await post(good());
    assert.equal(r.status, 502, 'a failed send must not answer 200');
    const body = await r.json();
    assert.equal(body.ok, false);
  });

  srv.close();

  if (fails.length) {
    console.error('form: FAILED\n  ' + fails.join('\n  '));
    process.exit(1);
  }
  console.log('form: endpoint validates, filters bots, escapes output, and never claims a lost lead was sent');
})();
