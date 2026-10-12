#!/usr/bin/env python3
"""The shared shell of designofman.com: constants, <head>, header, menu,
footer, and the components every page is built from.

Nothing here writes a page. scripts/build.py imports this and emits every
HTML file the site ships; scripts/legal.py holds the legal copy. Change a
phone number, a nav item or the footer here and it changes on every page in
the same build. That is the whole point: the previous site had pages whose
headers had quietly drifted apart.
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

SITE  = "https://www.designofman.com"
NAME  = "Design of Man"
ENTITY = "Design of Man LLC"
MAIL  = "hello@designofman.com"
TEL   = "+1-561-324-1658"
TELH  = "+15613241658"
TELD  = "(561) 324-1658"
HOURS = "Monday to Friday, 9 to 5 Eastern"
COORDS = "26&deg;56&prime;53&Prime;N &middot; 80&deg;04&prime;55&Prime;W"
YEAR  = 2026

# Header nav, numbered. Contact is the button beside it, not a sixth link.
NAV = [("/work", "Work"), ("/services", "Services"), ("/process", "Process"),
       ("/studio", "Studio"), ("/pricing", "Pricing")]
MENU = [("/", "Home")] + NAV + [("/contact", "Contact")]
LEGAL = [("/privacy", "Privacy"), ("/terms", "Terms"), ("/cookies", "Cookies")]


def _logo():
    svg = (ROOT / "scripts" / "logo.svg").read_text().strip()
    svg = svg.replace(' role="img" aria-label="Design of Man"', ' aria-hidden="true" focusable="false"')
    return svg


LOGO = _logo()

ARROW = ('<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" '
         'aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>')
ARROW_BIG = ('<svg class="next__arrow" viewBox="0 0 64 64" fill="none" stroke="currentColor" '
             'stroke-width="1.5" aria-hidden="true"><path d="M8 56L56 8M20 8h36v36"/></svg>')
CHECK = ('<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" '
         'aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg>')
STAR = ('<svg class="marquee__star" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">'
        '<path d="M20 0l2.6 14.2L34.1 5.9l-8.3 11.5L40 20l-14.2 2.6 8.3 11.5-11.5-8.3L20 40l-2.6-14.2'
        '-11.5 8.3 8.3-11.5L0 20l14.2-2.6L5.9 5.9l11.5 8.3z"/></svg>')
SPLIT = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
         'aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>')

# The lighthouse in the beam section. Drawn: it is a lamp for the effect to
# sweep from, not a stand-in for a photograph.
LAMP = """<svg class="beam__lamp" viewBox="0 0 100 230" aria-hidden="true">
  <path d="M50 2v12" stroke="rgba(236,231,222,.4)" stroke-width="2"/>
  <path class="tower" d="M36 30L50 13l14 17z"/>
  <rect class="lamp-glow" x="40" y="31" width="20" height="19" rx="2"/>
  <path d="M40 31v19M46.5 31v19M53.5 31v19M60 31v19" stroke="#0f2027" stroke-width="1.4"/>
  <rect class="band" x="31" y="50" width="38" height="6" rx="1"/>
  <path class="tower" d="M37 56h26l9 174H28z"/>
  <rect x="47" y="96" width="6" height="10" rx="1" fill="rgba(255,208,138,.35)"/>
  <rect x="47" y="150" width="6" height="10" rx="1" fill="rgba(255,208,138,.25)"/>
</svg>"""

# Decorative rings behind interior page heroes: the light's range, drawn.
RINGS = """<svg class="phero__glyph" viewBox="0 0 400 400" fill="none" aria-hidden="true">
  <circle cx="200" cy="200" r="198" stroke="currentColor"/>
  <circle cx="200" cy="200" r="150" stroke="currentColor"/>
  <circle cx="200" cy="200" r="102" stroke="currentColor"/>
  <circle cx="200" cy="200" r="54" stroke="currentColor"/>
  <path d="M200 0v400M0 200h400" stroke="currentColor" stroke-dasharray="2 6"/>
  <circle cx="200" cy="200" r="5" fill="#e5623a"/>
