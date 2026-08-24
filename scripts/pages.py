#!/usr/bin/env python3
"""Emit the interior pages of designofman.com.

The site has no build step and is served as static files, so this script is
run by hand and its OUTPUT is what ships. It exists for one reason: the header,
the footer, the meta block and the icon set have to be byte-identical on every
page. Three of the four pages that previously repeated that markup by hand had
a different, broken mobile nav. One source, one shape.

Run from the repo root:  python3 scripts/pages.py
"""
import os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
V    = "20260826a"                       # cache-buster, bumped per deploy
SITE = "https://www.designofman.com"
MAIL = "hello@designofman.com"
TEL   = "+1-561-555-0100"                # PLACEHOLDER: see PRELAUNCH.md
TELH  = "+15615550100"
TELD  = "(561) 555-0100"

LOGO = (ROOT / "scripts" / "logo.svg").read_text().strip()

# Header nav. Four items is the most that survives 390px without a disclosure
# button; Process, Pricing and Pay are reachable from the footer and from the
# body of the pages that own them.
NAV = [("/work", "Work"), ("/services", "Services"),
       ("/studio", "Studio"), ("/contact", "Contact")]

FOOTNAV = [("/work", "Work"), ("/services", "Services"), ("/process", "Process"),
           ("/studio", "Studio"), ("/pricing", "Pricing"),
           ("/contact", "Contact"), ("/pay", "Pay")]

LD = ('{"@context":"https://schema.org","@type":"ProfessionalService","name":"Design of Man",'
      '"description":"Website creation and management. Strategy, design, build, and ongoing care.",'
      f'"url":"{SITE}/","email":"{MAIL}","telephone":"{TEL}",'
      '"areaServed":"United States","priceRange":"$$",'
      '"address":{"@type":"PostalAddress","addressLocality":"Jupiter","addressRegion":"FL","addressCountry":"US"},'
      '"serviceType":["Website Development","Web App Development","Web Hosting and Maintenance"]}')


def head(title, desc, path, robots="index, follow", extra="", canonical=True):
    full = f"Design of Man &mdash; {title}" if title else "Design of Man"
    CANON = (f'<link rel="canonical" href="{SITE}{path}">' if canonical
             else "<!-- no canonical: this page is a status response, not a destination -->")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#0b0c0e">
<title>{full}</title>
{CANON}
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:site_name" content="Design of Man">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{full}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}/og.png">
<link rel="icon" href="/favicon.svg?v={V}" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v={V}">
<link rel="manifest" href="/site.webmanifest?v={V}">
<link rel="preload" href="/assets/fonts/instrument-serif-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dm-sans-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css?v={V}">
<link rel="stylesheet" href="/assets/css/vendor/scrollcraft.css?v={V}">
<link rel="stylesheet" href="/assets/css/v3.css?v={V}">
<script type="application/ld+json">
{LD}
</script>{extra}
</head>
<body class="has-bar">

<a class="skip-link" href="#main">Skip to content</a>

{header(path)}

<main id="main">
"""


def header(path):
    cur = ' aria-current="page"'
    links = "".join(
        '\n    <a href="%s"%s>%s</a>' % (h, cur if h == path else "", t)
        for h, t in NAV)
    return f"""<header class="bar">
  <a href="/" class="mark">{LOGO}<span>Design of Man</span></a>
  <nav aria-label="Main">{links}
  </nav>
</header>"""


def nxt(href, kicker, label):
    return f"""
<a class="next" href="{href}">
  <div class="sc-wrap">
    <span>{kicker}</span>
    <strong>{label}</strong>
  </div>
</a>
"""


def foot():
    links = "".join(f'\n      <a href="{h}">{t}</a>' for h, t in FOOTNAV)
    return f"""</main>

<footer class="site-foot">
  <div class="sc-wrap">
    <a href="/" class="mark">{LOGO}<span>Design of Man</span></a>
    <nav aria-label="Footer">{links}
    </nav>
    <small>&copy; 2026 Design of Man. Website creation and management. Jupiter, Florida.</small>
  </div>
</footer>

<script src="/assets/js/vendor/scrollcraft.js?v={V}"></script>
<script src="/assets/js/page.js?v={V}"></script>
<script src="/assets/js/form.js?v={V}" defer></script>
</body>
</html>
"""


def phero(h1, lede, meta=None, cta=None, back=None):
    out = ['<section class="phero">\n  <div class="sc-wrap">']
    if back:
        out.append(f'    <a class="back" href="{back[0]}">{back[1]}</a>')
    out.append(f'    <h1 class="sc-display sc-display--lg" data-sc-kinetic="lines">{h1}</h1>')
    out.append(f'    <p class="sc-body" data-sc-in>{lede}</p>')
    if meta:
        out.append('    <div class="phero__meta" data-sc-in>'
                   + "".join(f"<span>{m}</span>" for m in meta) + "</div>")
    if cta:
        out.append('    <div class="phero__cta" data-sc-in>'
                   + "".join(f'<a class="btn{c[2]}" href="{c[0]}">{c[1]}</a>' for c in cta)
                   + "</div>")
    out.append("  </div>\n</section>\n")
    return "\n".join(out)


def write(name, body):
    (ROOT / name).write_text(body)
    print(f"  {name:26} {len(body):7,} bytes")
