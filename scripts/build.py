#!/usr/bin/env python3
"""Build every page of designofman.com.

    python3 scripts/build.py

This file's OUTPUT is what ships: the site is static and Vercel serves the
HTML as written. Edit here, never in the .html files, or the next build will
quietly undo the edit.

Copy rules that apply to every word below:
  * No invented clients, testimonials, logos or numbers. The only figures on
    the site are First Rehabilitation's, measured in Search Console, with the
    method stated and the client's permission.
  * Promises are things the studio controls (reply time, fixed quotes, no
    lock-in), never outcomes it does not.
"""
import datetime
import subprocess
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from shell import *         # noqa: F401,F403  (the shell)
import shell as S
import legal

# ================================================================ content ==

SERVICES = [
    ("Custom <em>websites</em>", ["Marketing sites", "Rebuilds", "E-commerce"],
     "Sites written by hand, not assembled from a page builder and eleven plugins holding hands. "
     "That is why the pages load fast, why a browser update does not take the site down, and why "
     "the next person who touches the code can read it.",
     ["Responsive from the first line, not squeezed onto a phone at the end",
      "Reachable by keyboard and by screen reader, because a site that turns a customer away is broken",
      "Booking, quotes and intake forms that land where your team actually works",
      "Rebuilds and migrations with content, domains and email moved across without downtime"]),
    ("Web &amp; mobile <em>apps</em>", ["Accounts", "Dashboards", "Workflows"],
     "When the thing you sell needs accounts, dashboards, scheduling or a workflow your team lives "
     "inside, a brochure site will not carry it. We build the application instead, and we are honest "
     "when what you actually need is three pages and a form.",
     ["Your data stays yours, in systems you can take with you",
      "Legible code another developer can pick up",
      "Scoped in writing before anything is built",
      "Tested end to end on the devices your people use"]),
    ("<em>Design</em>", ["UX", "Visual direction", "Real pages"],
     "Design starts with who is arriving, what they need to see and what you want them to do. "
     "Structure first, then type and colour, then the details. You see real pages with your own "
     "words in them, on a real screen, not a mood board that commits to nothing.",
     ["Built around one obvious next step for the visitor",
      "Two rounds of revisions included in the price",
      "Feedback as a conversation: we argue once, then build what you decide",
      "A system of type, colour and spacing the site can grow into"]),
    ("<em>Implementation</em>", ["Domains &amp; DNS", "Payments", "CRM", "Analytics"],
     "The unglamorous half, and the half that goes wrong when nobody owns it: domains and DNS, email "
     "that keeps arriving through the move, payment processing, and the CRM or inbox every form has to reach.",
     ["Every form submitted for real, from a phone, before launch",
      "Email verified as still arriving after the domain moves",
      "Search basics: titles, structured data, a sitemap, URLs that will not change",
      "Stripe, booking systems and CRMs wired and tested end to end"]),
    ("Hosting &amp; <em>care</em>", ["Hosting", "Security", "Backups", "Updates"],
     "Most studios hand over a folder and disappear. We stay on it: managed hosting, TLS, security "
     "updates, backups, uptime monitoring and the content changes you would otherwise have to learn a "
     "dashboard to make. Month to month, no lock-in.",
     ["Managed hosting with uptime alerts",
      "Security updates and backups, done without being asked",
      "A set amount of content changes each month",
      "If you leave, you leave with your files and your domain"]),
]

STAGES = [
    ("The bench", "Typically one week",
     "Before anything is designed, we lay out what you sell, who is buying, and what has to happen "
     "on the page. We look at your current site, your competitors and where enquiries come from today.",
     "You leave with a written scope, a fixed price and a date."),
    ("The core", "One to two weeks",
     "Structure and design together: layout, type, the path a visitor takes and the one thing you want "
     "them to do. Real pages with your own words, in a browser, on a phone.",
     "Two rounds of revisions are built into the price."),
    ("The build", "One to six weeks",
     "Hand-written markup, fast hosting, real accessibility. A live preview link on day one of this "
     "stage that updates as we go, so there is no big reveal and no surprise.",
     "Content, images and copy are finalised here."),
    ("The launch", "Usually an hour",
     "Domain connected, email verified as still arriving, analytics wired, and every form submitted "
     "for real from a phone before we call it live.",
     "Then hosting, updates, backups and monitoring for as long as you want us."),
]

REFUSALS = [
    ("We will not stack plugins until it works.",
     "If a feature needs code, it gets code. A site held together by eleven third-party extensions breaks on somebody else&rsquo;s release schedule."),
    ("We will not ship a page you cannot use with a keyboard.",
     "An unreachable control is a defect, the same as a broken link. We fix it. We do not ask you to accept it as a trade-off."),
    ("We will not quote a number we cannot hold.",
     "The consult ends with an exact price for an exact scope. If the scope changes, you hear what it costs before we build it, not after."),
    ("We will not disappear at launch.",
     "Launch is when the site starts being useful, not when our job ends. Care is part of the arrangement, month to month, cancel whenever."),
    ("We will not lock you in.",
     "You own the code and the domain. If you leave, we help you move cleanly rather than making the exit expensive."),
    ("We will not pad a proposal.",
     "No line items for work nobody needs. If one page can do the job, we will not sell you nine."),
]

CARE = [
    ("Managed hosting", "Fast, monitored hosting you never have to think about."),
    ("Security &amp; TLS", "Certificates renewed and updates applied before they are news."),
    ("Backups", "Taken on a schedule and actually tested, not just switched on."),
    ("Uptime alerts", "If the site goes down, we hear about it before your customers do."),
    ("Content changes", "Send the new hours, prices or photos. We make the change."),
    ("Kept fast", "Pages checked for speed as content grows, so the site does not slowly rot."),
    ("Your code, yours", "No proprietary platform to rent. Take it anywhere, any time."),
    ("A person, not a queue", "The people who built your site answer when you call."),
]

PLANS = [
    ("Launch", "01", "A clean, professional site to get your business online and converting.",
     ["Up to five custom pages", "Responsive on every screen", "Contact form, tested for real",
      "Search basics and analytics", "Live in two to three weeks"], False),
    ("Scale", "02", "A fully custom site with the integrations and the room to grow with you.",
     ["Everything in Launch", "Unlimited custom pages", "CRM, payments and analytics wired up",
      "Content migrated from your old site", "Three months of care included"], True),
    ("Care", "03", "Ongoing hosting and maintenance, so the site stays fast, secure and current.",
     ["Managed hosting and uptime alerts", "Security updates and backups", "Monthly content updates",
      "Someone who answers the phone", "Month to month, no contract"], False),
]

