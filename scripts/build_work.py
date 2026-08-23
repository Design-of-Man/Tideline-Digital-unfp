import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

def compare(before, after, alt_b, alt_a, label, ratio):
    """A range input lying over the frame drives the reveal, so the comparison
       answers to a keyboard and a screen reader, not only to a mouse."""
    return f"""      <div>
        <div class="shot ba" data-ba style="--ratio: {ratio}">
          <div class="ba__pane"><img src="/assets/img/work/{after}" alt="{alt_a}" loading="lazy" decoding="async" width="1400" height="730"></div>
          <div class="ba__pane ba__pane--before"><img src="/assets/img/work/{before}" alt="{alt_b}" loading="lazy" decoding="async" width="1400" height="730"></div>
          <span class="ba__line" aria-hidden="true"></span>
          <span class="ba__tag ba__tag--before">Before</span>
          <span class="ba__tag ba__tag--after">After</span>
          <input class="ba__range" type="range" min="0" max="100" value="50"
                 aria-label="{label}: reveal more of the old site or more of the new one">
        </div>
        <p class="ba__hint">Drag the handle, or focus it and use the arrow keys.</p>
      </div>"""

BODY = phero(
    "Redesigns that moved the needle.",
    "Three real builds, with the old site still there to compare against. "
    "Where we have the numbers, they are on the page.",
    meta=["Home watch", "Orthopedics", "Physical therapy"],
) + """
<section class="sc-section band">
  <div class="sc-wrap">

    <article class="proj" data-sc-in>
      <div>
        <div class="shot" style="--ratio: 1400 / 714">
          <img src="/assets/img/work/homecrew-after.jpg" alt="HomeCrew, a residential home-watch site: dark hero with the service list and a booking call to action" width="1400" height="714" decoding="async">
        </div>
      </div>
      <div>
        <p class="proj__kind">Home watch &middot; Built from scratch</p>
        <h3>HomeCrew</h3>
        <p>A brand new site for a firefighter-owned residential home-watch company, built from a blank page into a trust-first experience with clear services, transparent pricing, and a consultation flow that does not make anyone hunt for the button.</p>
        <div class="proj__scope"><span>Brand and identity</span><span>Custom design</span><span>Service and pricing pages</span><span>Consultation booking</span><span>Mobile first</span></div>
        <div class="proj__links"><a href="/contact">Start a project like this</a></div>
      </div>
    </article>

    <article class="proj proj--flip" data-sc-in>
""" + compare("regenortho-before.jpg", "regenortho-after.jpg",
              "RegenOrtho Palm Beach, the previous site: dense navy layout with small type and stock imagery",
              "RegenOrtho Palm Beach, the rebuilt site: a clear editorial hero with booking in the first screen",
              "RegenOrtho Palm Beach", "1400 / 735") + """
      <div>
        <p class="proj__kind">Orthopedics &middot; Full redesign</p>
        <h3>RegenOrtho Palm Beach</h3>
        <p>A cluttered, dated medical site rebuilt into a clean, high-trust experience. A bold editorial hero, service navigation a patient can actually parse, and a booking-first layout that puts consultations in the first screen instead of the fourth.</p>
        <div class="proj__scope"><span>Full redesign</span><span>Identity refresh</span><span>Information architecture</span><span>Booking-first layout</span><span>Performance</span></div>
      </div>
    </article>

    <article class="proj" data-sc-in>
""" + compare("firstrehab-before.jpg", "firstrehab-after.jpg",
              "First Rehabilitation of North Palm Beach, the previous site: a template hero with a generic serif headline",
              "First Rehabilitation of North Palm Beach, the rebuilt site: a focused hero with a Book Appointment path",
              "First Rehabilitation of North Palm Beach", "1200 / 524") + """
      <div>
        <p class="proj__kind">Physical therapy &middot; Redesign and care</p>
        <h3>First Rehabilitation of North Palm Beach</h3>
        <p>A dated clinic site rebuilt into a fast, modern experience that turns visitors into booked appointments, with an ongoing care plan keeping it sharp.</p>
        <div class="metrics">
          <div class="metric"><b>+186%</b><span>Organic traffic</span></div>
          <div class="metric"><b>+72%</b><span>Appointment requests</span></div>
          <div class="metric"><b>2.4s faster</b><span>Load time</span></div>
        </div>
        <div class="proj__links">
          <a href="/case-first-rehab">Read the case study</a>
          <a href="https://www.firstrehabnpb.com" target="_blank" rel="noopener">Visit the live site</a>
        </div>
      </div>
    </article>

  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Why there are only three.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Because these are the ones we can show you with the old site sitting next to the new one, and because a studio that has been going two years and claims forty case studies is counting something other than clients.</p>
        <p class="sc-body">More of the work is under agreements that do not let us publish it. If you want a reference in your industry, ask on the call and we will put you in touch with someone.</p>
      </div>
    </div>
  </div>
</section>
""" + nxt("/contact", "Next", "Get a number for yours")

write("work.html",
      head("Work",
           "Three real redesigns with before and after comparisons: HomeCrew, "
           "RegenOrtho Palm Beach, and First Rehabilitation of North Palm Beach.",
           "/work") + BODY + foot())
