# Design of Man

The studio's own site. A static site with one serverless function — no
framework, no build step, no dependencies in the page.

**Live:** https://www.designofman.com

## Layout

```
index.html               the homepage: scrubbed film, then the site (hand-written)
*.html                   generated pages — do not edit these directly
insights/                the article section, also generated
api/contact.mjs          the form endpoint (Vercel serverless function)
assets/
  css/                   fonts.css, vendor/scrollcraft.css (engine), v3.css (theme)
  js/                    v3.js (home), page.js (interior), bar.js, form.js, vendor/scrollcraft.js
  fonts/                 self-hosted Instrument Serif + DM Sans, SIL OFL
  video/ img/ journey/   the film, screenshots, frame sequences
scripts/                 the page generators — edit these
scrollcraft/verify/      the gates
_dev/preflight.py        the pre-deploy check
```

The interior pages are **generated**. Editing `work.html` by hand works until
the next build, then it is gone. Edit `scripts/build_work.py` instead.

`index.html` is hand-written because the film, the boot panel and the bezel
exist on no other page — but its schema graph, footer, script set and
cache-buster come from the same source as everything else, via
`scripts/sync_index.py`. Those four blocks had already drifted once.

## Building

```bash
python3 scripts/pages.py
for p in work services studio process pricing contact case pay 404 local insights; do
  python3 "scripts/build_$p.py"
done
python3 scripts/sync_index.py
python3 scripts/build_poster.py     # needs Pillow; only after replacing the poster
python3 scripts/build_meta.py       # sitemap.xml, robots.txt, llms.txt
```

`build_meta.py` derives the sitemap from the canonical tag of every page that is
not `noindex`, so it cannot drift from the page set. `lastmod` comes from git.

## The gates

```bash
./scrollcraft/verify/run-all.sh
```

Runs the pre-deploy check plus seven browser checks. Each exists because the
thing it tests has already broken here at least once:

| Check | Catches |
|---|---|
| `preflight.py` | placeholders, missing files, meta lengths, sitemap drift |
| `links-check` | an internal href that resolves to nothing |
| `reveal-check` | a scroll reveal that never fires, leaving content invisible |
| `target-check` | a tap target under 24×24 (WCAG 2.2 SC 2.5.8) |
| `a11y-check` | contrast failures, focusable elements that are hidden |
| `coverage-check` | text painted over by a fixed layer at some scroll position |
| `form-check` | the contact endpoint reporting a lost lead as sent |
| `csp-check` | the shipped Content-Security-Policy breaking a page |
| `vitals-check` | CLS or LCP leaving Google's "good" band on a throttled phone |

**A red run means do not deploy.** `csp-check` caught a policy that would have
shipped a black homepage; `form-check` caught a rate limiter that locked out
anyone who mistyped their email.

## Deploying

See [DEPLOY.md](DEPLOY.md) for environment variables, analytics, the domain and
the post-deploy checks. See [PRELAUNCH.md](PRELAUNCH.md) for the one remaining
blocker and what has already been closed.

## Notes

- Respects `prefers-reduced-motion`: the film and every reveal freeze into a
  static frame.
- Self-hosted fonts, no third-party request on first paint, no cookie banner
  needed — the analytics are served from the deployment's own origin.
- There is deliberately **no published telephone number**. The site previously
  carried a fictional 555 number in the structured data of every page.
- No client metric appears anywhere on the site unless it can be reproduced from
  the client's own dashboard in the window named beside it.