</svg>"""


def asset_version():
    """Cache-buster derived from the bytes of the CSS and JS, so it changes
    exactly when they do and never needs bumping by hand."""
    h = hashlib.sha1()
    for p in ["assets/css/fonts.css", "assets/css/site.css", "assets/js/site.js",
              "assets/js/vendor/lenis.min.js"]:
        h.update((ROOT / p).read_bytes())
    return h.hexdigest()[:10]


V = asset_version()

LD_ORG = ('{"@context":"https://schema.org","@graph":['
          '{"@type":"ProfessionalService","@id":"%(s)s/#studio","name":"Design of Man",'
          '"legalName":"%(e)s","url":"%(s)s/","email":"%(m)s","telephone":"%(t)s",'
          '"image":"%(s)s/og.png","logo":"%(s)s/assets/img/logo.png",'
          '"description":"A small web studio in Jupiter, Florida. Custom websites and web apps: strategy, design, build, hosting and ongoing care.",'
          '"foundingDate":"2024","areaServed":[{"@type":"State","name":"Florida"},{"@type":"Country","name":"United States"}],'
          '"priceRange":"$$","address":{"@type":"PostalAddress","addressLocality":"Jupiter","addressRegion":"FL","addressCountry":"US"},'
          '"geo":{"@type":"GeoCoordinates","latitude":26.9483,"longitude":-80.0820},'
          '"openingHours":"Mo-Fr 09:00-17:00",'
          '"serviceType":["Website Design","Website Development","Web App Development","Web Hosting and Maintenance"]},'
          '{"@type":"WebSite","@id":"%(s)s/#site","url":"%(s)s/","name":"Design of Man","publisher":{"@id":"%(s)s/#studio"}}'
          ']}') % {"s": SITE, "e": ENTITY, "m": MAIL, "t": TEL}


# The one inline script on the site. It has to run before first paint, or the
# reveal states and the preloader would flash. build.py hashes this exact
# string into the Content-Security-Policy in vercel.json, so editing it here
# and rebuilding keeps the two in step.
INLINE_JS = ("(function(d){var r=d.documentElement;r.classList.add('js');try{if(r.hasAttribute('data-intro')"
             "&&!sessionStorage.getItem('dom.intro.seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)"
             "r.classList.add('pre-on')}catch(e){}})(document)")


def roll(label):
    return f'<span class="roll"><span>{label}</span><span aria-hidden="true">{label}</span></span>'


def btn(href, label, cls="", magnet=True, arrow=True):
    m = ' data-magnet=".22"' if magnet else ""
    a = f'<span class="btn__arrow">{ARROW}</span>' if arrow else ""
    c = f"btn {cls}".strip()
    return f'<a class="{c}" href="{href}"{m}>{roll(label)}{a}</a>'


# ---------------------------------------------------------------- shell ---

def head(title, desc, path, *, robots="index, follow", canonical=True,
         extra_head="", intro=False, ld_extra=""):
    full = f"{title} &mdash; {NAME}" if title else f"{NAME} &mdash; Web design studio in Jupiter, Florida"
    canon = (f'<link rel="canonical" href="{SITE}{path}">' if canonical else "")
    intro_attr = " data-intro" if intro else ""
    ld = LD_ORG + (f'\n</script>\n<script type="application/ld+json">\n{ld_extra}' if ld_extra else "")
    return f"""<!DOCTYPE html>
