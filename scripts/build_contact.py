import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

FORM = """
      <!-- PRE-LAUNCH: action still carries Formspree's YOUR_FORM_ID placeholder.
           See PRELAUNCH.md. assets/js/form.js keeps a submission from being lost
           while that is true: it hands the filled-in fields to the visitor's mail
           client and steps aside the moment a real endpoint is set. -->
      <form class="form" id="consultForm" method="POST"
            action="https://formspree.io/f/YOUR_FORM_ID" data-sc-in>
        <div class="field"><label for="cf-name">Name</label><input id="cf-name" name="name" type="text" autocomplete="name" required></div>
        <div class="field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="cf-company">Business <span class="opt">optional</span></label><input id="cf-company" name="company" type="text" autocomplete="organization"></div>
        <div class="field"><label for="cf-project">What do you need?</label>
          <select id="cf-project" name="project" required>
            <option value="">Choose one</option>
            <option>A new website</option>
            <option>A rebuild of an existing site</option>
            <option>A web or mobile app</option>
            <option>Hosting and maintenance only</option>
            <option>Something else</option>
          </select></div>
        <div class="field"><label for="cf-message">Tell us a little about it</label><textarea id="cf-message" name="message" rows="5" required></textarea></div>
        <button class="btn" type="submit">Book my consult</button>
        <p class="form__note" role="status">This form opens your email app with your answers filled in — nothing sends until you send it there. No email app? Write to <a href="mailto:%s">%s</a>.</p>
      </form>
""" % (MAIL, MAIL)

BODY = phero(
    "Tell us what you are <em>building</em>.",
    "A new site, a rebuild, or an existing one that needs someone reliable looking "
    "after it. Start with a conversation, not a contract.",
    meta=["Free 30-minute consult", "A real person reads every enquiry", "Jupiter, Florida"],
) + """
<section class="sc-section band" id="consult">
  <div class="sc-wrap">
    <div class="split">
      <div>
        <h2 class="sc-display sc-display--md" data-sc-kinetic="lines">We answer our own phone.</h2>
        <dl class="rows" data-sc-in>
          <div><dt>Phone</dt><dd><a href="tel:%s">%s</a></dd></div>
          <div><dt>Email</dt><dd><a href="mailto:%s">%s</a></dd></div>
          <div><dt>Where</dt><dd>Jupiter, Florida</dd></div>
          <div><dt>Hours</dt><dd>Monday to Friday, 9 to 5 Eastern</dd></div>
        </dl>
        <p class="sc-body note" data-sc-in>Already a client with a billing question? <a href="/pay">Head to billing</a> instead.</p>
      </div>
      <div>
        <p class="sc-body" data-sc-in>Bring whatever you have: a rough idea, a competitor's site you like, or a list of everything wrong with your current one. We will tell you honestly what it takes, and whether we are the right people for it.</p>
%s
      </div>
    </div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">What happens after you send this.</h2>
    <ol class="steps" data-sc-in data-sc-stagger="70">
      <li><span class="step__n">01</span><div><h3>We read it and reply</h3><p>A real person, not an autoresponder. If what you need is outside what we do, we will say so and point you somewhere better.</p></div></li>
      <li><span class="step__n">02</span><div><h3>Thirty minutes on a call</h3><p>What you sell, who is buying, and what the site has to do. No deck, no pitch. Bring your current site if you have one.</p></div></li>
      <li><span class="step__n">03</span><div><h3>A written scope and one number</h3><p>Exactly what gets built, exactly when, and exactly what it costs. Yours to keep whether or not you go ahead.</p></div></li>
    </ol>
  </div>
</section>

<section class="sc-section band">
  <div class="sc-wrap">
    <h2 class="sc-display sc-display--lg" data-sc-kinetic="lines">Before you ask.</h2>
    <div data-sc-in data-sc-stagger="60">
      <details class="qa"><summary>Do you work with businesses outside Florida?</summary><p>Yes. Most of our clients are within an hour of Jupiter because that is where we are, but the work runs the same either way and plenty of it is remote.</p></details>
      <details class="qa"><summary>How small is too small?</summary><p>There is no floor. A single well-built page that gets your phone ringing is a real project and we are happy to do it.</p></details>
      <details class="qa"><summary>Can you fix my existing site instead of rebuilding it?</summary><p>Often, yes, and we will tell you honestly when that is the better value. Sometimes a rebuild is genuinely cheaper than untangling what is there. We will show you why.</p></details>
      <details class="qa"><summary>I have a deadline. Is that a problem?</summary><p>Only if we find out about it late. Say so on the first call and we will tell you straight away whether it is possible.</p></details>
    </div>
  </div>
</section>
""" % (TELH, TELD, MAIL, MAIL, FORM)

write("contact.html",
      head("Contact",
           "Book a free 30-minute consult with a small web studio in Jupiter, Florida. "
           "You leave with a written scope and one exact number.",
           "/contact") + BODY + foot())
