import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = phero(
    "Built piece by <em>deliberate</em> piece.",
    "Every site is assembled the way a machine is: parts chosen on purpose, "
    "seated properly, tested under load. Nothing gets glued on at the end because "
    "we ran out of time.",
    meta=["Four stages", "Two to twelve weeks", "You see it the whole way"],
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <ol class="steps" data-sc-in data-sc-stagger="70">
      <li><span class="step__n">01</span><div>
        <h3>The bench</h3>
        <p>Before anything is designed, we lay out what you sell, who is buying, and what has to happen on the page. We look at your current site, your competitors, and where your enquiries come from today. The whole build is measured off this, so it is worth an hour of your time.</p>
        <p>You leave this stage with a written scope, a fixed price, and a date. Typically one week.</p>
      </div></li>
      <li><span class="step__n">02</span><div>
        <h3>The core</h3>
        <p>Structure and design together: layout, type, the path a visitor takes, and the one thing you want them to do. You see real pages with your own words in them, in a browser, on a phone. Not a mood board and not a PDF.</p>
        <p>Two rounds of revisions are built into the price. Typically one to two weeks.</p>
      </div></li>
      <li><span class="step__n">03</span><div>
        <h3>The build</h3>
        <p>Hand-written markup, fast hosting, real accessibility. You get a live preview link on day one of this stage and it updates as we go, so there is no reveal at the end and no surprise about what you are getting.</p>
        <p>Content, images and copy get finalised here. Typically one to six weeks depending on size.</p>
      </div></li>
      <li><span class="step__n">04</span><div>
        <h3>The launch</h3>
        <p>Domain connected, email verified as still arriving, analytics wired, and every form on the site submitted for real from a phone before we call it live. Then hosting, updates, backups and monitoring for as long as you want us on it.</p>
        <p>Launch day itself is usually an hour. The care after it does not stop.</p>
      </div></li>
    </ol>
  </div>
</section>

<section class="band">
  <div class="sc-wrap">
    <blockquote class="pull" data-sc-in>
      <p>A site is not finished at launch, <em>it is just open</em>.</p>
      <footer>Which is why we stay on it after</footer>
    </blockquote>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">What we need from you.</h2>
    <p class="sc-body lede" data-sc-in>Projects slip for one reason more than any other, and it is never the code. Here is the honest list.</p>
    <div class="cards three" data-sc-in data-sc-stagger="80">
      <div class="card"><h3>One decision maker</h3><p>Someone who can say yes. Design by committee doubles the timeline and rarely improves the result.</p></div>
      <div class="card"><h3>Your content, early</h3><p>Copy, photos, logos, licence numbers. We can write and source, but we cannot invent what only you know.</p></div>
      <div class="card"><h3>Access</h3><p>Domain registrar, current host, analytics. We will walk you through finding each one if you have lost them.</p></div>
      <div class="card"><h3>Feedback in rounds</h3><p>Collected and sent together rather than trickling in over a fortnight. It gets you a better site faster.</p></div>
      <div class="card"><h3>Honesty about the deadline</h3><p>If there is a real date, say so at the bench. We will tell you whether it is possible before you pay anything.</p></div>
      <div class="card"><h3>Patience with the boring part</h3><p>Migrations, DNS and email are the least interesting and the highest risk. They get done carefully.</p></div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">How long it really takes.</h2>
    <div class="cards three" data-sc-in data-sc-stagger="80">
      <div class="card"><h3>Two to three weeks</h3><p>A focused site for a local business. Up to five pages, a contact form, the search basics.</p></div>
      <div class="card"><h3>Four to six weeks</h3><p>Most business sites. Custom design throughout, integrations, content migrated from an old site.</p></div>
      <div class="card"><h3>Eight to twelve weeks</h3><p>E-commerce, booking systems, or an application with accounts and a workflow behind it.</p></div>
    </div>
    <p class="sc-body note" data-sc-in>These are the ranges we actually hit, not best cases. The date you get at the bench is the one we hold.</p>
  </div>
</section>
""" + nxt("/pricing", "Next", "What it costs")

write("process.html",
      head("Process",
           "Four stages from first conversation to launch: the bench, the core, "
           "the build, the launch. What happens at each, and how long it takes.",
           "/process") + BODY + foot())
