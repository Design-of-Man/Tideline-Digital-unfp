#!/usr/bin/env python3
"""Emit the interior pages of designofman.com.

The site has no build step and is served as static files, so this script is
run by hand and its OUTPUT is what ships. It exists for one reason: the header,
the footer, the meta block and the icon set have to be byte-identical on every
page. Three of the four pages that previously repeated that markup by hand had
a different, broken mobile nav. One source, one shape.

Run from the repo root:  python3 scripts/pages.py
"""
import json, os, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
V    = "20260903a"                       # cache-buster, bumped per deploy
SITE = "https://www.designofman.com"
MAIL = "hello@designofman.com"

# There is no telephone constant. The site carried a reserved-for-fiction 555
# number on four pages and in the structured data of every one of them, which
# is worse than no number at all: a search engine reads it as the business's
# real NAP data. Email and the form are the contact path until a real line
# exists. Adding one back means a `TEL`/`TELH`/`TELD` triple here and a
# "telephone" key in LOCAL below -- nowhere else.

LOGO = (ROOT / "scripts" / "logo.svg").read_text().strip()

# Vercel Web Analytics and Speed Insights, served from the deployment's own
# origin rather than a vendor CDN. That matters twice: the Content-Security-
# Policy in vercel.json can stay at script-src 'self' with no third-party host
# punched through it, and there is no cross-origin request to consent to, so
# the site needs no cookie banner. Both are inert until enabled in the Vercel
# project settings, where the /_vercel/* routes are switched on.
ANALYTICS = ('<script defer src="/_vercel/insights/script.js"></script>\n'
             '<script defer src="/_vercel/speed-insights/script.js"></script>')

# Header nav. Four items is the most that survives 390px without a disclosure
# button; Process, Pricing and Pay are reachable from the footer and from the
# body of the pages that own them.
NAV = [("/work", "Work"), ("/services", "Services"),
       ("/studio", "Studio"), ("/contact", "Contact")]

FOOTNAV = [("/work", "Work"), ("/services", "Services"), ("/process", "Process"),
           ("/studio", "Studio"), ("/pricing", "Pricing"), ("/insights", "Insights"),
           ("/web-design-jupiter-fl", "Jupiter, FL"),
           ("/contact", "Contact")]

# ------------------------------------------------------------------ schema --
# One @graph per page rather than a pile of loose <script> blocks. Every node
# carries a stable @id so the studio, the site and the page reference each
# other instead of being re-declared -- which is what lets Google resolve the
# whole site to a single entity rather than eight unrelated business listings.
#
# There is no "telephone" and no "sameAs": both were invented in the previous
# build and a fabricated social profile or phone number in structured data is
# worse than an absent one. Add them here when they are real.
STUDIO_ID  = f"{SITE}/#studio"
WEBSITE_ID = f"{SITE}/#website"