FAQ_HOME = [
    ("How much does a custom website cost?",
     "It depends on what the site has to do. A brochure site for a local business and a custom build with booking, payments and integrations are very different jobs. The free consult ends with one exact number for your scope, fixed before work starts."),
    ("How long does a project take?",
     "Focused sites launch in two to three weeks. Most business sites run four to six weeks from kickoff, and e-commerce, booking or app builds take eight to twelve. You get the date before we start, and it is the one we hold."),
    ("Will my site work on phones?",
     "Always. Every site is built responsive from the first line and tested on real phone widths, not just resized in a desktop browser."),
    ("Do you handle hosting and updates after launch?",
     "Yes. Care plans cover managed hosting, security updates, backups, uptime monitoring and content changes, priced to the site they look after. Month to month; stop whenever you like."),
    ("Can you redesign or migrate my existing site?",
     "Regularly. We rebuild aging sites and move content, domains and email from your old host without downtime. We audit what you have first and tell you honestly what is worth keeping."),
    ("Do you work with businesses outside Florida?",
     "Yes. Most clients are within an hour of Jupiter because that is where we are, but the work runs the same way remotely."),
]

FAQ_PRICING = [
    ("Is the consult really free?", "Yes, and there is no pitch deck. Thirty minutes on what you need, and you leave with our honest read on it whether or not you hire us. If the right answer is a template on a platform you already pay for, we will say so."),
    ("What if the project grows halfway through?", "We price the addition and you decide before we build it. Nothing goes on your invoice that you have not agreed to in writing first."),
    ("Do I have to take a care plan?", "No. You can host the site yourself or with anyone you like, and you own the code either way. Most clients stay because not thinking about it is worth the monthly, not because they are locked in."),
    ("What does a care plan actually cover?", "Hosting, TLS, security updates, backups, uptime monitoring and a set amount of content changes each month. It is scoped to the site it looks after, so no two are identical, and your agreement spells out exactly what is in yours."),
    ("Can I pay monthly for the build itself?", "Sometimes, for larger projects, structured as milestones. Ask at the consult. We would rather set it up properly than have you take on a payment plan that does not suit the business."),
    ("What happens if I want to leave?", "You get your files and we help you move. Your domain is yours and always was. We will not make the exit painful to keep your business."),
]

FAQ_CONTACT = [
    ("How small is too small?", "There is no floor. A single well-built page that gets your phone ringing is a real project and we are happy to do it."),
    ("Can you fix my existing site instead of rebuilding it?", "Often, yes, and we will tell you honestly when that is the better value. Sometimes a rebuild is genuinely cheaper than untangling what is there. We will show you why."),
    ("I have a deadline. Is that a problem?", "Only if we find out about it late. Say so on the first call and we will tell you straight away whether it is possible."),
    ("Do you work with businesses outside Florida?", "Yes. Most of our clients are within an hour of Jupiter because that is where we are, but the work runs the same either way and plenty of it is remote."),
]

MARQUEE = ["Custom websites", "Web &amp; mobile apps", "Design", "Implementation",
           "Hosting &amp; care", "Rebuilds", "E-commerce", "Booking &amp; intake"]

FR_BEFORE_ALT = "First Rehabilitation of North Palm Beach, the previous site: a template hero with a generic serif headline"
FR_AFTER_ALT = "First Rehabilitation of North Palm Beach, the rebuilt site: a focused hero with a Book Appointment path"


def faq_ld(items):
    import json, html
    clean = lambda s: html.unescape(s)
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage",
                       "mainEntity": [{"@type": "Question", "name": clean(q),
                                       "acceptedAnswer": {"@type": "Answer", "text": clean(a)}}
                                      for q, a in items]}, ensure_ascii=False)


def crumbs_ld(*pairs):
    import json, html
    return json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList",
                       "itemListElement": [{"@type": "ListItem", "position": i, "name": html.unescape(n),
                                            "item": f"{SITE}{p}"} for i, (n, p) in enumerate(pairs, 1)]})


# ============================================================ components ==

def services_accordion():
    rows = []
    for i, (title, tags, lede, items) in enumerate(SERVICES, 1):
        chips = "".join(f'<span class="chip">{t}</span>' for t in tags)
        lis = "".join(f"<li>{x}</li>" for x in items)
        rows.append(f"""      <div class="svc__row" data-reveal style="--d:{(i - 1) * 60}">
        <h3 style="margin:0"><button class="svc__btn" type="button" aria-expanded="true" aria-controls="svc-{i}" id="svc-b{i}">
          <span class="svc__n mono">{i:02d}</span>
          <span class="svc__t">{title}</span>
          <span class="svc__tags">{chips}</span>
          <span class="svc__plus" aria-hidden="true"></span>
        </button></h3>
        <div class="svc__panel" id="svc-{i}" role="region" aria-labelledby="svc-b{i}"><div>
          <div class="svc__body">
            <p class="lede">{lede}</p>
            <ul class="svc__list">{lis}</ul>
          </div>
        </div></div>
      </div>""")
    return '    <div class="svc">\n' + "\n".join(rows) + "\n    </div>\n"


def process_pin(n, title="From the bench <em>to launch day.</em>", lede=None):
    cards = []
    for i, (t, time, a, b) in enumerate(STAGES, 1):
        cards.append(f"""        <article class="stage">
          <span class="stage__n" aria-hidden="true">0<em>{i}</em></span>
          <h3>{t}</h3>
          <p>{a}</p><p>{b}</p>
          <div class="stage__time mono"><span>Stage {i:02d}</span><span>{time}</span></div>
        </article>""")
    cards.append(f"""        <article class="stage stage--end">
          <span class="mono" style="color:var(--signal)">And then</span>
          <div>
            <h3 style="margin-top:0">We stay on it.</h3>
            <p>Hosting, updates, backups and monitoring, for as long as you want us. Launch day is usually an hour. The care after it does not stop.</p>
          </div>
          {btn("/process", "The full process", "btn--light btn--sm")}
        </article>""")
    lede = lede or "Four stages, a fixed price and a date before anything is built. You see the work the whole way."
    return f"""
<section class="hpin alt" id="process" aria-label="Process">
  <div class="hpin__stick">
    <div class="wrap">
{sect_head(n, "Process", title, lede, size="d-lg")}      <div class="hpin__track">
{chr(10).join(cards)}
      </div>
      <div class="hpin__bar" aria-hidden="true"><i></i></div>
    </div>
  </div>
</section>
"""


