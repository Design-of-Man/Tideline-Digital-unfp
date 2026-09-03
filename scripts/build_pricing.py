import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = phero(
    "Simple plans, no surprises.",
    "Three ways we usually work. Every build is scoped to what it actually needs, "
    "so the consult ends with one exact number for your project rather than a range "
    "you have to guess inside of.",
    cta=[("/contact", "Get an exact quote", "")],
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <div class="cards three plans" data-sc-in data-sc-stagger="90">
      <div class="card plan">
        <h3>Launch</h3>
        <p>A clean, professional site to get your business online and converting.</p>
        <ul>
          <li>Up to five custom pages</li>
          <li>Responsive on every screen</li>
          <li>Contact form, tested for real</li>
          <li>Search basics and analytics</li>
          <li>Live in two to three weeks</li>
        </ul>
        <a class="btn btn--quiet" href="/contact">Get started</a>
      </div>
      <div class="card plan plan--lead">
        <h3>Scale</h3>
        <p>A fully custom site with the integrations and the room to grow with you.</p>
        <ul>
          <li>Everything in Launch</li>
          <li>Unlimited custom pages</li>
          <li>CRM, payments and analytics wired up</li>
          <li>Content migrated from your old site</li>
          <li>Three months of care included</li>
        </ul>
        <a class="btn" href="/contact">Get started</a>
      </div>
      <div class="card plan">
        <h3>Care</h3>
        <p>Ongoing hosting and maintenance, so the site stays fast, secure and current.</p>
        <ul>
          <li>Managed hosting and uptime alerts</li>
          <li>Security updates and backups</li>
          <li>Monthly content updates</li>
          <li>A person who answers, same day</li>
          <li>Month to month, no contract</li>
        </ul>
        <a class="btn btn--quiet" href="/contact">Get started</a>
      </div>
    </div>
    <p class="sc-body note" data-sc-in>Not sure which fits? Book a free consult and we will point you at the right one, including the one where you do not need us.</p>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Why there is no price on this page.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Because any number we printed here would be wrong for most of the people reading it. A five-page site for a local trade and a booking platform with accounts and payments are both websites, and they are not remotely the same job.</p>
        <p class="sc-body">What we can promise is that the number you get is fixed before work starts, and that it does not move unless you ask for something outside the written scope. If a change costs more, you hear the number before we build it.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">What actually moves the number.</h2>
    <div class="cards three" data-sc-in data-sc-stagger="80">
      <div class="card"><h3>How many pages</h3><p>Not the page count itself so much as how many are genuinely different. Twelve service pages built from one template cost far less than three pages that each work differently.</p></div>
      <div class="card"><h3>What it connects to</h3><p>A contact form is an afternoon. Payments, a CRM, a booking system and an inventory feed each add real work, and each has to be tested end to end.</p></div>
      <div class="card"><h3>Who writes the words</h3><p>If you have the copy, we build. If you need it written, that is a stage of its own and we price it separately so you can decide.</p></div>
      <div class="card"><h3>Where the content lives now</h3><p>Migrating a hundred blog posts, a product catalogue or a decade of PDFs takes time. So does rescuing a site whose old host has already gone dark.</p></div>
      <div class="card"><h3>Whether you need to edit it</h3><p>A site you never touch is simpler and cheaper than one your team updates weekly. Both are fine. They are different builds.</p></div>
      <div class="card"><h3>The deadline</h3><p>A normal schedule costs what it costs. Compressing eight weeks into three means turning other work away, and that shows up in the number.</p></div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">How payment works.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Half up front to reserve the schedule, half on launch. Larger builds split into milestones, agreed in writing before anything starts. Care plans bill monthly and you can stop them whenever you like.</p>
        <p class="sc-body">Everything runs through Stripe, so your card and bank details never touch our servers. Bank transfer is cheaper than card on a project invoice and it is what we default to.</p>
        <div class="phero__cta"><a class="btn btn--quiet" href="/pay">Billing and invoices</a></div>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">The money questions.</h2>
    <div data-sc-in data-sc-stagger="60">
      <details class="qa"><summary>Is the consult really free?</summary><p>Yes, and there is no pitch deck. Thirty minutes on what you need, and you leave with our honest read on it whether or not you hire us. If the right answer is a template on a platform you already pay for, we will say that.</p></details>
      <details class="qa"><summary>What if the project grows halfway through?</summary><p>We price the addition and you decide before we build it. Nothing gets added to your invoice that you have not agreed to in writing first.</p></details>
      <details class="qa"><summary>Do I have to take a care plan?</summary><p>No. You can host the site yourself or with anyone you like, and you own the code either way. Most clients stay because not thinking about it is worth the monthly, not because they are locked in.</p></details>
      <details class="qa"><summary>What does a care plan actually cover?</summary><p>Hosting, TLS, security updates, backups, uptime monitoring and a set amount of content changes each month. It is scoped to the site it looks after, so no two are identical, and your agreement spells out exactly what is in yours.</p></details>
      <details class="qa"><summary>Can I pay monthly for the build itself?</summary><p>Sometimes, for larger projects, structured as milestones. Ask at the consult. We would rather set it up properly than have you take on a payment plan that does not suit the business.</p></details>
      <details class="qa"><summary>What happens if I want to leave?</summary><p>You get your files and we help you move. Your domain is yours and always was. We will not make the exit painful to keep your business.</p></details>
    </div>
  </div>
</section>
""" + nxt("/contact", "Next", "Get your number")

write("pricing.html",
      head("Pricing",
           "Three ways we work: Launch, Scale and Care. What moves the price, how "
           "payment is structured, and why the exact number comes from the consult.",
           "/pricing",
           nodes=[crumbs([("/pricing", "Pricing")])] + faq(BODY, "/pricing")) + BODY + foot())
