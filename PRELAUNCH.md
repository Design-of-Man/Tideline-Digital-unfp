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

### 2. The contact form has no endpoint
`index.html` and `contact.html` both post to
`https://formspree.io/f/YOUR_FORM_ID`.

`assets/js/form.js` keeps this from losing leads: while the action carries the
placeholder, submitting hands the filled-in fields to the visitor's mail client
addressed to `hello@designofman.com`, and the note under the form says so. The
moment the action becomes a real Formspree URL the handler steps aside and the
native POST runs. No other change needed.

`grep -rn "YOUR_FORM_ID" --include="*.html" .`

> The fallback is a stopgap, not the plan. A visitor on a device with no mail
> client configured still cannot send. Set the real ID.

### 3. `/pay` has two live placeholders that take money
Worse than a dead form, because a client is trying to pay you:

- `REPLACE_FORM_ID` on the invoice-resend form. **This one has no mail
  fallback**, because `form.js` only guards `#consultForm`. A client asking for
  their invoice today gets a 404.
- `REPLACE_PORTAL_LINK` on the "Open my dashboard" button. Stripe Dashboard →
  Settings → Billing → Customer portal → Login page.

`grep -rn "REPLACE_" --include="*.html" .`

### 4. The performance numbers are unverified
`/work` and `/case-first-rehab` both claim, for First Rehabilitation of North
Palm Beach: **+186% organic traffic, +72% appointment requests, 2.4s faster**,
measured over the eight months after launch against the eight before.

These came across from the previous build. They are presented to prospects as
fact, on a page that names a real client. Confirm each against the analytics
before the domain goes live, or soften them to what you can evidence.

### 5. Confirm the email address
`hello@designofman.com` is in the JSON-LD, both forms' fallback, the footer of
every page, and the 404. Confirm the mailbox exists and is monitored.

## Done in this pass, noted so nobody re-does it

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

- **Analytics.** Still nothing installed. Plausible or PostHog per the usual
  stack. `/services` tells visitors analytics is "wired and verified" on every
  build, so this one is a little pointed.
- **Testimonials on `/` are unattributed.** Three quotes with no name, business
  or photograph read as invented whether or not they are. Attribute them or
  cut them.
- **`_dev/` ships.** It is served at `/_dev/` on the live site. Nothing there is
  secret, but it is scratch work. Consider a `.vercelignore`.
- **The runic wordmark** you picked is still not built. Elder Futhark risks
  tofu on a device without the glyphs, so it wants inline SVG runes rather than
  a third font family.

## Verified and fine

- Icons: `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest`.
- `og.png`, 1200x630, rendered from the film in the current brand.
- Security headers, `cleanUrls` and redirects in `vercel.json`.
- Every page passes the four harness checks in `scrollcraft/verify/`:
  links resolve, no text painted over, no contrast failure, every target 24x24.
