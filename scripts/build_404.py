import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

BODY = """
<section class="lost">
  <div class="sc-wrap">
    <h1 class="sc-display sc-display--lg">This page is not here.</h1>
    <p class="sc-body">Either it moved, or the link that sent you was wrong. Neither is your fault. Here is everything that does exist.</p>
    <nav aria-label="Site">
      <a class="btn" href="/">Home</a>
      <a class="btn btn--quiet" href="/work">Work</a>
      <a class="btn btn--quiet" href="/services">Services</a>
      <a class="btn btn--quiet" href="/contact">Contact</a>
    </nav>
    <p class="sc-body note">Landed here from a link on our own site? Tell us at <a href="mailto:%s">%s</a> and we will fix it.</p>
  </div>
</section>
""" % (MAIL, MAIL)

write("404.html",
      head("Page not found",
           "That page is not here \u2014 it may have moved, or the link may be mistyped. "
           "Every page on the site is linked below, or start again from the homepage.",
           "/404", robots="noindex, follow", canonical=False) + BODY + foot())