def plans_block():
    out = []
    for name, n, blurb, items, lead in PLANS:
        lis = "".join(f"<li>{CHECK}<span>{x}</span></li>" for x in items)
        badge = '<span class="badge mono">Most chosen</span>' if lead else f'<span class="mono">Plan {n}</span>'
        cls = " plan--lead" if lead else ""
        b = btn("/contact", "Get an exact quote", "btn--light" if lead else "")
        out.append(f"""      <article class="plan{cls}" data-reveal style="--d:{(int(n) - 1) * 100}">
        <div class="plan__top mono"><span>{n} / 03</span>{badge}</div>
        <h3>{name}</h3>
        <p>{blurb}</p>
        <ul>{lis}</ul>
        {b}
      </article>""")
    return '    <div class="plans">\n' + "\n".join(out) + "\n    </div>\n"


def beam_block(n):
    items = "\n".join(
        f'        <li data-reveal style="--d:{(i % 4) * 80}"><span class="mono">{i + 1:02d}</span><h3>{t}</h3><p>{p}</p></li>'
        for i, (t, p) in enumerate(CARE))
    head_txt = "Launch day is when the <em>light comes on.</em>"
    return f"""
<section class="beam dark" id="care" data-dark aria-labelledby="care-h">
  <div class="beam__stars" aria-hidden="true"></div>
  <div class="beam__cone" aria-hidden="true"></div>
  {LAMP}
  <div class="wrap">
    <div class="sect-head">
      <p class="idx"><b>({n:02d})</b><span>Care</span></p>
      <div class="sect-head__body">
        <h2 class="d-xl lit" id="care-h"><span class="lit__base">{head_txt}</span><span class="lit__glow" aria-hidden="true">{head_txt}</span></h2>
        <p class="lede" data-reveal>Most studios hand over a folder and disappear. We keep the light on: hosting, security, backups, monitoring and the small changes, month to month, with no lock-in. The Jupiter Inlet Light has been kept since 1860. A website deserves a keeper too.</p>
        <div class="btn-row" data-reveal style="--d:120">{btn("/pricing", "What care costs", "btn--light")}</div>
      </div>
    </div>
    <ul class="beam__grid">
{items}
    </ul>
  </div>
</section>
"""


def contact_block(n, title="Tell us what you&rsquo;re <em>building.</em>"):
    return f"""
<section class="sect" id="consult" aria-label="Contact">
  <div class="wrap">
    <div class="contact">
      <div>
        <p class="idx mono" style="color:var(--ink-3)"><b style="color:var(--signal-ink);font-weight:400">({n:02d})</b>&nbsp; Contact</p>
        <h2 class="d-lg" data-split style="margin-top:1.5rem">{title}</h2>
        <p class="lede" data-reveal style="margin-top:1.5rem">A new site, a rebuild, or an existing one that needs someone reliable looking after it. Start with a conversation, not a contract.</p>
        {contact_rows()}
      </div>
      <div data-reveal style="--d:120">
        {contact_form()}
      </div>
    </div>
  </div>
</section>
"""


def work_feature(n, heading=True):
    head_html = sect_head(n, "Selected work", "Redesigns that <em>moved the needle.</em>",
                          "The build we are free to show in full, with the old site still there to compare against. "
                          "Where we have numbers, they are measured, not estimated.") if heading else ""
    return f"""
<section class="sect" id="work" aria-label="Selected work">
  <div class="wrap">
{head_html}    <article class="feature">
      {compare("firstrehab-before.jpg", "firstrehab-after.jpg", FR_BEFORE_ALT, FR_AFTER_ALT, "First Rehabilitation of North Palm Beach", "1200 / 621")}
      <div class="feature__info" data-reveal style="--d:120">
        <p class="feature__kind mono">Physical therapy &middot; Redesign and care &middot; 2026</p>
        <h3 class="feature__title">First Rehabilitation of North Palm Beach</h3>
        <p class="body">A dated clinic site rebuilt into a fast, modern experience with an obvious path to booking, and a care plan keeping it sharp.</p>
        {FIGS}
        <p class="mono" style="color:var(--ink-3);font-size:.64rem;line-height:1.6">Google Search Console, the 32 days after launch against the 32 before, weekday to weekday. Enquiries from the site&rsquo;s own form. Published with permission.</p>
        <div class="feature__links">
          {btn("/case-first-rehab", "Read the case study")}
          <a class="btn btn--ghost" href="https://www.firstrehabnpb.com" target="_blank" rel="noopener">{roll("Visit the live site")}<span class="sr"> (opens in a new tab)</span></a>
        </div>
      </div>
    </article>
    <div class="also" data-reveal>
      <p class="mono" style="color:var(--ink-3)">Also built recently</p>
      <div class="also__card">
        <h3 class="d-sm">Orthopedics &middot; <em>full redesign</em></h3>
        <div>
          <p class="body">A cluttered medical site rebuilt into a clean, high-trust experience: an editorial hero, service navigation a patient can actually parse, and consultations in the first screen instead of the fourth.</p>
          <p class="body">Shown on request rather than on the page, because publishing a client&rsquo;s brand is theirs to agree to, not ours to assume. Ask on the call.</p>
        </div>
      </div>
    </div>
  </div>
</section>
"""


# ================================================================= pages ==

