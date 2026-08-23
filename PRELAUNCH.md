# Pre-launch checklist

Everything here is a **placeholder that will survive launch unless someone
removes it**. Nothing on this list is a bug; each one is a deliberate stand-in
waiting on a real value.

## Blocking — the site must not go to a custom domain with these in place

### 1. Phone number is fake
`(561) 555-0100` is a reserved-for-fiction 555 number. It appears in:

- `index.html` (JSON-LD `telephone`)
- `v2-contact.html`
- `home.html`, `work.html`, `pay.html`, `case-first-rehab.html`

`grep -rn "555-0100" --include="*.html" .`

### 2. Contact form has no endpoint yet
`index.html` → `#consult` form action is still
`https://formspree.io/f/YOUR_FORM_ID`.

`assets/js/form.js` keeps this from losing leads: while the action carries the
placeholder, submitting hands the filled-in fields to the visitor's mail client
addressed to `hello@designofman.com`, and the note under the form says so. The
moment the action becomes a real Formspree URL the handler steps aside and the
native POST runs — no other change needed.

`grep -rn "YOUR_FORM_ID" --include="*.html" .`

> The fallback is a stopgap, not the plan. A visitor on a device with no mail
> client configured still cannot send. Set the real ID.

### 3. Email address unconfirmed
`hello@designofman.com` is used in the JSON-LD, the form fallback and the
footer. Confirm the mailbox exists and is monitored.

## Non-blocking, but do them

- **Analytics.** Nothing is installed. Plausible or PostHog per the usual stack.
- **`sitemap.xml`** still lists the pre-rebuild URL set and does not include the
  new `/`. Rewrite when the final page set is settled.
- **`/work`, `/pay`, `case-first-rehab`** are still on the old cream/brass brand
  with three font families. They are linked from the new nav, so the visual
  break is visible to anyone who clicks Work.
- **`v2.html`, `v2-process.html`, `v2-studio.html`, `v2-contact.html`** are now
  superseded by `/`. Decide whether they redirect or are deleted.
- **404 page** does not exist.

## Verified and fine

- Icons: `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest`.
- `og.png` — 1200×630, rendered from the film in the current brand.
- Security headers and `cleanUrls` are already set in `vercel.json`.
