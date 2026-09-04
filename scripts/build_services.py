import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = phero(
    "Everything a site needs, from one bench.",
    "Design, build, launch and the care afterwards. One studio does all four, "
    "so nothing falls into the gap between two vendors and no one gets to blame "
    "the other when something breaks.",
    meta=["Websites", "Web and mobile apps", "Design", "Implementation", "Care"],
    cta=[("/contact", "Book a free consult", ""), ("/pricing", "See what it costs", " btn--quiet")],
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Custom website development</h2></div>
      <div data-sc-in>
        <p class="sc-body">Sites written by hand, not assembled from a page builder and eleven plugins holding hands. That is not purism. It is why your pages load in under a second, why a browser update does not take the site down, and why the next person who touches the code can read it.</p>
        <p class="sc-body">Every build is responsive because it is built that way from the first line, not squeezed into a phone at the end. Every build is reachable by keyboard and by screen reader, because a site that turns away a customer is a broken site.</p>
        <div class="cards two" data-sc-in data-sc-stagger="80">
          <div class="card"><h3>Marketing sites</h3><p>The site your business is judged by. Services, proof, and one obvious way to get in touch.</p></div>
          <div class="card"><h3>Rebuilds and migrations</h3><p>An aging site brought forward, with content, domains and email moved across without downtime.</p></div>
          <div class="card"><h3>E-commerce</h3><p>Product, cart and checkout wired to a payment processor you already trust.</p></div>
          <div class="card"><h3>Booking and intake</h3><p>Appointments, quotes and intake forms that land where your team actually works.</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Web and mobile apps</h2></div>
      <div data-sc-in>
        <p class="sc-body">When the thing you sell needs accounts, dashboards, scheduling or a workflow your team lives inside, a brochure site will not carry it. We build the application instead, on the same principles: your data stays yours, the code stays legible, and the thing keeps working when you are not looking.</p>
        <p class="sc-body">Most of this work is for businesses within twenty minutes of us &mdash; see <a href="/web-design-jupiter-fl">web design in Jupiter, Florida</a> for how a local project runs.</p>
        <p class="sc-body">We are honest about scope here. An app is a bigger commitment than a website, and most businesses that ask for one need three pages and a form. If that is you, we will say so before you spend anything.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Design</h2></div>
      <div data-sc-in>
        <p class="sc-body">Design starts with who is arriving, what they need to see, and what you want them to do. Structure first, then type and colour, then the details. You see real pages with your own words in them, on a real screen, rather than a mood board that flatters everyone and commits to nothing.</p>
        <p class="sc-body">Feedback is a conversation. If something we propose will not serve you, we will argue for it once and then build what you decide.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Implementation</h2></div>
      <div data-sc-in>
        <p class="sc-body">The unglamorous half, and the half that goes wrong when nobody owns it. Domains and DNS, email that keeps arriving through the move, analytics, payment processing, and the CRM or inbox every form has to reach.</p>
        <p class="sc-body">Nothing is called done because it looks right. Every form on your site gets submitted for real, from a phone, before launch. That is the only test that counts.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Hosting and care</h2></div>
      <div data-sc-in>
        <p class="sc-body">Most studios hand over a folder and disappear. We stay on it: managed hosting, TLS, security updates, backups, uptime monitoring, and the content changes you would otherwise have to learn a dashboard to make.</p>
        <p class="sc-body">Month to month, no lock-in. If you leave, you leave with your files and your domain, and we help you land somewhere else cleanly rather than holding the site hostage.</p>
        <div class="phero__cta"><a class="btn btn--quiet" href="/pricing">What care costs</a></div>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Included in every build, never an upsell.</h2>
    <div class="cards three" data-sc-in data-sc-stagger="80">
      <div class="card"><h3>Speed</h3><p>Images sized and compressed, fonts subset, nothing loaded that the page does not use.</p></div>
      <div class="card"><h3>Accessibility</h3><p>Keyboard reachable, screen-reader legible, and colour contrast measured rather than eyeballed.</p></div>
      <div class="card"><h3>Mobile</h3><p>Tested on real phone widths, not just resized in a desktop browser.</p></div>
      <div class="card"><h3>Search basics</h3><p>Titles, descriptions, structured data, a sitemap, and clean URLs that will not change.</p></div>
      <div class="card"><h3>Analytics</h3><p>Wired and verified, so you can see what the site is doing from day one.</p></div>
      <div class="card"><h3>Your code, yours</h3><p>No proprietary platform to rent. You own what we write and can take it anywhere.</p></div>
    </div>
  </div>
</section>
""" + nxt("/process", "Next", "How a build actually runs")

write("services.html",
      head("Services",
           "Custom websites, web and mobile apps, design, implementation, hosting and care. "
           "One small studio in Jupiter, Florida handling all of it.",
           "/services",
           nodes=[crumbs([("/services", "Services")])]) + BODY + foot())