def home():
    hero = f"""
<div class="hero-wrap" data-dark data-clear>
  <section class="hero" aria-label="Introduction" data-hold>
    <div class="hero__frame">
      <div class="hero__media" aria-hidden="true">
        <picture>
          <source type="image/webp" sizes="100vw"
                  srcset="/assets/video/lighthouse/lighthouse-poster-960.webp 960w,
                          /assets/video/lighthouse/lighthouse-poster-1200.webp 1200w,
                          /assets/video/lighthouse/lighthouse-poster-1920.webp 1920w">
          <img src="/assets/video/lighthouse/lighthouse-poster.jpg" alt="" width="1920" height="1080" fetchpriority="high" decoding="async">
        </picture>
        <video id="heroVideo" muted loop playsinline preload="none" disablepictureinpicture
               poster="/assets/video/lighthouse/lighthouse-poster.jpg">
          <source data-src="/assets/video/lighthouse/lighthouse-m.mp4" media="(max-width: 720px)">
          <source data-src="/assets/video/lighthouse/lighthouse.mp4">
        </video>
      </div>
      <div class="hero__scrim" aria-hidden="true"></div>
    </div>
    <div class="wrap hero__content">
      <h1 class="hero__h1 d-xl" data-split style="--d:120">Websites that guide people <em>in.</em></h1>
      <div class="hero__row">
        <p class="hero__lede" data-reveal style="--d:650">Design of Man is a small web studio on the Jupiter Inlet. We design, build and look after websites and web apps for businesses that want to be found, and we are still answering the phone a year after launch.</p>
        <div class="btn-row" data-reveal style="--d:800">
          {btn("/contact", "Book a free consult", "btn--light")}
          <a class="btn btn--ghost" href="#work">{roll("See the work")}</a>
        </div>
      </div>
      <div class="hero__meta" data-reveal style="--d:950">
        <span class="mono">Est. 2024 &mdash; Jupiter, Florida</span>
        <span class="mono">{COORDS}</span>
        <span class="mono scroll-cue"><i aria-hidden="true"></i>Scroll</span>
      </div>
    </div>
    <div class="hero__caption mono" aria-hidden="true"><span>Jupiter Inlet Light</span><span>First lit 1860</span><span>Still keeping watch</span></div>
  </section>
</div>
"""
    statement = f"""
<section class="sect" id="studio" aria-label="About the studio">
  <div class="wrap">
    <div class="sect-head" style="margin-bottom:2.5rem">
      <p class="idx"><b>(01)</b><span>The studio</span></p>
      <div class="sect-head__body">
        <p class="state" data-scrub>We build websites the way a keeper looks after a light: carefully, by hand, and long after everyone else has gone home. No templates stretched to fit. No account managers between you and the work. No disappearing at launch.</p>
        <div class="statement__foot">
          <div class="statement__cols">
            <p data-reveal><span class="mono">Clarity</span>No jargon. Every project starts with a written plan you can actually read.</p>
            <p data-reveal style="--d:100"><span class="mono">Craft</span>Written by hand, so it is fast, accessible and still legible in five years.</p>
            <p data-reveal style="--d:200"><span class="mono">Care</span>Hosting and maintenance are part of the deal, month to month.</p>
          </div>
          <div data-reveal style="--d:250">{btn("/studio", "About the studio", "btn--ghost")}</div>
        </div>
      </div>
    </div>
  </div>
</section>
"""
    services = f"""
<section class="sect" id="services" aria-label="Services" style="padding-top:calc(var(--sect) * .7)">
  <div class="wrap">
{sect_head(2, "What we do", "Everything a site needs, <em>from one bench.</em>", "Design, build, launch and the care afterwards. One studio does all four, so nothing falls into the gap between two vendors.")}
{services_accordion()}    <div class="btn-row" data-reveal style="margin-top:2.5rem">{btn("/services", "Every service, in detail", "btn--ghost")}</div>
  </div>
</section>
"""
    refusals = f"""
<section class="sect" id="principles" aria-label="Principles">
  <div class="wrap">
{sect_head(6, "Principles", "What we <em>will not</em> do.", "Every studio lists its values. These are ours stated as refusals, because a refusal is the only kind you can hold us to.")}
{stack(REFUSALS)}  </div>
</section>
"""
    pricing = f"""
<section class="sect alt" id="pricing" aria-label="Pricing">
  <div class="wrap">
{sect_head(7, "Pricing", "Simple plans, <em>no surprises.</em>", "Three ways we usually work. Every build is scoped to what it actually needs, so the consult ends with one exact number for your project, not a range to guess inside.")}
{plans_block()}    <p class="body" data-reveal style="margin-top:2.5rem">Not sure which fits? Book a free consult and we will point you at the right one, including the one where you do not need us. Or read <a href="/pricing">what actually moves the price</a>.</p>
  </div>
</section>
"""
    faq = f"""
<section class="sect" id="faq" aria-label="Questions">
  <div class="wrap">
{sect_head(8, "Questions", "Everything you would <em>ask on the call.</em>")}
    <div class="faq" data-reveal>
{qa(FAQ_HOME)}
    </div>
  </div>
</section>
"""
    body = (hero + statement + marquee(MARQUEE) + services + work_feature(3) + beam_block(4)
            + process_pin(5) + refusals + pricing + faq + contact_block(9))
    write("index.html",
          head("", "A small web design and development studio in Jupiter, Florida. Custom websites "
                   "and web apps, designed, built and looked after, with a fixed quote up front.", "/", intro=True,
               extra_head='\n<link rel="preload" as="image" fetchpriority="high" type="image/webp" '
                          'href="/assets/video/lighthouse/lighthouse-poster-1200.webp" '
                          'imagesrcset="/assets/video/lighthouse/lighthouse-poster-960.webp 960w, '
                          '/assets/video/lighthouse/lighthouse-poster-1200.webp 1200w, '
                          '/assets/video/lighthouse/lighthouse-poster-1920.webp 1920w" imagesizes="100vw">',
               ld_extra=faq_ld(FAQ_HOME))
          + body + foot(cta=False))


