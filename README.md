# Design of Man

The studio's own site: **https://www.designofman.com**. Static HTML, one
stylesheet, one script, one serverless function for the contact form. No
framework and no build step on Vercel; the HTML in the repo is what ships.

## Layout

```
index.html …            generated pages (do not edit by hand)
api/contact.mjs         the form endpoint (Vercel function, sends via Resend)
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

`api/contact.mjs` needs `RESEND_API_KEY` set in Vercel (Project, Settings,
Environment Variables). Optional: `CONTACT_TO`, `CONTACT_FROM` (must be on a
domain verified in Resend). Until the key is set, the endpoint answers 503
and the page hands the visitor's message to their own mail app, filled in.
It never shows success for a message that was not delivered.

## Checks run on this build

- axe-core WCAG 2.2 AA on all 12 pages: 0 violations
- No JS errors, no horizontal overflow at 1440px or 390px
- No CSP violations under the production policy
- Throttled phone (4x CPU, slow network): homepage LCP ~2.0s, CLS 0 on every page measured
