# Deploying Design of Man

Static site. No build step — Vercel serves the files as they are.

---

## Before you deploy: three credentials

`_dev/preflight.py` **will fail** until these are set. That is deliberate: without
them the chat and payment forms silently go nowhere, which is worse than not
shipping.

### 1. Chat widget endpoint

Create a Formspree form, then in `index.html`:

```html
<script src="assets/js/chat-widget.js"
        data-endpoint="https://formspree.io/f/XXXXXXX"   <!-- was REPLACE_CHAT_ID -->
        data-phone="+15615550100"
        data-phone-label="(561) 555-0100"
        data-email="hello@designofman.com" defer></script>
```

### 2 & 3. Billing page

In `pay.html`:

| Placeholder | Replace with |
|---|---|
| `REPLACE_FORM_ID` | Formspree endpoint for the invoice-resend form |
| `REPLACE_PORTAL_LINK` | Stripe Customer Portal login URL (see `BILLING-SETUP.md`, step 5) |

Then:

```bash
python3 _dev/preflight.py     # must print READY TO DEPLOY
```

---

## Deploy

### Git-connected project (recommended)

```bash
git add -A
git commit -m "3D hero, laptop assembly, chat widget, billing page"
git push
```

Vercel builds a preview automatically. Check it, then promote to production from
the dashboard. If something is wrong you revert a commit, not a live site.

### Vercel CLI

```bash
npm i -g vercel
vercel            # preview deployment
vercel --prod     # promote once you're happy
```

---

## What ships

```
index.html              home — 3D hero, laptop assembly, chat widget
work.html               portfolio
case-first-rehab.html   case study
pay.html                client billing
assets/js/dom-3d.bundle.js    Three.js + hero + laptop  (157 KB gzipped)
assets/js/chat-widget.js      chat capture              (5.5 KB gzipped)
og.png  robots.txt  sitemap.xml  vercel.json
```

`_dev/` and markdown files are excluded by `.vercelignore`.

### What's in `_dev/` (not deployed)

| File | Why keep it |
|---|---|
| `preflight.py` | the pre-deploy gate |
| `laptop-assembly.source.js` | readable source for the laptop scene |
| `hero3d.source.js`, `mount.source.js` | sources for the hero and the mount wrapper |
| `laptop.html` | standalone animation demo |
| `index-hero-2d.html` | the 2D-canvas hero variant, if you ever want to A/B it |
| `laptop-assembly.bundle.js`, `hero-3d.bundle.js` | individual bundles, superseded by the combined one |

### Rebuilding the 3D bundle

Only needed if you edit `_dev/laptop-assembly.source.js` or `_dev/hero3d.source.js`:

```bash
npm i three esbuild
# copy sources into a working dir, change the three import to bare 'three'
npx esbuild all.js --bundle --minify --format=iife \
  --target=es2019 --outfile=assets/js/dom-3d.bundle.js
```

Shipping the hero and laptop as one bundle keeps Three.js to a single copy —
157 KB gzipped instead of 291 KB.

---

## After it's live

- [ ] Real submission through the chat widget; confirm the email arrives
- [ ] Real submission through the billing resend form
- [ ] Open the Stripe portal link and confirm it loads
- [ ] `sitemap.xml` submitted in Google Search Console
- [ ] Lighthouse mobile run — see the caveat below
- [ ] Test the 3D on a real mid-range Android, not just desktop

### Performance caveat

The homepage carries **157 KB gzipped of JavaScript above the fold** for the 3D
hero. That will show up in Largest Contentful Paint and it is the one thing on
this site that could cost you in search.

Two ways to soften it if Lighthouse comes back poor:

1. **Swap the homepage hero back to 2D.** `_dev/index-hero-2d.html` is the same
   page with the canvas hero — zero extra weight, and the laptop assembly still
   loads further down the page where it does not block first paint.
2. **Defer the hero.** Load the 3D bundle only after first paint and let the CSS
   gradient stand in until it arrives.

Worth measuring before deciding. You are selling SEO to local businesses, so
your own Core Web Vitals are a sales asset.

---

## Known open items

- **Mobile nav.** Below 1024px the menu sits off-screen via `transform` while
  staying `visibility: visible` — the document reports ~702 px wide on a 390 px
  viewport, and keyboard users can tab into the hidden menu. One-line fix:
  `.nav-links { visibility: hidden }` and `visible` when open.
- **Placeholder content.** Phone `(561) 555-0100`, the testimonials, and the
  stats (120+ sites, 99.9% uptime, 14 yrs) are still from the original build.
- **Brand split.** Visible copy says *Design of Man*; canonicals, schema `@id`
  and the email domain say `tidelinedigital.com`. Search engines will read those
  as two businesses. Decide which is canonical and do a find-and-replace.
- **Four dead `href="#"` links** in the footer social icons.