def services_page():
    blocks = []
    for i, (title, tags, lede, items) in enumerate(SERVICES, 1):
        chips = "".join(f'<span class="chip">{t}</span>' for t in tags)
        lis = "".join(f"<li>{x}</li>" for x in items)
        cls = " alt" if i % 2 == 0 else ""
        blocks.append(f"""
<section class="sect{cls}" id="s{i}" aria-labelledby="s{i}-h">
  <div class="wrap split">
    <div class="split__sticky">
      <p class="idx mono" style="color:var(--signal-ink)">({i:02d}) / 05</p>
      <h2 class="d-lg" id="s{i}-h" data-split style="margin-top:1.25rem">{title}</h2>
      <div class="phero__meta" style="margin-top:1.75rem" data-reveal>{chips}</div>
    </div>
    <div>
      <p class="lede" data-reveal>{lede}</p>
      <ul class="svc__list" data-reveal style="--d:100;margin-top:2.5rem">{lis}</ul>
    </div>
  </div>
</section>""")
    included = [
        ("Speed", "Images sized and compressed, fonts subset, nothing loaded that the page does not use."),
        ("Accessibility", "Keyboard reachable, screen-reader legible, and colour contrast measured rather than eyeballed."),
        ("Mobile", "Tested on real phone widths, not just resized in a desktop browser."),
        ("Search basics", "Titles, descriptions, structured data, a sitemap, and clean URLs that will not change."),
        ("Analytics, if you want it", "Wired and verified before launch, so you can see what the site is doing from day one."),
        ("Your code, yours", "No proprietary platform to rent. You own what we write and can take it anywhere."),
    ]
    body = (phero("Everything a site needs, from <em>one bench.</em>",
                  "Design, build, launch and the care afterwards. One studio does all four, so nothing falls "
                  "into the gap between two vendors and nobody gets to blame the other when something breaks.",
                  kicker="Services", index="(02) / Services",
                  chips=["Websites", "Web and mobile apps", "Design", "Implementation", "Care"],
                  ctas=[("/contact", "Book a free consult", ""), ("/pricing", "See what it costs", "btn--ghost")])
            + marquee(MARQUEE, dark=True) + "".join(blocks)
            + f"""
<section class="sect dark" data-dark aria-label="Included in every build">
  <div class="wrap">
{sect_head(6, "Every build", "Included, <em>never an upsell.</em>")}
{tiles(included)}  </div>
</section>
""" + nxt("/process", "Next &mdash; how a build runs", "Process"))
    write("services.html",
          head("Services", "Custom websites, web and mobile apps, design, implementation, hosting and care. "
               "One small studio in Jupiter, Florida handling all of it.", "/services",
               ld_extra=crumbs_ld(("Home", "/"), ("Services", "/services")))
          + body + foot())


def process_page():
    items = []
    for i, (t, time, a, b) in enumerate(STAGES, 1):
        items.append(f"""    <div class="tl__item">
      <div><span class="idx">Stage {i:02d}</span><h3 data-split>{t}</h3></div>
      <div><p class="lede" data-reveal>{a}</p><p class="body" data-reveal style="--d:80">{b}</p><span class="chip" data-reveal style="--d:140">{time}</span></div>
    </div>""")
    needs = [
        ("One decision maker", "Someone who can say yes. Design by committee doubles the timeline and rarely improves the result."),
        ("Your content, early", "Copy, photos, logos, licence numbers. We can write and source, but we cannot invent what only you know."),
        ("Access", "Domain registrar, current host, analytics. We will walk you through finding each one if you have lost them."),
        ("Feedback in rounds", "Collected and sent together rather than trickling in over a fortnight. It gets you a better site faster."),
        ("Honesty about the deadline", "If there is a real date, say so at the bench. We will tell you whether it is possible before you pay anything."),
        ("Patience with the boring part", "Migrations, DNS and email are the least interesting and the highest risk. They get done carefully."),
    ]
    durations = f"""
<section class="sect dark" data-dark aria-label="How long it takes">
  <div class="wrap">
{sect_head(3, "Timelines", "How long it <em>really</em> takes.", "These are the ranges we actually hit, not best cases. The date you get at the bench is the one we hold.")}
    <div class="steps">
      <li data-reveal><span class="idx">2&ndash;3 weeks</span><h3>A focused local site</h3><p>Up to five pages, a contact form tested for real, the search basics.</p></li>
      <li data-reveal style="--d:100"><span class="idx">4&ndash;6 weeks</span><h3>Most business sites</h3><p>Custom design throughout, integrations, content migrated from an old site.</p></li>
      <li data-reveal style="--d:200"><span class="idx">8&ndash;12 weeks</span><h3>Commerce, booking, apps</h3><p>E-commerce, booking systems, or an application with accounts and a workflow behind it.</p></li>
    </div>
  </div>
</section>
""".replace('<div class="steps">', '<ol class="steps">').replace("</li>\n    </div>", "</li>\n    </ol>")
    body = (phero("Built piece by <em>deliberate</em> piece.",
                  "Every site is assembled the way a machine is: parts chosen on purpose, seated properly, tested "
                  "under load. Nothing gets glued on at the end because we ran out of time.",
                  kicker="Process", index="(03) / Process",
                  chips=["Four stages", "Two to twelve weeks", "You see it the whole way"])
            + f"""
<section class="sect" aria-label="The four stages" style="padding-top:2rem">
  <div class="wrap">
{sect_head(1, "Stages", "From the bench <em>to launch day.</em>")}
    <div class="tl">
      <span class="tl__rail" aria-hidden="true"><i></i></span>
{chr(10).join(items)}
    </div>
  </div>
</section>

<section class="sect alt" aria-label="A principle">
  <div class="wrap">
    <blockquote class="pull" data-split>A site is not finished at launch. <em>It is just lit.</em></blockquote>
    <p class="pull-cite mono" data-reveal>Which is why we stay on it after</p>
  </div>
</section>

<section class="sect" aria-label="What we need from you">
  <div class="wrap">
{sect_head(2, "Your part", "What we need <em>from you.</em>", "Projects slip for one reason more than any other, and it is never the code. Here is the honest list.")}
{tiles(needs)}  </div>
</section>
""" + durations + nxt("/pricing", "Next &mdash; what it costs", "Pricing"))
    write("process.html",
          head("Process", "Four stages from first conversation to launch: the bench, the core, the build, "
               "the launch. What happens at each, and how long it really takes.", "/process",
               ld_extra=crumbs_ld(("Home", "/"), ("Process", "/process")))
          + body + foot())


