# Pre-launch checklist

Everything here is a **placeholder or an unverified claim that will survive
launch unless someone removes it**. None of it is a bug. Each one is a
deliberate stand-in waiting on a real value, or a number only you can confirm.

## Blocking — the site must not go to a custom domain with these in place

### 1. The phone number is fake
`(561) 555-0100` is a reserved-for-fiction 555 number, and it is now on four
pages plus the structured data every page carries:

- the `ProfessionalService` JSON-LD in the shared head, so **every page**
- `studio.html`, `contact.html`, `pay.html` (three places on that one)

It is generated from `TEL`, `TELH` and `TELD` at the top of `scripts/pages.py`.
Change those three constants, re-run the page scripts, and it is fixed
everywhere at once.

`grep -rn "555-0100" --include="*.html" .`

### 2. The contact form needs its address activated — ONE CLICK, ONCE

**Wired, not yet proven.** `index.html` and `contact.html` now post to
FormSubmit at `https://formsubmit.co/hello@designofman.com`. FormSubmit needs no
account and no form ID, but it **will not deliver to an address until that
address is activated**, and activation happens by clicking a one-time link it
emails on the first submission.

**Until someone clicks it, submissions are accepted and discarded.** FormSubmit
returns HTTP `200` with a body of `{"success":"false"}` in that state. This is
the failure mode that leaves two client sites unable to tell whether their forms
work at all.

`assets/js/form.js` is written so it cannot happen quietly here. It checks the
**response body**, not the status:

```js
if (data && String(data.success) === 'true') { …sent… }
else { …hand the visitor the mailto path with their answers preserved… }
```

`String()` because FormSubmit returns that field as a string in some responses
and a real boolean in others. Anything that is not an explicit success — a
network error, an unreadable body, or a 200 saying `success:false` — is treated
as a failure and the visitor is told, never thanked.

A visitor without JavaScript posts natively to FormSubmit's normal endpoint and
gets FormSubmit's own response page, so an unactivated address is visible to them
too. The `/ajax/` endpoint is used only by the handler.

**To finish this:**

1. Submit the form once on the live site.
2. Click the activation link FormSubmit emails to `hello@designofman.com`.
3. Submit again and **confirm the email actually arrives in the inbox** — a `200`
   is not evidence, which is the entire point of this item.

Until step 3 passes, no page may promise a reply time. The copy has been reduced
to what the form can back up.

### 3. `/pay` has two live placeholders that take money
Worse than a dead form, because a client is trying to pay you. **Both still need
real values** — but neither loses anything silently any more (2026-08-24):

- `REPLACE_FORM_ID` on the invoice-resend form. `assets/js/form.js` now guards
  `#resendForm` as well as `#consultForm`, so while the ID is a placeholder the
  submission opens the client's mail client with every field filled in instead
  of POSTing to a 404. Verified in a headless browser.
- `REPLACE_PORTAL_LINK` on the "Open my dashboard" button. While the href
  carries the placeholder, `form.js` rewrites the button to email us for the
  link and adds a line saying self-serve access is being switched on — rather
  than sending the client to a Stripe error page. Stripe Dashboard → Settings →
  Billing → Customer portal → Login page.

Both guards test the live attribute, so dropping in the real values turns them
off automatically. The preflight still blocks on these three, by design.

`grep -rn "REPLACE_" --include="*.html" .`

### 4. ~~The performance numbers are unverified~~ — done 2026-08-24
`/work` and `/case-first-rehab` claimed **+186% organic traffic, +72%
appointment requests, 2.4s faster**, "measured over the eight months following
launch". First Rehabilitation's site launched **2026-07-20**, so eight months of
post-launch data could not exist, and none of the three figures reconciled with
Search Console.

Replaced with measured figures, Search Console for the 32 days after launch
(21 Jul – 21 Aug 2026) against the 32 before, compared weekday-to-weekday
because the pre-window contained a weekend and the post-window did not:

- **+50%** organic clicks (3.64 → 5.46 per weekday)
- **+132%** search impressions (190 → 440 per weekday)
- **22** enquiries in the first 30 days, from the site's own form — the previous
  site had no lead capture, so there is no percentage to quote

The load-time claim is gone rather than restated: no performance baseline was
ever captured for the old Wix site, so there is nothing to compare against.

### 5. Confirm the email address
`hello@designofman.com` is in the JSON-LD, both forms' fallback, the footer of
every page, and the 404. Confirm the mailbox exists and is monitored.

