# Pre-launch checklist

Everything here is a **placeholder or an unverified claim that will survive
launch unless someone removes it**. None of it is a bug. Each one is a
deliberate stand-in waiting on a real value, or a number only you can confirm.

## Blocking — added by the legal/compliance pass (2026-09-14)

### 0. ~~The legal pages need a postal address~~ — decided 2026-09-14
Entity set to **Design of Man LLC**, phone set to the real number, and the
**street address is deliberately not published**.

The registered address is the owner's home. A website privacy policy does not
require a street address: UK/EU GDPR Article 13 requires the controller's
*identity and contact details*, which the entity name, a monitored email and a
real phone number satisfy, and service of process on a Florida LLC goes to the
registered agent, which is already public record at sunbiz.org. Publishing it
again on a page that gets scraped and archived adds exposure without adding a
route anyone lacked.

`ADDR` in `scripts/build_legal.py` is empty and both pages fall back to naming
the Division of Corporations filing. Setting it to a real string publishes it
again everywhere, so if a registered agent service or a virtual business
address is ever taken, put that there rather than the house.

**One future trigger:** CAN-SPAM requires a valid physical postal address in
every commercial email. The moment a newsletter starts, an address is needed —
in the email, not necessarily on the site.

## Blocking — the site must not go to a custom domain with these in place

### 1. ~~The phone number is fake~~ — done 2026-09-14
Set to (561) 324-1658 in `scripts/pages.py` and in the hand-maintained JSON-LD
of `index.html`. Nothing that ships carries a 555 number.

<details><summary>original note</summary>

`(561) 555-0100` is a reserved-for-fiction 555 number, and it is now on four
pages plus the structured data every page carries:

- the `ProfessionalService` JSON-LD in the shared head, so **every page**
- `studio.html`, `contact.html`, `pay.html` (three places on that one)

It is generated from `TEL`, `TELH` and `TELD` at the top of `scripts/pages.py`.
Change those three constants, re-run the page scripts, and it is fixed
everywhere at once.

`grep -rn "555-0100" --include="*.html" .`
</details>

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

### 3. ~~`/pay` has two live placeholders that take money~~ — switched off 2026-09-14
`/pay` is **off at the owner's request**. `pay.html` is not shipped, the tab is
out of every footer, the pricing CTA and the contact-page billing link are gone,
and `vercel.json` redirects `/pay` and `/pay.html` to `/contact` (temporary, not
301, so the URL is not burned). `scripts/build_pay.py` refuses to emit the page
unless run with `--enable`, so a routine rebuild cannot bring it back half-built.

To switch it on: set the two real values, run `python3 scripts/build_pay.py --enable`,
restore `("/pay", "Pay")` in `FOOTNAV`, and drop the two redirects.

<details><summary>original note</summary>

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
</details>

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

## Legal/compliance pass — 2026-09-14

- **Three fabricated testimonials removed from `/`.** Unattributed quotes that
  came from the original template and described clients who do not exist. The
  FTC's Rule on Consumer Reviews and Testimonials (16 CFR 465, in force since
  Oct 2024) treats an invented testimonial as a deceptive act with civil
  penalties per violation. This was the largest single exposure on the site.
  The band alternation either side was corrected so the rhythm still reads.

- **The generators still contained the discredited numbers.** `PRELAUNCH.md`
  recorded +186% / +72% / 2.4s as removed on 2026-08-24, and they were — from
  the *HTML*. `scripts/build_work.py` and `scripts/build_case.py` still carried
  them, so the next person to run a build would have silently republished
  claims this file already documents as false. Both now emit the measured
  figures (+50% clicks, +132% impressions, 22 enquiries) and the case study
  states the method and the permission alongside them.

- **HomeCrew and RegenOrtho are no longer named or shown.** Written permission
  exists for First Rehabilitation only. Publishing a client's trademark and
  screenshots of their site without it is their call, not ours. Both remain in
  the portfolio as described work with no name, no screenshot and no link, and
  the three image files are deleted. Restoring them is a revert plus the
  images, the moment permission is in writing.

- **`/privacy`, `/terms` and `/cookies` exist**, generated by
  `scripts/build_legal.py` through the same shell as every other page, linked
  from the footer of all 13 pages, and in the sitemap. They cover UK/EU GDPR
  (lawful basis, retention, transfers, rights, the ICO route), US state rights,
  and COPPA — the site is not directed to children and does not knowingly
  collect from under-13s.

- **Consent at the point of collection.** All three forms carry a required
  checkbox naming what the details are used for and linking the policy. The
  submission itself now carries the record. The box is 1.5rem so it clears the
  24x24 target rule the harness enforces.

- **No cookie banner, on purpose.** The site sets no cookies, loads no
  analytics, no pixels, and self-hosts its fonts. The only client-side storage
  is `dom.film.seen` in session storage, which is strictly necessary and
  exempt from consent under the e-privacy rules. `/cookies` says exactly that.
  **If analytics is ever added, `/cookies` and `/privacy` change in the same
  commit, and a cookie tool may then be genuinely required.**

- Verified after the change: preflight reports only the known `/pay` and new
  `REPLACE_` blockers; links, a11y/contrast, targets, reveals and coverage all
  pass on the new pages and every page touched.

## Media provenance — recorded 2026-09-14

Who made each asset, because "we cannot remember where that came from" is the
answer that costs money later.

- **The homepage film (`assets/video/sc/film*.mp4`) is AI generated.** It is
  the Viking sequence, and it is the single largest piece of published media on
  the site. Two things follow from that:

  1. **Generated on a paid Higgsfield subscription** (confirmed 2026-09-14),
     which is the tier that carries commercial-use rights. Keep the invoice, the
     plan name and the generation record with the project files: the licence is
     only useful if it can be produced later, and "we were on the paid plan" is
     not evidence two years from now. Re-check the terms if the subscription
     ever lapses, since some grants are tied to an active plan.
  2. **Purely AI-generated output has no human author, so it is generally not
     copyrightable in the US** (Copyright Office guidance; *Thaler*). Design of
     Man can use the film, but cannot stop a competitor using the same render.
     That is a commercial fact, not a liability, and it is an argument for the
     brand resting on the wordmark and the build quality rather than on footage
     anyone can regenerate.

  The film is a stylised brand piece, not documentary footage of the studio or
  of client work, so nobody could mistake it for a record of real events. If AI
  footage is ever used to depict the team, an office or a client result, that
  becomes a deception question rather than a licensing one.

- **`pc-assembly.*` is AI generated** and is currently unreferenced (below).
- **`assets/img/work/firstrehab-*.jpg`** are screenshots of a real client site,
  published with that client's permission.
- **The logo, the walking mark, `og.png` and `laptop-screen.jpg`** are our own.

### 49MB of video ships and nothing loads it

`viking-hero.*`, `pc-assembly.*` and `laptop-open.*` total ~49MB in
`assets/video/`. `viking-hero` is referenced by nothing at all; the other two
are referenced only by `assets/js/pc-assembly.js`, `assets/js/laptop-open.js`
and `assets/js/scroll-hud.js`, **none of which are loaded by any page**. The
`assets/img/pc-frames/` sequence is likewise unreferenced.

Left in place rather than deleted because this looks like a laptop-assembly
rework in progress, and deleting someone's working set to save deploy weight is
not a call to make on their behalf. If the rework is dead, removing those files
and the three orphaned scripts takes the deploy down by roughly 49MB.
