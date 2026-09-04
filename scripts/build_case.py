import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = phero(
    "First Rehabilitation of North Palm Beach",
    "A dated clinic site rebuilt into a fast, modern, appointment-driving "
    "experience, with an ongoing care plan keeping it sharp.",
    meta=["Physical therapy", "Redesign and care", "North Palm Beach, Florida"],
    cta=[("https://www.firstrehabnpb.com", "Visit the live site", ""),
         ("/contact", "Start a project like this", " btn--quiet")],
    back=("/work", "Back to all work"),
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Drag to compare.</h2>
    <div class="shot ba" data-ba data-sc-in style="--ratio: 1200 / 524;max-width:62rem;margin-top:2.5rem">
      <div class="ba__pane"><img src="/assets/img/work/firstrehab-after.jpg" alt="The rebuilt First Rehabilitation homepage: a focused hero with a clear Book Appointment path" width="1200" height="621" decoding="async"></div>
      <div class="ba__pane ba__pane--before"><img src="/assets/img/work/firstrehab-before.jpg" alt="The previous First Rehabilitation homepage: a template hero with a generic serif headline" width="1200" height="524" decoding="async"></div>
      <span class="ba__line" aria-hidden="true"></span>
      <span class="ba__tag ba__tag--before">Before</span>
      <span class="ba__tag ba__tag--after">After</span>
      <input class="ba__range" type="range" min="0" max="100" value="50"
             aria-label="Reveal more of the old First Rehabilitation site or more of the new one">
    </div>
    <p class="ba__hint">Drag the handle, or focus it and use the arrow keys.</p>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Where we started.</h2>
    <div class="gallery" data-sc-in data-sc-stagger="80" style="margin-top:2.5rem">
      <figure><img src="/assets/img/work/firstrehab-before.jpg" alt="The original homepage hero: a stock photograph behind a generic serif headline" loading="lazy" decoding="async" width="1200" height="524"><figcaption>The original homepage hero</figcaption></figure>
      <figure><img src="/assets/img/work/firstrehab-before-welcome.jpg" alt="The original Welcome section: a wall of centred body copy with no clear next step" loading="lazy" decoding="async" width="1200" height="398"><figcaption>The original Welcome section</figcaption></figure>
    </div>

    <h2 class="sc-display sc-display--md" data-sc-kinetic="lines" style="margin-top:5rem">Where it is now.</h2>
    <div class="gallery" data-sc-in data-sc-stagger="80" style="margin-top:2.5rem">
      <figure><img src="/assets/img/work/firstrehab-after.jpg" alt="The new homepage hero: one headline, one appointment button, and the clinic's own photography" loading="lazy" decoding="async" width="1200" height="621"><figcaption>The new homepage hero</figcaption></figure>
      <figure><img src="/assets/img/work/firstrehab-after-story.jpg" alt="The new Our Story section: a two-column layout pairing the clinic's history with its credentials" loading="lazy" decoding="async" width="1200" height="633"><figcaption>The new Our Story section</figcaption></figure>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">What we changed.</h2>
    <div class="cards three" data-sc-in data-sc-stagger="90">
      <div class="card">
        <h3>The challenge</h3>
        <p>A dated template site with a generic serif hero, slow load times, and no clear path to booking an appointment. A trusted clinic that had been treating patients for decades looked, online, like it had stopped paying attention.</p>
      </div>
      <div class="card">
        <h3>The approach</h3>
        <p>A ground-up rebuild around the clinic's real brand: a focused hero, an obvious Book Appointment path, pathways by service and by condition so a patient can find themselves on the page, and social proof where it does some good. Fast, and mobile first.</p>
      </div>
      <div class="card">
        <h3>The care</h3>
        <p>An ongoing maintenance plan keeps the site fast and secure, with content updates, monitoring and support, so it keeps performing long after the launch date stopped being interesting to anyone.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Numbers that moved.</h2>
    <div class="metrics" data-sc-in style="max-width:52rem">
      <div class="metric"><b>+50%</b><span>Organic clicks</span></div>
      <div class="metric"><b>+132%</b><span>Search impressions</span></div>
      <div class="metric"><b>22</b><span>Enquiries, first 30 days</span></div>
    </div>
    <p class="sc-body note" data-sc-in>Google Search Console, the 32 days after launch (21 July &ndash; 21 August 2026) against the 32 before, compared weekday to weekday because the earlier window contained a weekend and the later one did not. The enquiry count is from the site&rsquo;s own form; the previous site had no lead capture at all, so there is no percentage to quote against it. The method behind these figures is written up in <a href="/insights/measuring-whether-a-redesign-worked">how to tell whether a redesign actually worked</a>. We are not claiming a load-time improvement: no performance baseline was ever captured for the old site, so there is nothing to have measured against.</p>
  </div>
</section>
""" + nxt("/contact", "Next", "Get a number for yours")

write("case-first-rehab.html",
      head("First Rehabilitation of North Palm Beach",
           "Case study: a dated physical therapy clinic site rebuilt into a fast, "
           "appointment-driving experience, with before and after comparisons and the numbers.",
           "/case-first-rehab", og_type="article",
           nodes=[crumbs([("/work", "Work"),
                          ("/case-first-rehab", "First Rehabilitation of North Palm Beach")]),
                  {"@type": "Article", "@id": SITE + "/case-first-rehab#article",
                   "headline": "First Rehabilitation of North Palm Beach: a Wix clinic site rebuilt",
                   "description": "What changed, what it cost in effort, and what Search Console "
                                  "recorded in the 32 days after launch.",
                   "datePublished": "2026-08-24", "dateModified": "2026-09-03",
                   "inLanguage": "en-US",
                   "author": {"@id": SITE + "/#studio"},
                   "publisher": {"@id": SITE + "/#studio"},
                   "image": SITE + "/assets/img/work/firstrehab-after.jpg",
                   "about": {"@type": "Thing", "name": "Physical therapy clinic website redesign"},
                   "mainEntityOfPage": {"@id": SITE + "/case-first-rehab#page"}}]) + BODY + foot())
