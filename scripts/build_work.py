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
    "The build we are free to show in full, with the old site still there to "
    "compare against. Where we have the numbers, they are measured, not estimated.",
    meta=["Orthopedics", "Physical therapy"],
) + """
<section class="sc-section band">
  <div class="sc-wrap">



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
          <div class="metric"><b>+50%</b><span>Organic clicks</span></div>
          <div class="metric"><b>+132%</b><span>Search impressions</span></div>
          <div class="metric"><b>22</b><span>Enquiries in 30 days</span></div>
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
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Also built recently.</h2></div>
      <div data-sc-in>
        <p class="sc-body"><strong>Orthopedics &middot; Full redesign.</strong> A cluttered, dated medical site rebuilt into a clean, high-trust experience. A bold editorial hero, service navigation a patient can actually parse, and a booking-first layout that puts consultations in the first screen instead of the fourth.</p>
        <p class="sc-body">Named and shown on request rather than on the page, because publishing a client&rsquo;s brand and screenshots is theirs to agree to, not ours to assume. Ask on the call and we will walk you through it, or put you in touch with the owner.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Why the numbers are small.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Because they are measured rather than rounded up. The figures above come from Google Search Console for the 32 days after launch against the 32 before, compared weekday to weekday so a weekend does not flatter the result. The enquiry count is the site&rsquo;s own form; the previous site had no lead capture, so there is no percentage to quote.</p>
        <p class="sc-body">More of the work is under agreements that do not let us publish it. A studio two years old claiming forty case studies is counting something other than clients.</p>
      </div>
    </div>
  </div>
</section>

""" + nxt("/contact", "Next", "Get a number for yours")

write("work.html",
      head("Work",
           "A physical therapy redesign shown before and after with measured results, "
           "plus recent work in orthopedics.",
           "/work") + BODY + foot())