## Done in this pass, noted so nobody re-does it

- **The preflight gate was reporting 213 blockers, 210 of them false.**
  `resolve()` built root-relative paths with `os.path.join(base, "/work")`,
  which discards the base and returns an absolute *filesystem* path — so every
  root-relative link, image and script on the site came back missing. Its
  `DOMAIN` constant also still read `www.tidelinedigital.com`, which failed
  every correct canonical on the site. Both fixed; the gate now reports the 3
  real `/pay` blockers and still exits non-zero. It also no longer demands a
  canonical on `404.html` or a sitemap entry for a `noindex` page, both of
  which are deliberate.
- **Three of the four verify harness checks could not run.** `target-check`,
  `reveal-check` and `coverage-check` each did
  `require("/home/user/Tideline-Digital-unfp/node_modules/playwright-core")` —
  an absolute path, capitalised differently from the repo, so they threw
  `MODULE_NOT_FOUND` in any fresh clone. Only `a11y-check` and `links-check`
  ever ran. Changed to `require("playwright-core")`; all five now run and pass.
- **Homepage CLS was 0.563 on a throttled phone** — a failing grade on its own.
  `scrollcraft.js` writes `height: Nvh` on each pinned act at init, so until the
  engine booted every act was content-height and the whole page below the film
  sat several screens too high, then jumped. Pinned acts now reserve that space
  in CSS via `--sc-span`, mirroring `data-sc-span`. **CLS 0.563 → 0.002**,
  Lighthouse mobile performance **49 → 77**. Keep the two values in step if a
  span changes.
- **The film poster is preloaded** with `fetchpriority="high"`. It is the LCP
  element and was only discovered after three stylesheets parsed.

- **Two fabricated case studies removed.** The previous `/work` carried
  "Coastal Collective" and "Green & Co." as client projects, with CSS mock
  rectangles instead of screenshots and invented metrics (+240% inbound leads,
  3.1x form submits, +132% mobile traffic). They are gone. If they were meant
  as visual placeholders, they read as real client results to anyone visiting,
  which is why they are not coming back without real numbers behind them.
- **The invented sparkline trends** on those cards went with them.
- **`/work` and `/case-first-rehab` no longer inline 1.4MB of base64.** The
  seven real screenshots live in `assets/img/work/` and load lazily. `/work`
  went from 796KB to 13KB of HTML.
- **Fonts are self-hosted** from `assets/fonts/` (161KB, both SIL OFL, licence
  text alongside). No render-blocking request to Google, no third-party DNS
  lookup on first paint.
- **`home.html` and the four `v2-*` pages are deleted**, with 301s in
  `vercel.json` so shared links still land somewhere.
- **`sitemap.xml` rewritten** to the real page set. `/pay` is deliberately
  absent and marked `noindex`.
- **`404.html` exists.**

## Non-blocking, but do them

- **Homepage LCP is still 4.1s** on a throttled phone. Three render-blocking
  stylesheets (`fonts.css`, `scrollcraft.css`, `v3.css`) delay first paint by
  ~500ms before the poster can start. Inlining critical CSS is the next lever;
  it was left alone because the visual system is bespoke and a partial extract
  would be worse than the delay. Note the 4.1s is measured against a local
  static server with no compression — Vercel serves these gzipped, so the real
  figure is better.

- **Analytics.** Still nothing installed. Plausible or PostHog per the usual
  stack. `/services` tells visitors analytics is "wired and verified" on every
  build, so this one is a little pointed.
- **Testimonials on `/` are unattributed.** Three quotes with no name, business
  or photograph read as invented whether or not they are. Attribute them or
  cut them.
- ~~**`_dev/` ships.**~~ Struck. I claimed this without checking and it is not
  true: `.vercelignore` already excludes `_dev/`, `books/` and `*.md`, and
  `/_dev/*` returns 404 in production. Nothing to do.
- **The runic wordmark** you picked is still not built. Elder Futhark risks
  tofu on a device without the glyphs, so it wants inline SVG runes rather than
  a third font family.

## Verified and fine

- Icons: `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest`.
- `og.png`, 1200x630, rendered from the film in the current brand.
- Security headers, `cleanUrls` and redirects in `vercel.json`.
- Every page passes all five harness checks in `scrollcraft/verify/`: links
  resolve, no text painted over, no contrast failure, every reveal fires, every
  target 24x24. (Three of them could not run at all until 2026-08-24 — see
  above. The earlier version of this line was not true.)