STUDIO = {
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": STUDIO_ID,
    "name": "Design of Man",
    "alternateName": "Design of Man Studio",
    "description": ("Website creation and management for small businesses. Strategy, "
                    "design, build, and ongoing care that does not stop at launch."),
    "url": f"{SITE}/",
    "email": MAIL,
    "logo": {"@type": "ImageObject", "@id": f"{SITE}/#logo",
             "url": f"{SITE}/assets/img/logo-mark.png", "caption": "Design of Man"},
    "image": f"{SITE}/og.png",
    "priceRange": "$$",
    "currenciesAccepted": "USD",
    "paymentAccepted": "Credit Card, ACH",
    "address": {"@type": "PostalAddress", "addressLocality": "Jupiter",
                "addressRegion": "FL", "postalCode": "33477", "addressCountry": "US"},
    "geo": {"@type": "GeoCoordinates", "latitude": 26.9342, "longitude": -80.0942},
    "areaServed": [
        {"@type": "AdministrativeArea", "name": "Palm Beach County, Florida"},
        {"@type": "AdministrativeArea", "name": "Martin County, Florida"},
        {"@type": "Country", "name": "United States"},
    ],
    "knowsAbout": ["Web design", "Web development", "Search engine optimization",
                   "Website maintenance", "Core Web Vitals", "Web accessibility"],
    "openingHoursSpecification": [{
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00", "closes": "17:00"}],
    "hasOfferCatalog": {
        "@type": "OfferCatalog", "name": "Website creation and management",
        "itemListElement": [
            {"@type": "Offer", "itemOffered": {
                "@type": "Service", "name": "Website design and development",
                "description": "Custom sites built from a written scope, not a template."}},
            {"@type": "Offer", "itemOffered": {
                "@type": "Service", "name": "Web application development",
                "description": "Booking, accounts, payments and dashboards on the open web."}},
            {"@type": "Offer", "itemOffered": {
                "@type": "Service", "name": "Website care and hosting",
                "description": "Managed hosting, security updates, backups and content changes."}},
            {"@type": "Offer", "itemOffered": {
                "@type": "Service", "name": "Search and performance",
                "description": "Technical SEO, Core Web Vitals and analytics that is actually read."}},
        ]},
}

WEBSITE = {
    "@type": "WebSite", "@id": WEBSITE_ID, "url": f"{SITE}/",
    "name": "Design of Man", "inLanguage": "en-US",
    "publisher": {"@id": STUDIO_ID},
}


def crumbs(trail):
    """trail: [(path, name), ...] -- the home crumb is added here."""
    items = [(f"{SITE}/", "Home")] + [(f"{SITE}{h}", n) for h, n in trail]
    return {"@type": "BreadcrumbList", "@id": f"{SITE}{trail[-1][0]}#crumbs",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
                for i, (u, n) in enumerate(items)]}


def faq(body, path):
    """FAQPage built by reading the page's own <details class="qa"> blocks.

    Hand-writing the schema next to the copy guarantees it drifts: someone
    edits an answer, nobody edits the JSON, and Google is served a question
    the page no longer answers. Scraping the rendered body cannot drift.
    """
    pairs = re.findall(
        r'<details class="qa"><summary>(.*?)</summary>(.*?)</details>', body, re.S)
    if not pairs:
        return []
    def text(h):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h)).strip()
    return [{
        "@type": "FAQPage", "@id": f"{SITE}{path}#faq",
        "mainEntity": [
            {"@type": "Question", "name": text(q),
             "acceptedAnswer": {"@type": "Answer", "text": text(a)}}
            for q, a in pairs],
    }]


def graph(path, title, desc, extra=None):
    page = {
        "@type": "WebPage", "@id": f"{SITE}{path}#page", "url": f"{SITE}{path}",
        "name": title, "description": desc, "inLanguage": "en-US",
        "isPartOf": {"@id": WEBSITE_ID}, "about": {"@id": STUDIO_ID},
        "primaryImageOfPage": {"@id": f"{SITE}/#logo"},
    }
    nodes = [STUDIO, WEBSITE, page] + list(extra or [])
    return ('<script type="application/ld+json">\n'
            + json.dumps({"@context": "https://schema.org", "@graph": nodes},
                         separators=(",", ":"), ensure_ascii=False)
            + "\n</script>")


def head(title, desc, path, robots="index, follow", extra="", canonical=True,
         nodes=None, og_type="website", title_full=None):
    # A long editorial headline makes a bad <title>: Google truncates around 60
    # characters and the brand prefix eats a third of that. `title_full` lets a
    # page set the tag independently of the headline shown on the page.
    full = title_full or (f"Design of Man &mdash; {title}" if title else "Design of Man")
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
<meta property="og:type" content="{og_type}">
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
{graph(path, full, desc, nodes)}{extra}
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
<script src="/assets/js/bar.js?v={V}" defer></script>
<script src="/assets/js/form.js?v={V}" defer></script>
{ANALYTICS}
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
    out = ROOT / name
    out.parent.mkdir(parents=True, exist_ok=True)   # /insights/<slug>.html
    out.write_text(body)
    print(f"  {name:26} {len(body):7,} bytes")
