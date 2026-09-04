import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = phero(
    "Small on purpose, careful by <em>default</em>.",
    "The person who scopes your project is the person who designs it, builds it, "
    "and answers when you call after launch. There is no account layer, because "
    "there is nobody spare to staff one.",
    meta=["Jupiter, Florida", "Founded 2024", "Websites and web apps"],
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Why we stayed small.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Most agencies grow by adding people between the client and the work. A salesperson makes the promise, an account manager relays it, and by the time it reaches whoever is actually building, half of what you said has been paraphrased twice.</p>
        <p class="sc-body">We went the other way. Fewer projects at a time, each one handled start to finish by the people doing the work. You get straight answers about timelines, honest pushback when an idea will not serve you, and a site nobody has to reverse-engineer six months later.</p>
        <p class="sc-body">It also means we say no more often than a larger shop would. If your project needs a team of twelve, we are the wrong studio, and we will tell you that on the first call rather than in month four.</p>
      </div>
    </div>
  </div>
</section>

<section class="band">
  <div class="sc-wrap">
    <blockquote class="pull" data-sc-in>
      <p>We build the foundation your business stands on, <em>not a template stretched to fit</em>.</p>
      <footer>Measured, drafted, and built for the long haul</footer>
    </blockquote>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">What we will not do.</h2>
    <p class="sc-body lede" data-sc-in>Every studio lists its values. These are ours stated as refusals, because a refusal is the only kind you can hold us to.</p>
    <div class="cards two" data-sc-in data-sc-stagger="90">
      <div class="card"><h3>We will not stack plugins until it works</h3><p>If a feature needs code, it gets code. A site held together by eleven third-party extensions is a site that breaks on somebody else's release schedule.</p></div>
      <div class="card"><h3>We will not ship a page you cannot use with a keyboard</h3><p>An unreachable control is a defect, the same as a broken link. We fix it. We do not ask you to accept it as a trade-off.</p></div>
      <div class="card"><h3>We will not quote a number we cannot hold</h3><p>The consult ends with an exact price for an exact scope. If the scope changes, we tell you what it costs before we build it, not after.</p></div>
      <div class="card"><h3>We will not disappear at launch</h3><p>Launch is when the site starts being useful, not when our job ends. Care is part of the arrangement, month to month, cancel whenever.</p></div>
      <div class="card"><h3>We will not lock you in</h3><p>You own the code and the domain. If you leave, we help you migrate cleanly rather than making the exit expensive.</p></div>
      <div class="card"><h3>We will not pad a proposal</h3><p>No line items for work nobody needs. If a page can do the job, we will not sell you nine.</p></div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Where we are.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Jupiter, Florida. Most of our clients are within an hour of here, which means we can sit across a table from you when that is the fastest way to settle something. The rest are anywhere, and the work runs the same way.</p>
        <dl class="rows" data-sc-in>
          <div><dt>Email</dt><dd><a href="mailto:%s">%s</a></dd></div>
          <div><dt>Start here</dt><dd><a href="/contact">Book a free 30-minute consult</a></dd></div>
          <div><dt>Read first</dt><dd><a href="/insights">Notes from the bench</a>, including what we got wrong on our own site</dd></div>
          <div><dt>Where</dt><dd>Jupiter, Florida</dd></div>
          <div><dt>Hours</dt><dd>Monday to Friday, 9 to 5 Eastern. Emails answered within one business day.</dd></div>
        </dl>
      </div>
    </div>
  </div>
</section>
""" % (MAIL, MAIL) + nxt("/work", "Next", "The work itself")

write("studio.html",
      head("Studio",
           "A small web studio in Jupiter, Florida. The person who scopes your project "
           "designs it, builds it, and is still the one answering you after launch.",
           "/studio",
           nodes=[crumbs([("/studio", "Studio")])]) + BODY + foot())
