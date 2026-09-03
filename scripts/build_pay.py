import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = phero(
    "Settle up in <em>about a minute</em>.",
    "Pay an invoice or manage your monthly plan. Everything runs through Stripe, "
    "so your card and bank details never touch our servers.",
    meta=["256-bit TLS", "PCI DSS Level 1 via Stripe", "Bank transfer or card"],
    cta=[("#resend", "Resend my invoice", ""),
         ("#manage", "Manage my plan", " btn--quiet")],
) + """
<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Two things happen here.</h2>
    <p class="sc-body lede" data-sc-in>If your invoice arrived by email, the button inside it is the fastest route. Everything else is below.</p>
    <div class="cards three" data-sc-in data-sc-stagger="90">
      <div class="card plan" id="invoice">
        <h3>Pay an invoice</h3>
        <p>Deposits, milestones and final balances for build work. Your invoice arrives by email with a secure payment button.</p>
        <ul><li>Bank transfer or card</li><li>Receipt emailed instantly</li><li>No login required</li></ul>
        <p><a class="btn btn--quiet" href="#resend">Resend my invoice</a></p>
      </div>
      <div class="card plan" id="manage">
        <h3>Manage your monthly plan</h3>
        <p>Update your card, download past receipts, or change your billing details. Enter your email and Stripe sends a secure link.</p>
        <ul><li>Every past receipt, on demand</li><li>Swap an expired card in seconds</li><li>Nothing to remember</li></ul>
        <!-- PRE-LAUNCH: Stripe Customer Portal login link.
             Dashboard -> Settings -> Billing -> Customer portal -> Login page. -->
        <p><a class="btn btn--quiet" href="https://billing.stripe.com/p/login/REPLACE_PORTAL_LINK" rel="noopener">Open my dashboard</a></p>
      </div>
      <div class="card plan">
        <h3>Something looks wrong</h3>
        <p>Lost the invoice, charged the wrong amount, or a payment did not go through? Tell us and we will sort it out.</p>
        <ul><li>Answered within one business day</li><li>Or call and skip the queue</li><li>No automated runaround</li></ul>
        <p><a class="btn btn--quiet" href="#resend">Get it fixed</a></p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Bank transfer is cheaper.</h2></div>
      <div data-sc-in>
        <p class="sc-body">Card fees scale with the invoice. Bank transfer costs a few dollars flat whatever the amount, so it is what we default to on build work. We absorb the processing fee either way.</p>
        <dl class="rows">
          <div><dt>Bank transfer</dt><dd>Best for project invoices. Clears in two to four business days. About $5 on a $6,000 invoice.</dd></div>
          <div><dt>Card</dt><dd>Best for monthly plans. Clears immediately. About $174 on a $6,000 invoice. Visa, Mastercard, Amex and Discover.</dd></div>
        </dl>
        <p class="sc-body note">Those are Stripe's published US rates and may change.</p>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <div class="doc warn" data-sc-in>
      <h2 class="sc-display sc-display--md">Before you send money, read this.</h2>
      <p><strong>We will never email you new bank details.</strong> Our payment instructions do not change. If a message appears to come from us asking you to wire funds elsewhere, or claiming our banking has been updated, it is fraud.</p>
      <p>Stop, do not reply, and check with us at <a href="mailto:%s">%s</a> &mdash; the address on this page, typed in by hand, not one taken from the email. Invoice redirection fraud is common and the money is rarely recoverable once sent.</p>
      <p>Every real invoice from us arrives from our own domain and is paid through Stripe. If a payment page is not on <strong>stripe.com</strong> or on this site, do not enter anything into it.</p>
    </div>
  </div>
</section>

<section class="sc-section band band--alt" id="resend">
  <div class="sc-wrap">
    <div class="split">
      <div>
        <h2 class="sc-display sc-display--md" data-sc-kinetic="lines">We will send it again.</h2>
        <p class="sc-body" data-sc-in>Tell us who you are and we will resend the payment link to the email on your account, usually within a business day.</p>
      </div>
      <div>
        <form class="form" id="resendForm" method="POST" action="/api/contact" data-sc-in>
          <input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">
          <input type="hidden" name="_t" value="">
          <div class="field"><label for="r-name">Your name</label><input id="r-name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="r-company">Business <span class="opt">optional</span></label><input id="r-company" name="company" type="text" autocomplete="organization"></div>
          <div class="field"><label for="r-email">Email on the account</label><input id="r-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="r-invoice">Invoice number <span class="opt">if you have it</span></label><input id="r-invoice" name="invoice" type="text" placeholder="DOM-1042"></div>
          <div class="field"><label for="r-note">Anything else</label><textarea id="r-note" name="message" rows="4"></textarea></div>
          <button class="btn" type="submit">Resend my invoice</button>
          <p class="form__note" role="status">For security we resend to the email already on your account, never to a new one.</p>
        </form>
      </div>
    </div>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">The ones that come up.</h2>
    <div data-sc-in data-sc-stagger="60">
      <details class="qa" open><summary>When is payment due on a build?</summary><p>Half up front to reserve the schedule, half on launch. Larger builds are split into milestones, agreed in writing before work begins. Invoices are due on receipt unless your agreement says otherwise.</p></details>
      <details class="qa"><summary>What does my monthly plan cover?</summary><p>Whatever we agreed when you signed on. Every plan is scoped to the site it looks after, so no two are identical. Your agreement spells it out, and a copy of every invoice is in your dashboard. If you want to change what is included, call us.</p></details>
      <details class="qa"><summary>What happens if a payment fails?</summary><p>Stripe emails you and retries automatically over the following days. Most failures are just an expired card. You will hear from us before anything changes, and we do not take a site offline over a failed payment without talking to you first.</p></details>
      <details class="qa"><summary>Can I cancel?</summary><p>Yes. Your plan runs to the end of the period you have already paid for. Give us a few days' notice on hosting so we can hand over your files and help you migrate cleanly, rather than leaving you with a dead domain.</p></details>
      <details class="qa"><summary>Do you take cheques or Zelle?</summary><p>We prefer Stripe. You get a receipt and a paper trail, and we get less to reconcile. If a cheque is genuinely easier for your bookkeeping, call and we will work it out.</p></details>
      <details class="qa"><summary>Where do I get receipts for my accountant?</summary><p>Stripe emails a receipt on every payment, and every past invoice is downloadable any time from <a href="#manage">your dashboard</a>.</p></details>
      <details class="qa"><summary>Is my card information safe here?</summary><p>We never see it. Card and bank details are entered on Stripe's own pages and stored by Stripe, a PCI DSS Level 1 provider. Nothing sensitive is stored on this site or on our systems.</p></details>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Talk to a person.</h2></div>
      <div data-sc-in>
        <p class="sc-body">If an invoice looks wrong or a payment did not go through, write to us. You will get one of us, not a queue.</p>
        <div class="phero__cta">
          <a class="btn" href="mailto:%s">Email us</a>
          <a class="btn btn--quiet" href="/contact">Contact form</a>
        </div>
      </div>
    </div>
  </div>
</section>
""" % (MAIL, MAIL, MAIL)

write("pay.html",
      head("Billing",
           "Pay an invoice or manage your monthly plan. Everything runs through Stripe. "
           "Includes what to do if something looks wrong.",
           "/pay", robots="noindex, follow",
           nodes=[crumbs([("/pay", "Billing")])]) + BODY + foot())