def studio_page():
    body = (phero("Small on purpose, careful <em>by default.</em>",
                  "The person who scopes your project is the person who designs it, builds it, and answers when "
                  "you call after launch. There is no account layer, because there is nobody spare to staff one.",
                  kicker="Studio", index="(04) / Studio",
                  chips=["Jupiter, Florida", "Founded 2024", "Websites and web apps"])
            + f"""
<section class="sect" aria-labelledby="small-h" style="padding-top:2rem">
  <div class="wrap split">
    <div class="split__sticky">
      <p class="idx mono" style="color:var(--signal-ink)">(01) Why small</p>
      <h2 class="d-lg" id="small-h" data-split style="margin-top:1.25rem">Why we <em>stayed small.</em></h2>
    </div>
    <div>
      <p class="lede" data-reveal>Most agencies grow by adding people between the client and the work. A salesperson makes the promise, an account manager relays it, and by the time it reaches whoever is building, half of what you said has been paraphrased twice.</p>
      <p class="body" data-reveal>We went the other way. Fewer projects at a time, each handled start to finish by the people doing the work. You get straight answers about timelines, honest pushback when an idea will not serve you, and a site nobody has to reverse-engineer six months later.</p>
      <p class="body" data-reveal>It also means we say no more often than a larger shop would. If your project needs a team of twelve, we are the wrong studio, and we will tell you that on the first call rather than in month four.</p>
    </div>
  </div>
</section>

<section class="sect dark" data-dark aria-label="A principle">
  <div class="wrap">
    <blockquote class="pull" data-split>We build the foundation your business stands on, <em>not a template stretched to fit.</em></blockquote>
    <p class="pull-cite mono" data-reveal>Measured, drafted, and built for the long haul</p>
  </div>
</section>
""" + marquee(["Clarity", "Craft", "Care", "No lock-in", "Fixed quotes", "Hand-built"], speed=0.5)
            + f"""
<section class="sect" aria-label="Principles">
  <div class="wrap">
{sect_head(2, "Principles", "What we <em>will not</em> do.", "Every studio lists its values. These are ours stated as refusals, because a refusal is the only kind you can hold us to.")}
{stack(REFUSALS)}  </div>
</section>

<section class="sect alt" aria-labelledby="where-h">
  <div class="wrap split">
    <div>
      <p class="idx mono" style="color:var(--signal-ink)">(03) Where</p>
      <h2 class="d-lg" id="where-h" data-split style="margin-top:1.25rem">On the <em>inlet.</em></h2>
      <p class="mono" style="margin-top:1.5rem;color:var(--ink-3)">{COORDS}</p>
    </div>
    <div>
      <p class="lede" data-reveal>Jupiter, Florida, in sight of the lighthouse. Most of our clients are within an hour of here, which means we can sit across a table from you when that is the fastest way to settle something. The rest are anywhere, and the work runs the same way.</p>
      {contact_rows()}
    </div>
  </div>
</section>
""" + nxt("/work", "Next &mdash; the work itself", "Work"))
    write("studio.html",
          head("Studio", "A small web studio in Jupiter, Florida. The person who scopes your project designs it, "
               "builds it, and answers the phone after launch.", "/studio",
               ld_extra=crumbs_ld(("Home", "/"), ("Studio", "/studio")))
          + body + foot())


def work_page():
    body = (phero("Redesigns that <em>moved the needle.</em>",
                  "The build we are free to show in full, with the old site still there to compare against. "
                  "Where we have the numbers, they are measured, not estimated.",
                  kicker="Work", index="(01) / Work", chips=["Physical therapy", "Orthopedics"])
            + work_feature(1, heading=False).replace('class="sect" id="work"', 'class="sect" id="work" style="padding-top:1rem"')
            + f"""
<section class="sect dark" data-dark aria-labelledby="why-h">
  <div class="wrap split">
    <div><p class="idx mono" style="color:var(--signal)">(02) Method</p><h2 class="d-lg" id="why-h" data-split style="margin-top:1.25rem">Why the numbers <em>are small.</em></h2></div>
    <div>
      <p class="lede" data-reveal>Because they are measured rather than rounded up. The figures come from Google Search Console for the 32 days after launch against the 32 before, compared weekday to weekday so a weekend does not flatter the result.</p>
      <p class="body" data-reveal>The enquiry count is the site&rsquo;s own form; the previous site had no lead capture, so there is no percentage to quote. More of the work is under agreements that do not let us publish it. A studio two years old claiming forty case studies is counting something other than clients.</p>
    </div>
  </div>
</section>
""" + nxt("/contact", "Next &mdash; yours", "Get a number"))
    write("work.html",
          head("Work", "A physical therapy redesign shown before and after with measured results, plus "
               "recent work in orthopedics.", "/work",
               ld_extra=crumbs_ld(("Home", "/"), ("Work", "/work")))
          + body + foot())


def case_page():
    body = (phero("First Rehabilitation of <em>North Palm Beach</em>",
                  "A dated clinic site rebuilt into a fast, modern, appointment-driving experience, with an "
                  "ongoing care plan keeping it sharp.",
                  kicker="Case study", index="Case study / 2026",
                  chips=["Physical therapy", "Redesign and care", "North Palm Beach, Florida"],
                  ctas=[("https://www.firstrehabnpb.com", "Visit the live site", ""),
                        ("/contact", "Start a project like this", "btn--ghost")],
                  back=("/work", "All work"))
            .replace('href="https://www.firstrehabnpb.com"', 'href="https://www.firstrehabnpb.com" target="_blank" rel="noopener"')
            + f"""
<section class="sect" aria-label="Before and after" style="padding-top:1rem">
  <div class="wrap">
    {compare("firstrehab-before.jpg", "firstrehab-after.jpg", FR_BEFORE_ALT, FR_AFTER_ALT, "First Rehabilitation of North Palm Beach")}
  </div>
</section>

<section class="sect dark" data-dark aria-labelledby="num-h">
  <div class="wrap">
{sect_head(1, "Results", "Numbers <em>that moved.</em>")}
    <div data-reveal>{FIGS}</div>
    <p class="body" data-reveal style="margin-top:2rem;max-width:46rem">Google Search Console, the 32 days after launch (21 Jul &ndash; 21 Aug 2026) against the 32 before, compared weekday to weekday because the earlier window contained a weekend and the later one did not. That is +50% organic clicks (3.64 to 5.46 per weekday) and +132% impressions (190 to 440 per weekday). Enquiries are counted from the site&rsquo;s own form; the previous site had no lead capture, so there is no percentage to quote. Published with the client&rsquo;s permission.</p>
  </div>
</section>

<section class="sect" aria-label="What we changed">
  <div class="wrap">
{sect_head(2, "The work", "What we <em>changed.</em>")}
{tiles([
    ("The challenge", "A dated template site with a generic serif hero, slow pages and no clear path to booking. A clinic that had treated patients for decades looked, online, like it had stopped paying attention."),
    ("The approach", "A ground-up rebuild around the clinic&rsquo;s real brand: a focused hero, an obvious Book Appointment path, pathways by service and by condition, and social proof where it does some good. Fast, and mobile first."),
    ("The care", "An ongoing maintenance plan keeps the site fast and secure, with content updates, monitoring and support, so it keeps performing long after launch day stopped being interesting."),
])}  </div>
</section>

<section class="sect alt" aria-label="Before and after screens">
  <div class="wrap">
{sect_head(3, "Before", "Where <em>we started.</em>", size="d-md")}
    <div class="shots">
      <figure data-reveal><img src="/assets/img/work/firstrehab-before.jpg" alt="The original homepage hero: a stock photograph behind a generic serif headline" loading="lazy" decoding="async" width="1200" height="524"><figcaption class="mono">The original homepage hero</figcaption></figure>
      <figure data-reveal style="--d:100"><img src="/assets/img/work/firstrehab-before-welcome.jpg" alt="The original Welcome section: a wall of centred body copy with no clear next step" loading="lazy" decoding="async" width="1200" height="398"><figcaption class="mono">The original welcome section</figcaption></figure>
    </div>
    <div style="height:var(--sect)"></div>
{sect_head(4, "After", "Where <em>it is now.</em>", size="d-md")}
    <div class="shots">
      <figure data-reveal><img src="/assets/img/work/firstrehab-after.jpg" alt="The new homepage hero: one headline, one appointment button, and the clinic's own photography" loading="lazy" decoding="async" width="1200" height="621"><figcaption class="mono">The new homepage hero</figcaption></figure>
      <figure data-reveal style="--d:100"><img src="/assets/img/work/firstrehab-after-story.jpg" alt="The new Our Story section: a two-column layout pairing the clinic's history with its credentials" loading="lazy" decoding="async" width="1200" height="633"><figcaption class="mono">The new &ldquo;Our story&rdquo; section</figcaption></figure>
    </div>
  </div>
</section>
""" + nxt("/contact", "Next &mdash; yours", "Start a project"))
    write("case-first-rehab.html",
          head("First Rehabilitation of North Palm Beach",
               "Case study: a dated physical therapy clinic site rebuilt into a fast, appointment-driving "
               "experience, with before and after comparisons and measured results.", "/case-first-rehab",
               ld_extra=crumbs_ld(("Home", "/"), ("Work", "/work"), ("First Rehabilitation", "/case-first-rehab")))
          + body + foot())


