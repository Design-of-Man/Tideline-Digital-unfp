# Design of Man

The studio's own site: **https://www.designofman.com**. Static HTML, one
stylesheet, one script. Forms go to our own `/api/contact` (Resend). No framework and no build step
on Vercel; the HTML in the repo is what ships.

## Layout

```
index.html …            generated pages (do not edit by hand)
assets/css/site.css     the whole design system: tokens first, then components
assets/js/site.js       every interaction: smooth scroll, preloader, reveals,
                        hero shrink, beam, pinned process, stacking cards, form
assets/js/vendor/       Lenis (smooth scroll, MIT)
assets/fonts/           Instrument Serif, DM Sans, JetBrains Mono (SIL OFL)
assets/video/lighthouse the Jupiter Inlet Lighthouse hero loop and posters
assets/img/work/        First Rehabilitation before/after screenshots
scripts/shell.py        constants, <head>, header, menu, footer, components
scripts/build.py        every page's content, plus sitemap, robots, llms.txt,
                        and the CSP hash in vercel.json
scripts/legal.py        privacy, terms, cookies copy
scripts/build_lighthouse.py   re-encodes the hero footage (needs ffmpeg)
_dev/                   not deployed: preflight gate, OG image template
```

## Building

```bash
python3 scripts/build.py      # writes every .html, sitemap.xml, robots.txt, llms.txt, vercel.json CSP
python3 _dev/preflight.py     # must print READY TO DEPLOY
```

Edit content in `scripts/build.py` (or `scripts/legal.py`), never in the
generated HTML: the next build overwrites it. Asset URLs carry a cache-buster
derived from the CSS/JS bytes, so it changes exactly when they do.

The one inline script (in `shell.py`, `INLINE_JS`) is hashed into the
Content-Security-Policy by the build. Change it and rebuild, or the browser
will refuse to run it.

## The homepage, top to bottom

1. **Preloader** (first visit per tab only, skipped for reduced motion): a
   counter tied to the hero poster actually loading, then a curtain wipe.
2. **Lighthouse hero**: the drone loop around the Jupiter Inlet Light. As you
   scroll, the frame contracts into a rounded card and the caption appears.
3. Statement that brightens word by word as it is read.
4. Velocity-reactive marquee of services.
5. Services accordion with tags and detail.
6. First Rehabilitation case: draggable before/after (keyboard accessible),
   counted-up measured results.
7. **The beam**: a lamp sweeps the night section and lights the headline
   only as the cone crosses it. One CSS custom property drives both.
8. Process as a pinned horizontal scroll (native sideways scroll on phones).
9. Refusals as stacking cards.
10. Plans with cursor spotlight, FAQ, contact form, footer wordmark.

Everything is visible without JavaScript, and `prefers-reduced-motion` turns
off the preloader, pinning, scrubbing and smooth scroll.

## Contact form

Both forms post to **`/api/contact`** (`api/contact.js`, a zero-dependency
Vercel function). It stores the enquiry first, through the agency portal's
`contact-lead` Supabase function (table `public.leads`, site
`designofman.com`), then emails it through **Resend** from the verified
`designofman.com` domain, with reply-to set to the sender, and sends the
sender a short confirmation (first name and fixed text only). It answers
`{"success":"true"}` when the enquiry was stored or emailed.

With JavaScript, `site.js` posts JSON and shows a thank-you only when the body
says `success: "true"`. Any failure hands the visitor's message to their own
mail app, filled in. Without JavaScript the form posts natively and the
function redirects to `/contact?sent=1`.

Vercel env on project `tideline-digital-unfp`: `RESEND_API_KEY`, `LEAD_TO`
(hello@designofman.com), optional `LEAD_CC`, `LEAD_FROM`, `CONFIRM_FROM`.
Resend's DNS records live on `send`, `rsend` and `resend._domainkey`; the root
MX and SPF belong to Google Workspace and must not change.

Until 2026-10-30 the forms posted to FormSubmit, which went down on 2026-10-28
(Cloudflare 521) and dropped every enquiry. Don't move them back.

## Performance rules (learned the hard way)

The first version of the beam animated a registered custom property on a
full-height section. Custom-property animations run on the main thread and
repaint everything that reads them, every frame, even off screen: the whole
homepage dropped to ~30fps on a throttled CPU. So:

- Animate `transform` and `opacity` only. The beam cone is a rotated element.
- Main-thread animations (the lit heading's mask) run only while on screen.
- Scroll handlers write styles straight onto the element that moves, only
  when the value changed, and never read layout inside the loop.
- No `backdrop-filter`, no permanent `will-change` on repeated components.

## Checks run on this build

- axe-core WCAG 2.2 AA on all 12 pages: 0 violations
- No JS errors, no horizontal overflow at 1440px or 390px
- No CSP violations under the production policy
- Throttled phone (4x CPU, slow network): homepage LCP ~2.0s, CLS 0 on every page measured
- Homepage scroll on a 4x throttled CPU: 0 long tasks, median frame 16.7ms
