# Pre-launch checklist

State as of **2026-09-03**. Every claim here was checked against the repository
when it was written, not carried forward from the previous version of this file
— which had several lines that were no longer true, including one that said the
fabricated client metrics had been removed when they were still on two pages.

---

## Blocking — one item

### `/pay` still has the Stripe portal placeholder

`REPLACE_PORTAL_LINK` is on the "Open my dashboard" button. The Customer Portal
login URL is issued by Stripe and cannot be invented, so it stays a placeholder
until someone pastes the real one in.

It does not lose anything: `assets/js/form.js` tests the live attribute and, while
the placeholder is there, rewrites the button to email us for the link and adds
a line saying self-serve access is being switched on — rather than sending a
paying client to a Stripe error page.

**Stripe Dashboard → Settings → Billing → Customer portal → Login page**, then
put the URL in `scripts/build_pay.py` and re-run it. The guard turns itself off.

```
grep -rn "REPLACE_" --include="*.html" .
```

`_dev/preflight.py` blocks on this by design.

---

## Closed in this pass

### The phone number is gone, not replaced
`(561) 555-0100` was a reserved-for-fiction number sitting on four pages **and in
the structured data of every page on the site**. A search engine reads that as
the business's real contact data, so a fake number is worse than none. It has
been removed everywhere: the `tel:` links, the copy that promised someone would
answer the phone, and the `telephone` key in the JSON-LD.

Contact is email and the form until a real line exists. Adding one back means a
`TEL`/`TELH`/`TELD` triple in `scripts/pages.py` and a `telephone` key in
`STUDIO` — nowhere else.

### The contact form reaches a real endpoint
Both forms posted to `https://formspree.io/f/YOUR_FORM_ID` — a literal template
placeholder. They now post to `/api/contact` (`api/contact.mjs`) on our own
origin, which validates, filters bots with a honeypot and a submit-timing check,
rate-limits deliveries (not attempts — see below), escapes everything it puts in
an email, and sends through Resend.

The rule it is built around: **the visitor is never shown a success message for
a message that was not delivered.** With no `RESEND_API_KEY` it answers 503 and
says to email instead, rather than accepting a lead it cannot deliver. Without
JavaScript the browser posts natively and gets a 303. `scrollcraft/verify/form-check.cjs`
enforces all of it, including that a failed send can never answer 200.

The first version of the rate limiter counted every request, which meant someone
mistyping their email five times was locked out for ten minutes having sent
nothing. It now counts deliveries separately from attempts. That bug was found
by the check, not by review.

### The fabricated case-study metrics are actually gone this time
`/work` and `/case-first-rehab` still carried **+186% organic traffic, +72%
appointment requests, 2.4s faster**, attributed to "the eight months following
launch" — for a site that launched 2026-07-20, six weeks earlier.

They had been fixed once already, in `26fcd4a`, and had come back. That commit
edited the two generated HTML files and left `186%` sitting in
`scripts/build_work.py` and `scripts/build_case.py`. **These pages are
generated**, so the next run of the build scripts wrote the fabricated figures
straight back over the fix, silently, and nothing in the repo noticed.

That is the more useful lesson than the numbers themselves: on this site,
editing a generated `.html` file is not a fix, it is a fix with a timer on it.
The correction has to go in `scripts/`. Both generators carry the real figures
now.

Replaced with measured figures, Google Search Console, the 32 days after launch
(21 Jul – 21 Aug 2026) against the 32 before, weekday-to-weekday because the
earlier window contained a weekend and the later one did not:

- **+50%** organic clicks (3.64 → 5.46 per weekday)
- **+132%** search impressions (190 → 440 per weekday)
- **22** enquiries in the first 30 days, from the site's own form — the previous
  site had no lead capture, so there is no percentage to quote

No load-time claim is made in any form. No performance baseline was captured for
the old site, so there is nothing to compare against.

### The unattributed testimonials are gone
Three quotes on the homepage with no name, no business and no photograph. They
read as invented whether or not they were, and a visitor could not check a word.
Replaced with the First Rehabilitation figures above and a link to the working.

### Security headers are now a real policy
Was: four headers, no CSP, no HSTS. Now a `Content-Security-Policy` with
`script-src 'self'` and no `'unsafe-inline'` anywhere — possible because there
is not one inline `<script>` on the site and the analytics are served from the
deployment's own origin. Plus HSTS with preload, COOP, CORP, a
`Permissions-Policy` that denies the whole unused interface surface, and
`frame-ancestors`.

`scrollcraft/verify/csp-check.cjs` loads every page under the exact headers
`vercel.json` declares. It immediately caught one: `media-src 'self'` refused the
`blob:` URL the scrub engine plays the homepage film from, which would have
shipped a black hero to production.

### Core Web Vitals are inside budget and enforced
- Homepage LCP **3.4s → 2.0s** on a throttled phone. The poster was a single
  1600px JPEG served to every device; it is now WebP at three widths. A 390px
  phone at DPR 3 needs ~1170 device pixels, so without a 1200 candidate it
  skipped 960 and took the full 1600 — the fix was the middle width. The
  closing still, ten viewports down, was also loading at ~1s and competing with
  the LCP image; it is lazy now.
- CLS is **0.000** on every page.
- `scrollcraft/verify/vitals-check.cjs` fails the run if either goes out of band.

### Analytics exist
Vercel Web Analytics and Speed Insights, in every page's footer, served from
`/_vercel/*`. `/services` had been telling visitors analytics was "wired and
verified" on every build while the site itself had none.

### The homepage had no footer
It carried no `<footer>` at all — no contentinfo landmark, and none of the
site-wide links. `scripts/sync_index.py` now derives the homepage's schema
graph, footer, script set and cache-buster from the same source as every other
page, because the hand-written copy had already drifted.

### The gates were not gating
- `_dev/preflight.py` globbed `*.html` at the root only, so the four pages under
  `/insights/` were checked by nothing. It is recursive now, and it knows
  `/_vercel/*` and `/api/*` are served by the platform rather than by files.
- `sitemap.xml`, `robots.txt` and `llms.txt` are generated from the pages
  themselves by `scripts/build_meta.py`, so the sitemap cannot list a page that
  does not exist or miss one that does. `lastmod` comes from git.

### Header text collision
The fixed header's gradient ground faded to transparent at its lower edge, so
any heading scrolling past it painted straight through the nav — the wordmark
and an `<h2>` in the same pixels, on every page. Past the first fold the bar now
takes a solid ground.

---

## Non-blocking, worth doing

- **The runic wordmark** you picked is still not built. Elder Futhark risks tofu
  on a device without the glyphs, so it wants inline SVG runes rather than a
  third font family.
- **Only one case study has real numbers.** HomeCrew and RegenOrtho are shown
  with real screenshots and no metrics, which is honest but thin. Pull their
  Search Console figures when there is enough post-launch data.
- **`/insights` has three articles.** That is enough to be a real section and
  not enough to rank broadly. The next few should keep the same rule: if we
  cannot point at the commit, the measurement or the file, it does not go up.
- **Verify the Resend sending domain** before launch. See `DEPLOY.md`.

## Verified and fine

- Icons: `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest`.
- `og.png`, 1200×630, rendered from the film in the current brand.
- `.vercelignore` excludes `_dev/`, `books/` and `*.md`; `/_dev/*` 404s in
  production.
- All fifteen pages pass every gate in `scrollcraft/verify/`. Run them with
  `./scrollcraft/verify/run-all.sh`.