def pricing_page():
    factors = [
        ("How many pages", "Not the count so much as how many are genuinely different. Twelve service pages from one template cost far less than three pages that each work differently."),
        ("What it connects to", "A contact form is an afternoon. Payments, a CRM, a booking system and an inventory feed each add real work, and each has to be tested end to end."),
        ("Who writes the words", "If you have the copy, we build. If you need it written, that is a stage of its own and we price it separately so you can decide."),
        ("Where the content lives now", "Migrating a hundred posts, a catalogue or a decade of PDFs takes time. So does rescuing a site whose old host has already gone dark."),
        ("Whether you edit it", "A site you never touch is simpler and cheaper than one your team updates weekly. Both are fine. They are different builds."),
        ("The deadline", "A normal schedule costs what it costs. Compressing eight weeks into three means turning other work away, and that shows in the number."),
    ]
    body = (phero("Simple plans, <em>no surprises.</em>",
                  "Three ways we usually work. Every build is scoped to what it actually needs, so the consult ends "
                  "with one exact number for your project rather than a range you have to guess inside.",
                  kicker="Pricing", index="(05) / Pricing",
                  chips=["Fixed quotes", "Half up front, half at launch", "Care month to month"],
                  ctas=[("/contact", "Get an exact quote", "")])
            + f"""
<section class="sect" aria-label="Plans" style="padding-top:1rem">
  <div class="wrap">
{plans_block()}  </div>
</section>

<section class="sect dark" data-dark aria-labelledby="noprice-h">
  <div class="wrap split">
    <div><p class="idx mono" style="color:var(--signal)">(01) A fair question</p><h2 class="d-lg" id="noprice-h" data-split style="margin-top:1.25rem">Why there is no price <em>on this page.</em></h2></div>
    <div>
      <p class="lede" data-reveal>Because any number printed here would be wrong for most of the people reading it. A five-page site for a local trade and a booking platform with accounts and payments are both websites, and they are not remotely the same job.</p>
      <p class="body" data-reveal>What we can promise is that the number you get is fixed before work starts, and does not move unless you ask for something outside the written scope. If a change costs more, you hear the number before we build it.</p>
    </div>
  </div>
</section>

<section class="sect" aria-label="What moves the number">
  <div class="wrap">
{sect_head(2, "The variables", "What actually <em>moves the number.</em>")}
{tiles(factors)}  </div>
</section>

<section class="sect alt" aria-labelledby="pay-h">
  <div class="wrap split">
    <div><p class="idx mono" style="color:var(--signal-ink)">(03) Payment</p><h2 class="d-lg" id="pay-h" data-split style="margin-top:1.25rem">How payment <em>works.</em></h2></div>
    <div>
      <p class="lede" data-reveal>Half up front to reserve the schedule, half on launch. Larger builds split into milestones, agreed in writing before anything starts. Care plans bill monthly and you can stop them whenever you like.</p>
      <p class="body" data-reveal>Card payments run through Stripe, so your card details never touch our servers. Bank transfer is cheaper than card on a project invoice and it is what we default to.</p>
    </div>
  </div>
</section>

<section class="sect" aria-label="Money questions">
  <div class="wrap">
{sect_head(4, "Questions", "The money <em>questions.</em>")}
    <div class="faq" data-reveal>
{qa(FAQ_PRICING)}
    </div>
  </div>
</section>
""" + nxt("/contact", "Next &mdash; your number", "Get a quote"))
    write("pricing.html",
          head("Pricing", "Three ways we work: Launch, Scale and Care. What moves the price, how payment is "
               "structured, and why the exact number comes from the consult.", "/pricing",
               ld_extra=faq_ld(FAQ_PRICING))
          + body + foot())


