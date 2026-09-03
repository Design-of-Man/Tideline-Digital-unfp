import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

# The local landing page. Every other page on the site is written for anyone;
# this one is written for someone typing "web designer near me" from Jupiter,
# Abacoa, Tequesta or Palm Beach Gardens. It earns the ranking by being more
# specific than the national competition can be — named places, named
# industries, and a real local project — not by repeating the keyword.

PATH = "/web-design-jupiter-fl"

BODY = phero(
    "Web design in <em>Jupiter</em>, Florida.",
    "We are on the Loxahatchee side of the bridge, and most of the businesses we "
    "build for are within twenty minutes of it. That is not a marketing line: it "
    "means we can sit in your waiting room and watch a real customer try to book "
    "an appointment on your current site.",
    meta=["Jupiter", "Palm Beach Gardens", "Tequesta", "Juno Beach", "North Palm Beach", "Abacoa"],
    cta=[("/contact", "Book a free consult", ""), ("/work", "See local work", " btn--quiet")],
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Why local matters here, and where it does not.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Being nearby does not make a website better. What it changes is the loop: we can meet you at your counter, photograph your actual premises instead of buying a stock image of somebody else's, and watch a customer of yours fail to find your phone number on a phone. That is worth more than any number of video calls.</p>
        <p class="sc-body">What being local genuinely does change is search. A clinic in Jupiter competing for &ldquo;physical therapy near me&rdquo; is fighting a different fight from a national brand, and it is one you can win: correct and consistent business details everywhere they appear, a Google Business Profile that matches the site exactly, service pages that name the towns you actually serve, and a site fast enough on a phone at the beach to still be there when the page loads.</p>
        <p class="sc-body">If you are outside the area, none of this excludes you. Plenty of our work is remote and runs identically. This page exists because &ldquo;near me&rdquo; is how most people here start looking.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Who we build for in Palm Beach County.</h2>
    <div class="cards three" data-sc-in data-sc-stagger="90">
      <div class="card"><h3>Clinics and practices</h3><p>Physical therapy, orthopedics, dental, med spa. Appointment booking that does not lose the patient between the search result and the front desk.</p></div>
      <div class="card"><h3>Home and marine trades</h3><p>Home watch, contractors, roofing, boat services. Quote requests that reach your phone, and a site that loads on a job site with two bars of signal.</p></div>
      <div class="card"><h3>Professional services</h3><p>Law, accounting, insurance, real estate. Credibility on the first screen, and a way to start a conversation that is not a chat widget.</p></div>
      <div class="card"><h3>Restaurants and hospitality</h3><p>Menus that are text, not a photograph of a PDF, so Google can read them and so can a screen reader.</p></div>
      <div class="card"><h3>Retail and studios</h3><p>Boutiques, fitness, salons. Hours, location and booking, right where a phone expects them.</p></div>
      <div class="card"><h3>Nonprofits</h3><p>Donations, events and volunteer signup, on a budget that reflects who you are.</p></div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">A local project, with the numbers.</h2>
    <div class="lede" data-sc-in>
      <p class="sc-body">First Rehabilitation of North Palm Beach is ten minutes down US-1. Their site was a dated template with no way to capture an enquiry. We rebuilt it and launched in July 2026.</p>
    </div>
    <div class="metrics" data-sc-in style="max-width:52rem">
      <div class="metric"><b>+50%</b><span>Organic clicks</span></div>
      <div class="metric"><b>+132%</b><span>Search impressions</span></div>
      <div class="metric"><b>22</b><span>Enquiries, first 30 days</span></div>
    </div>
    <p class="sc-body note" data-sc-in>Google Search Console, the 32 days after launch against the 32 before, weekday to weekday. <a href="/case-first-rehab">Read the case study</a>.</p>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Asked by people down the road.</h2>
    <div data-sc-in data-sc-stagger="60">
      <details class="qa"><summary>Do you actually meet in person?</summary><p>Yes, and we prefer to for the first conversation if you are close enough. Thirty minutes at your place of business tells us more than an hour on a call, because we get to watch how customers actually reach you.</p></details>
      <details class="qa"><summary>How much does a website cost in Jupiter?</summary><p>The same as it costs anywhere: it depends entirely on what it has to do. A five-page site for a trade and a booking platform with patient accounts are both websites and are not remotely the same job. You get one fixed number in writing before any work starts, and it does not move unless you ask for something outside that scope.</p></details>
      <details class="qa"><summary>Can you help with our Google Business Profile?</summary><p>Yes, and it is usually the highest-return hour of the whole project for a local business. Your name, address and hours have to match between the profile and the site exactly, or you are competing against your own listing.</p></details>
      <details class="qa"><summary>Will the site work during a hurricane closure?</summary><p>It stays up, because it is served from a global network rather than a box in an office. More usefully, we can put a closure notice at the top of every page in about five minutes, and take it down as fast.</p></details>
      <details class="qa"><summary>We are in Stuart, Port St Lucie or Boca. Is that too far?</summary><p>No. Martin County and the rest of Palm Beach County are routine, and the work itself is identical wherever you are. Distance only changes how often we meet face to face.</p></details>
    </div>
  </div>
</section>
""" + nxt("/contact", "Next", "Book a free consult")

# The Service node carries the geography the page is actually about, so the
# structured data says what the copy says rather than repeating the generic
# studio description.
SERVICE = {
    "@type": "Service", "@id": SITE + PATH + "#service",
    "name": "Web design and development in Jupiter, Florida",
    "serviceType": "Web design",
    "provider": {"@id": SITE + "/#studio"},
    "areaServed": [
        {"@type": "City", "name": "Jupiter", "containedInPlace":
            {"@type": "AdministrativeArea", "name": "Palm Beach County, Florida"}},
        {"@type": "City", "name": "Palm Beach Gardens"},
        {"@type": "City", "name": "Tequesta"},
        {"@type": "City", "name": "Juno Beach"},
        {"@type": "City", "name": "North Palm Beach"},
        {"@type": "City", "name": "Stuart"},
    ],
    "audience": {"@type": "BusinessAudience",
                 "name": "Small businesses in Palm Beach and Martin County"},
}

write("web-design-jupiter-fl.html",
      head("Web Design in Jupiter, Florida",
           "A web studio in Jupiter, FL building and maintaining sites for clinics, "
           "trades and local businesses across Palm Beach County. One fixed number, "
           "agreed in writing.",
           PATH,
           nodes=[crumbs([(PATH, "Web design in Jupiter, Florida")]), SERVICE]
                 + faq(BODY, PATH)) + BODY + foot())