<html lang="en"{intro_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{full}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#0a171c">
<meta name="color-scheme" content="light">
{canon}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{NAME}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Jupiter Inlet Lighthouse at the mouth of the inlet, with the Design of Man wordmark">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{full}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}/og.png">
<link rel="icon" href="/favicon.svg?v={V}" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v={V}">
<link rel="manifest" href="/site.webmanifest?v={V}">
<link rel="preload" href="/assets/fonts/instrument-serif-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dm-sans-normal-latin.woff2" as="font" type="font/woff2" crossorigin>{extra_head}
<link rel="stylesheet" href="/assets/css/fonts.css?v={V}">
<link rel="stylesheet" href="/assets/css/site.css?v={V}">
<script>{INLINE_JS}</script>
<script src="/assets/js/vendor/lenis.min.js?v={V}" defer></script>
<script src="/assets/js/site.js?v={V}" defer></script>
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{preloader() if intro else ""}{header(path)}
{menu()}
<main id="main">
"""


def preloader():
    return f"""<div class="pre is-on" aria-hidden="true">
  <div class="pre__beam"></div>
  <div class="pre__mark">{LOGO}</div>
  <p class="pre__word"><span>Design of Man</span></p>
  <p class="pre__count"><b>000</b><small>%</small></p>
</div>
"""


def header(path):
    links = "".join(
        f'\n      <a href="{h}"{" aria-current=\"page\"" if (h == path or (h == "/work" and path.startswith("/case"))) else ""}>'
        f'{roll(t)}<sup>{i:02d}</sup></a>'
        for i, (h, t) in enumerate(NAV, 1))
    return f"""<header class="hdr" id="top">
  <div class="wrap hdr__in">
    <a class="brand" href="/" aria-label="{NAME}, home">{LOGO}<span class="brand__word">Design of Man</span></a>
    <nav class="nav" aria-label="Main">{links}
    </nav>
    <span class="clock mono" title="Local time in Jupiter, Florida"><i aria-hidden="true"></i>Jupiter, FL&nbsp;&middot;&nbsp;<span data-clock>Eastern</span></span>
    {btn("/contact", "Let&rsquo;s talk", "btn--sm")}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-btn__lines" aria-hidden="true"></span>Menu</button>
  </div>
  <span class="progress" aria-hidden="true"></span>
</header>"""


def menu():
    links = "".join(f'\n    <a href="{h}"><span class="idx">{i:02d}</span>{t}</a>'
                    for i, (h, t) in enumerate(MENU))
    return f"""<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="menu__top">
    <a class="brand" href="/" aria-label="{NAME}, home">{LOGO}<span class="brand__word">Design of Man</span></a>
    <button class="menu-btn" style="display:inline-flex" type="button" data-close-menu>Close</button>
  </div>
  <nav class="menu__links" aria-label="Site">{links}
  </nav>
  <div class="menu__foot">
    <a href="mailto:{MAIL}">{MAIL}</a>
    <a href="tel:{TELH}">{TELD}</a>
    <span class="mono">Jupiter, FL &middot; <span data-clock>Eastern</span></span>
  </div>
</div>"""


def foot(cta=True):
    site = "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in MENU)
    legal = "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in LEGAL)
    cta_block = f"""
    <div class="finale__cta">
      <div>
        <p class="eyebrow">Free 30-minute consult</p>
        <h2 class="d-xl" data-split style="margin-top:1.5rem">Let&rsquo;s draw up <em>the plan.</em></h2>
        <a class="finale__mail" href="mailto:{MAIL}">{roll(MAIL)}</a>
      </div>
      {btn("/contact", "Book a free consult", "btn--light")}
    </div>""" if cta else ""
    return f"""</main>

<footer class="finale dark{"" if cta else " finale--bare"}" data-dark>
  <div class="wrap">{cta_block}
    <div class="foot">
      <div>
        <a class="brand" href="/" aria-label="{NAME}, home">{LOGO}<span class="brand__word">Design of Man</span></a>
        <p style="margin-top:1.25rem">Websites and web apps, designed, built and looked after by a small studio on the Jupiter Inlet.</p>
        <p class="mono foot__coords">{COORDS}</p>
      </div>
      <div><h3 class="mono">Site</h3><ul>{site}</ul></div>
      <div><h3 class="mono">Contact</h3><ul>
        <li><a href="tel:{TELH}">{TELD}</a></li>
        <li><a href="mailto:{MAIL}">{MAIL}</a></li>
        <li><span class="mono" style="color:var(--foam-2)">Mon&ndash;Fri, 9&ndash;5 ET</span></li>
        <li><span class="mono" style="color:var(--foam-2)">Now: <span data-clock>Eastern</span></span></li>
      </ul></div>
      <div><h3 class="mono">Legal</h3><ul>{legal}</ul></div>
    </div>
    <p class="wordmark" aria-hidden="true" data-reveal>Design of <em>Man</em></p>
    <div class="foot-base mono">
      <span>&copy; {YEAR} {ENTITY}. Jupiter, Florida.</span>
      <span>Hand-built. No trackers, no cookies.</span>
      <a class="to-top" href="#top">Back to top &uarr;</a>
    </div>
  </div>
</footer>
</body>
</html>
"""


# ----------------------------------------------------------- components ---

def phero(h1, lede, *, kicker, index, chips=(), ctas=(), back=None):
    chips_html = "".join(f'<span class="chip">{c}</span>' for c in chips)
    cta_html = ""
    if ctas:
        cta_html = '<div class="btn-row" data-reveal style="--d:200;margin-top:2rem">' + "".join(
            btn(h, t, c) for h, t, c in ctas) + "</div>"
    left = (f'<a class="back mono" href="{back[0]}">&larr; {back[1]}</a>' if back
            else f'<span class="eyebrow">{kicker}</span>')
    return f"""
<section class="phero" style="isolation:isolate">
  {RINGS}
  <div class="wrap">
    <div class="phero__top"><span>{left}</span><span class="mono" style="color:var(--ink-3)">{index}</span></div>
    <h1 class="d-xl" data-split>{h1}</h1>
    <div class="phero__foot">
      <div class="phero__meta" data-reveal>{chips_html}</div>
      <div><p class="lede" data-reveal style="--d:100">{lede}</p>{cta_html}</div>
    </div>
  </div>
</section>
"""


def sect_head(n, label, title, lede="", *, tag="h2", size="d-lg", extra=""):
    lede_html = f'\n      <p class="lede" data-reveal style="--d:120">{lede}</p>' if lede else ""
    return f"""    <div class="sect-head">
      <p class="idx"><b>({n:02d})</b><span>{label}</span></p>
      <div class="sect-head__body">
        <{tag} class="{size}" data-split>{title}</{tag}>{lede_html}{extra}
      </div>
    </div>
"""


def nxt(href, kicker, label):
    return f"""
<a class="next" href="{href}">
  <div class="wrap next__in">
    <div><span class="mono">{kicker}</span><strong>{label}</strong></div>
    {ARROW_BIG}
  </div>
</a>
"""


def marquee(items, dark=False, speed=0.6):
    def group(hidden):
        a = ' aria-hidden="true"' if hidden else ""
        inner = "".join(f'<span class="marquee__item">{t}</span>{STAR}' for t in items)
        return f'<div class="marquee__group"{a}>{inner}</div>'
    d = " dark" if dark else ""
    return f"""
<div class="marquee{d}" data-speed="{speed}" role="presentation">
  <div class="marquee__track">{group(False)}{group(True)}{group(True)}</div>
</div>
"""


def qa(items):
    return "\n".join(
        f'      <details class="qa"><summary>{q}<i aria-hidden="true"></i></summary>'
        f'<div class="qa__a"><p>{a}</p></div></details>' for q, a in items)


def tiles(items, *, cols="grid-3"):
    out = []
    for i, (t, p) in enumerate(items, 1):
        out.append(f'      <div class="tile" data-reveal style="--d:{(i - 1) % 3 * 90}">'
                   f'<span class="idx">{i:02d}</span><h3>{t}</h3><p>{p}</p></div>')
    return f'    <div class="{cols}">\n' + "\n".join(out) + "\n    </div>\n"


def stack(items):
    out = []
    for i, (t, p) in enumerate(items):
        out.append(f'      <article class="stack__card" style="--i:{i}"><span class="idx">{i + 1:02d} / {len(items):02d}</span>'
                   f'<h3>{t}</h3><p>{p}</p></article>')
    return '    <div class="stack">\n' + "\n".join(out) + "\n    </div>\n"


def compare(before, after, alt_b, alt_a, label, ratio="1200 / 621", reveal=True):
    r = ' data-reveal="clip"' if reveal else ""
    return f"""<div>
        <div class="ba" data-ba style="--ratio:{ratio}"{r}>
          <div class="ba__pane"><img src="/assets/img/work/{after}" alt="{alt_a}" loading="lazy" decoding="async" width="1200" height="621"></div>
          <div class="ba__pane ba__pane--before"><img src="/assets/img/work/{before}" alt="{alt_b}" loading="lazy" decoding="async" width="1200" height="524"></div>
          <span class="ba__line" aria-hidden="true"></span>
          <span class="ba__knob" aria-hidden="true">{SPLIT}</span>
          <span class="ba__tag ba__tag--before mono">Before</span>
          <span class="ba__tag ba__tag--after mono">After</span>
          <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="{label}: drag to reveal more of the old site or the new one">
        </div>
        <p class="ba__hint mono">Drag the handle, or focus it and use the arrow keys.</p>
      </div>"""


FIGS = """<div class="figs">
          <div class="fig"><b data-count="50" data-prefix="+" data-suffix="%">+50%</b><span class="mono">Organic clicks</span></div>
          <div class="fig"><b data-count="132" data-prefix="+" data-suffix="%">+132%</b><span class="mono">Search impressions</span></div>
          <div class="fig"><b data-count="22">22</b><span class="mono">Enquiries in 30 days</span></div>
        </div>"""


def contact_form(idp="f"):
    # FormSubmit. The action is its normal (non-AJAX) endpoint so a visitor
    # without JavaScript still posts and lands back on /contact?sent=1; with
    # JavaScript, site.js posts the same fields to the /ajax/ endpoint and
    # only shows a thank-you when the body says success is "true".
    return f"""<form class="form" data-contact method="POST" action="https://formsubmit.co/{MAIL}">
          <input type="hidden" name="_subject" value="New enquiry from designofman.com">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_captcha" value="false">
          <input type="hidden" name="_next" value="{SITE}/contact?sent=1">
          <div class="tabs" role="radiogroup" aria-label="What is this about?">
            <label><input type="radio" name="kind" value="project" checked><span>New project</span></label>
            <label><input type="radio" name="kind" value="question"><span>Just a question</span></label>
          </div>
          <div class="field"><input id="{idp}-name" name="name" type="text" autocomplete="name" required placeholder=" " maxlength="120"><label for="{idp}-name">Your name</label></div>
          <div class="field"><input id="{idp}-email" name="email" type="email" autocomplete="email" required placeholder=" " maxlength="254"><label for="{idp}-email">Email</label></div>
          <div class="field"><input id="{idp}-company" name="company" type="text" autocomplete="organization" placeholder=" " maxlength="160"><label for="{idp}-company">Business <span class="opt">optional</span></label></div>
          <div class="field is-select" data-for="project"><select id="{idp}-project" name="project" required>
              <option value="">Choose one</option>
              <option>A new website</option>
              <option>A rebuild of an existing site</option>
              <option>A web or mobile app</option>
              <option>Hosting and maintenance only</option>
              <option>Something else</option>
            </select><label for="{idp}-project">What do you need?</label></div>
          <div class="field full"><textarea id="{idp}-message" name="message" rows="4" required placeholder=" " maxlength="5000"></textarea><label for="{idp}-message">Tell us a little about it</label></div>
          <div class="hp" aria-hidden="true"><label for="{idp}-honey">Leave this empty</label><input id="{idp}-honey" name="_honey" type="text" tabindex="-1" autocomplete="off"></div>
          <div class="consent">
            <input type="checkbox" id="{idp}-consent" name="consent" value="yes" required>
            <label for="{idp}-consent">Design of Man can use these details to reply to my enquiry. No mailing list, ever. <a href="/privacy">Privacy policy</a>.</label>
          </div>
          <div class="form__end">
            <button class="btn" type="submit" data-magnet=".18">{roll("Send it over")}<span class="btn__arrow">{ARROW}</span></button>
            <p class="form__note" role="status" aria-live="polite">A real person replies within one business day. Prefer email? <a href="mailto:{MAIL}">{MAIL}</a></p>
          </div>
        </form>"""


def contact_rows():
    return f"""<dl class="rows">
          <div><dt>Phone</dt><dd><a href="tel:{TELH}">{TELD}</a></dd></div>
          <div><dt>Email</dt><dd><a href="mailto:{MAIL}">{MAIL}</a></dd></div>
          <div><dt>Studio</dt><dd>Jupiter, Florida &middot; meetings in person or remote</dd></div>
          <div><dt>Hours</dt><dd>{HOURS}. It is <span data-clock>business hours</span> here now.</dd></div>
        </dl>"""


def write(name, html):
    html = re.sub(r"[ \t]+\n", "\n", html)
    p = ROOT / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html)
    print(f"  {name:28} {len(html):8,} bytes")