def contact_page():
    body = (phero("Tell us what you are <em>building.</em>",
                  "A new site, a rebuild, or an existing one that needs someone reliable looking after it. "
                  "Start with a conversation, not a contract.",
                  kicker="Contact", index="(06) / Contact",
                  chips=["Free 30-minute consult", "Reply within one business day", "Jupiter, Florida"])
            + f"""
<section class="sect" id="consult" aria-label="Contact form" style="padding-top:1rem">
  <div class="wrap contact">
    <div>
      <h2 class="d-md" data-split>We answer <em>our own phone.</em></h2>
      <p class="body" data-reveal style="margin-top:1.5rem">Bring whatever you have: a rough idea, a competitor&rsquo;s site you like, or a list of everything wrong with your current one. We will tell you honestly what it takes, and whether we are the right people for it.</p>
      {contact_rows()}
      <p class="body" data-reveal style="margin-top:1.5rem;font-size:.9rem">Already a client with a billing question? Email <a href="mailto:{MAIL}">{MAIL}</a> and we will sort it out.</p>
    </div>
    <div data-reveal style="--d:120">
      {contact_form("c")}
    </div>
  </div>
</section>

<section class="sect dark" data-dark aria-label="What happens next">
  <div class="wrap">
{sect_head(2, "Next", "What happens <em>after you send it.</em>")}
    <ol class="steps">
      <li data-reveal><span class="idx">01 &mdash; within a day</span><h3>We read it and reply</h3><p>A real person, within one business day. If what you need is outside what we do, we will say so and point you somewhere better.</p></li>
      <li data-reveal style="--d:100"><span class="idx">02 &mdash; thirty minutes</span><h3>A call, no deck</h3><p>What you sell, who is buying, and what the site has to do. Bring your current site if you have one.</p></li>
      <li data-reveal style="--d:200"><span class="idx">03 &mdash; yours to keep</span><h3>A written scope and one number</h3><p>Exactly what gets built, exactly when, and exactly what it costs, whether or not you go ahead.</p></li>
    </ol>
  </div>
</section>

<section class="sect" aria-label="Questions">
  <div class="wrap">
{sect_head(3, "Questions", "Before <em>you ask.</em>")}
    <div class="faq" data-reveal>
{qa(FAQ_CONTACT)}
    </div>
  </div>
</section>
""")
    write("contact.html",
          head("Contact", "Book a free 30-minute consult with a small web studio in Jupiter, Florida. "
               "You leave with a written scope and one exact number.", "/contact",
               ld_extra=crumbs_ld(("Home", "/"), ("Contact", "/contact")))
          + body + foot(cta=False))


def not_found():
    body = f"""
<section class="lost" style="isolation:isolate;position:relative">
  {RINGS.replace('class="phero__glyph"', 'class="phero__glyph" style="top:20%"')}
  <div class="wrap">
    <p class="eyebrow">Off course</p>
    <h1 class="d-mega" data-split>4<em>0</em>4</h1>
    <p class="lede" data-reveal style="margin-top:2rem">This page is not here. Either it moved or the link that sent you was wrong; neither is your fault. Here is the way back to shore.</p>
    <div class="btn-row" data-reveal style="--d:120;margin-top:2rem">
      {btn("/", "Home")}
      <a class="btn btn--ghost" href="/work">{roll("Work")}</a>
      <a class="btn btn--ghost" href="/services">{roll("Services")}</a>
      <a class="btn btn--ghost" href="/contact">{roll("Contact")}</a>
    </div>
    <p class="body" data-reveal style="margin-top:2rem;font-size:.9rem">Landed here from a link on our own site? Tell us at <a href="mailto:{MAIL}">{MAIL}</a> and we will fix it.</p>
  </div>
</section>
"""
    write("404.html", head("Page not found", "That page is not here. Links to everything on the site that is.",
                           "/404", robots="noindex, follow", canonical=False) + body + foot())


# ================================================================== meta ==

def meta_files():
    pages = [("/", "index.html", "1.0"), ("/work", "work.html", "0.9"), ("/case-first-rehab", "case-first-rehab.html", "0.8"),
             ("/services", "services.html", "0.9"), ("/process", "process.html", "0.7"), ("/studio", "studio.html", "0.7"),
             ("/pricing", "pricing.html", "0.8"), ("/contact", "contact.html", "0.9"),
             ("/privacy", "privacy.html", "0.2"), ("/terms", "terms.html", "0.2"), ("/cookies", "cookies.html", "0.2")]
    today = datetime.date.today().isoformat()
    urls = "\n".join(f"  <url><loc>{SITE}{'' if p == '/' else p}{'/' if p == '/' else ''}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>"
                     for p, _, pr in pages)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {SITE}/sitemap.xml\n")
    write("llms.txt", f"""# Design of Man

> A small web design and development studio in Jupiter, Florida. Custom websites and web apps: strategy, design, build, hosting and ongoing care. Founded 2024. Operated by {ENTITY}.

- Contact: {MAIL}, {TELD}, {HOURS}
- Location: Jupiter, Florida, USA. Works with clients locally and remotely.
- Pricing model: fixed quote per project after a free 30-minute consult; half up front, half at launch; care plans month to month with no contract.
- Typical timelines: 2-3 weeks for a focused local site, 4-6 weeks for most business sites, 8-12 weeks for e-commerce, booking or app builds.

## Pages

- [Home]({SITE}/): overview of services, work, process, pricing and contact
- [Work]({SITE}/work): First Rehabilitation of North Palm Beach redesign with measured results
- [Case study]({SITE}/case-first-rehab): +50% organic clicks, +132% search impressions, 22 enquiries in the first 30 days (Search Console, 32 days after launch vs 32 before)
- [Services]({SITE}/services): custom websites, web and mobile apps, design, implementation, hosting and care
- [Process]({SITE}/process): the bench, the core, the build, the launch
- [Studio]({SITE}/studio): who we are and what we refuse to do
- [Pricing]({SITE}/pricing): Launch, Scale and Care plans; what moves the price
- [Contact]({SITE}/contact): free consult request form
""")


def vercel_config():
    """Keep the CSP's script hash equal to the inline script in shell.py."""
    import base64, hashlib, json
    h = base64.b64encode(hashlib.sha256(INLINE_JS.encode()).digest()).decode()
    csp = ("default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; "
           f"form-action 'self' https://formsubmit.co; script-src 'self' 'sha256-{h}'; style-src 'self' 'unsafe-inline'; "
           "img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self' https://formsubmit.co; "
           "manifest-src 'self'; frame-src 'none'; upgrade-insecure-requests")
    path = S.ROOT / "vercel.json"
    cfg = json.loads(path.read_text())
    for rule in cfg["headers"]:
        if rule["source"] == "/(.*)":
            rule["headers"] = [x for x in rule["headers"] if x["key"] != "Content-Security-Policy"]
            rule["headers"].insert(0, {"key": "Content-Security-Policy", "value": csp})
    path.write_text(json.dumps(cfg, indent=2) + "\n")
    print("  vercel.json                  CSP script hash sha256-" + h[:12] + "...")


if __name__ == "__main__":
    print(f"asset version {V}")
    home(); services_page(); process_page(); studio_page(); work_page(); case_page()
    pricing_page(); contact_page(); not_found()
    legal.build()
    meta_files()
    vercel_config()
