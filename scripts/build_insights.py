import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

# Three articles, each one written out of work that is in this repository and
# checkable against it. That is the whole editorial rule: if we cannot point at
# the commit, the measurement or the file, it does not go up. Generic "10 tips
# for a faster website" content ranks for nothing and says nothing, and any
# reader who has been sold that before can tell within a paragraph.

ARTICLES = [
    dict(
        slug="cumulative-layout-shift-scroll-animation",
        seo_title="Fixing Layout Shift in a Scroll Animation",
        title="A scroll animation cost us a Lighthouse grade, and the fix was four lines of CSS",
        desc=("Our homepage scored 0.563 for Cumulative Layout Shift, a failing grade. "
              "The cause, the four-line CSS fix, and how to find yours."),
        date="2026-08-24",
        mod="2026-09-03",
        read="6 min",
        topic="Performance",
        body="""
<p>Our own homepage scored <strong>0.563</strong> on Cumulative Layout Shift on a throttled phone. Google considers anything above 0.25 poor. Lighthouse put mobile performance at 49. This is a site built by people who sell performance for a living, so it is worth writing down exactly how that happened, because the shape of the mistake is extremely common.</p>

<h2>What CLS actually measures</h2>
<p>Cumulative Layout Shift scores how much visible content jumps around while a page loads, without the user asking it to. Every developer has experienced the failure it is designed to catch: you go to tap a link, an image finishes loading above it, the page lurches, and you tap an advert instead. CLS puts a number on that.</p>
<p>It is one of the three Core Web Vitals, it is a real ranking input, and unlike the other two it is not primarily about speed. A slow site with a stable layout scores fine. A fast site that reflows scores badly.</p>

<h2>The cause: measuring in JavaScript what CSS already knew</h2>
<p>Our homepage opens with a film that scrubs as you scroll. The animation engine pins a section and gives it a scroll length — five viewport heights, say — so there is somewhere to scroll while the film plays. The engine did that by writing an inline height onto each pinned section during initialisation:</p>
<p><code>section.style.height = span * 100 + 'vh'</code></p>
<p>Which is correct, and which happens too late. Between first paint and the engine booting, every pinned section is only as tall as its contents — a few hundred pixels instead of several thousand. So the entire page below the film renders several screens too high, and then, the moment the engine initialises, everything below snaps down into place.</p>
<div class="aside"><p>The page was never <em>wrong</em>. It was right, then briefly wrong, then right again — and the browser scores that middle state.</p></div>
<p>This is worth generalising, because it is not really a bug about scroll animation. <strong>Any layout value your JavaScript computes on load is a layout shift waiting to happen.</strong> Web fonts swapping in without <code>size-adjust</code>. Images without width and height attributes. A cookie banner injected at the top of the document. An embed that arrives at its real size a second late. All the same failure: the browser was asked to lay out a page before it had been told how big things are.</p>

<h2>The fix</h2>
<p>The section already declared its scroll length in the markup, for the engine to read:</p>
<p><code>data-sc-span="5.2"</code></p>
<p>So we mirrored the same number into a custom property on the same element, and let CSS reserve the space before a single line of JavaScript runs:</p>
<p><code>style="--sc-span:5.2"</code>, with <code>[data-sc-act] { height: calc(var(--sc-span) * 100vh); }</code> in the stylesheet.</p>
<p>The engine still writes its own height when it boots. It now writes the same number the browser had already used, so nothing moves.</p>
<ul>
  <li>CLS: <strong>0.563 → 0.002</strong></li>
  <li>Lighthouse mobile performance: <strong>49 → 77</strong></li>
</ul>
<p>The cost is one duplicated number per section, which is a genuine maintenance hazard: change the span attribute and forget the custom property, and the shift comes back silently. We took the trade because a comment in the stylesheet is cheaper than a failing Core Web Vital, but it is a trade, not a free win. If you do this, put the two values on the same line so they are hard to edit apart.</p>

<h2>How to find yours</h2>
<p>Do not trust a desktop Lighthouse run. CLS is dominated by slow connections and slow CPUs, which is where the gap between first paint and JavaScript is widest.</p>
<ol>
  <li>Chrome DevTools, Lighthouse panel, <strong>Mobile</strong> with throttling on. Run it three times and take the worst.</li>
  <li>Open the Performance panel, record a load, and look for the <em>Layout Shift</em> markers. Each one tells you the element that moved.</li>
  <li>Then check field data in Search Console's Core Web Vitals report, which is real visitors rather than a simulation. Lab and field disagree often, and field wins.</li>
</ol>
<p>The pattern to look for is not a slow page. It is a page that finishes loading in a different shape than it started.</p>
""",
    ),
    dict(
        slug="measuring-whether-a-redesign-worked",
        seo_title="Did Your Website Redesign Actually Work?",
        title="How to tell whether a website redesign actually worked",
        desc=("Most redesign case studies compare incomparable periods. The method we "
              "use instead, and the weekday trap that nearly fooled us."),
        date="2026-08-26",
        mod="2026-09-03",
        read="7 min",
        topic="Measurement",
        body="""
<p>Almost every agency case study you have read contains a number nobody could reproduce. Ours did too, until recently: an earlier version of this site claimed a client saw <strong>+186% organic traffic</strong> and <strong>+72% appointment requests</strong> over &ldquo;the eight months following launch&rdquo;, for a site that had been live for six weeks. Nobody wrote that in bad faith. It was placeholder copy from a design mockup that nobody removed before it went up, which is how most fabricated case-study numbers happen.</p>
<p>We took it down and did the measurement properly. This is the method, and the traps in it.</p>

<h2>Decide what you are measuring before you look</h2>
<p>A redesign can plausibly move: impressions, clicks, click-through rate, average position, enquiries, calls, bookings, revenue. These do not move together, and some of them move in opposite directions for good reasons. A site that starts ranking for many broad queries gains impressions and <em>loses</em> average click-through rate, which looks like a regression and is not.</p>
<p>Write down the one or two numbers that represent the business outcome before you open the dashboard. For a clinic it is booked appointments. For a trade it is quote requests. Traffic is a means, not the outcome.</p>

<h2>Compare like with like, which is harder than it sounds</h2>
<p>Take our own client launch, 20 July 2026. The obvious comparison is the 32 days after launch against the 32 days before. Run that naively and you get a number that is wrong, because the pre-launch window happened to contain an extra weekend.</p>
<div class="aside"><p>For a physical therapy clinic, weekends are close to dead. A window with more weekend days in it has a lower daily average for reasons that have nothing to do with the website.</p></div>
<p>So we compared <strong>weekday to weekday</strong>: mean weekday performance after launch against mean weekday performance before. That produced:</p>
<ul>
  <li><strong>+50%</strong> organic clicks — 3.64 to 5.46 per weekday</li>
  <li><strong>+132%</strong> search impressions — 190 to 440 per weekday</li>
</ul>
<p>Both smaller and more defensible than the numbers they replaced. Note that we quote the raw daily figures alongside the percentages. A percentage with no denominator is not a result; going from two clicks a day to six is +200% and is also almost nothing.</p>

<h2>Say plainly what you cannot measure</h2>
<p>The same client got 22 enquiries through the site's form in the first 30 days. We report that as a count, not as an increase, because the previous site had <em>no form at all</em>. There is no percentage to quote against zero, and dividing by zero to produce an impressive infinity is exactly the kind of thing that makes case studies worthless.</p>
<p>We also do not claim a load-time improvement, though the new site is obviously faster. Nobody captured a performance baseline for the old site before it was replaced, so there is nothing to compare against. An honest gap is worth more than a number you reconstructed after the fact.</p>

<h2>Traps that will bite you</h2>
<ul>
  <li><strong>Search Console truncates.</strong> The UI shows the top 1,000 rows. Summing a query table and calling it site total will understate you, sometimes badly. Use the totals row or the API.</li>
  <li><strong>Seasonality outruns the redesign.</strong> A Florida clinic in July is not a Florida clinic in February. Where you can, compare against the same period last year as well as against the period before.</li>
  <li><strong>The launch is not a clean line.</strong> Google takes weeks to recrawl and settle. Measuring from day one includes a re-indexing dip that has nothing to do with the design.</li>
  <li><strong>Attribution is not free.</strong> If you did not tag the form, you cannot tell an enquiry from the site apart from one from a business card. Wire that up <em>before</em> launch, not after.</li>
  <li><strong>Ranking is not traffic and traffic is not revenue.</strong> Every step in that chain leaks. Report the one nearest the money.</li>
</ul>

<h2>The test</h2>
<p>Before you publish a figure about your own work, ask whether a client could reproduce it from their own dashboards in ten minutes given the window you specified. If not, either specify the window properly or do not publish the figure. That test alone removes most of what is wrong with agency case studies, including one of ours.</p>
""",
    ),
    dict(
        slug="your-contact-form-is-losing-leads",
        seo_title="Why Contact Forms Lose Leads Silently",
        title="Your contact form is probably losing leads, and you would never know",
        desc=("A broken contact form is invisible from both ends. The five ways they "
              "die quietly, and how to build one that cannot lie to you."),
        date="2026-08-30",
        mod="2026-09-03",
        read="6 min",
        topic="Build quality",
        body="""
<p>A broken contact form is the worst defect a small-business website can have, because it is the only one that is <em>completely invisible from both ends</em>. The visitor fills it in, sees &ldquo;thanks, we will be in touch&rdquo;, and reasonably assumes they have been in touch. You see an ordinary week. Neither of you has any reason to investigate. We have found forms that had been dead for over a year.</p>
<p>Our own site shipped with a version of this, which is the reason for this article. The form's action was <code>https://formspree.io/f/YOUR_FORM_ID</code> — a literal placeholder from the original template, never replaced. Anything posted to it would have 404'd.</p>

<h2>The five ways forms die quietly</h2>
<h3>1. The endpoint was never configured</h3>
<p>The template placeholder survives into production. This is by far the most common one, and it is most common on sites that <em>look</em> most finished, because the polish is what draws attention away from the plumbing.</p>
<h3>2. The success message is client-side only</h3>
<p>Plenty of forms show the thank-you state on submit, before the server has answered — or without ever asking a server. The visitor sees success whether or not anything was delivered. If your form shows its confirmation instantly, be suspicious.</p>
<h3>3. Delivery is filtered</h3>
<p>The form sends, but the notification is sent <em>from</em> your own domain by a server that is not authorised to do so. Modern SPF, DKIM and DMARC checks drop that mail outright, or file it in spam. The form works perfectly; the email never surfaces. Sending from a verified transactional domain and setting <em>reply-to</em> as the enquirer avoids this.</p>
<h3>4. The free tier ran out</h3>
<p>Third-party form services cap monthly submissions. Past the cap, submissions are rejected or silently held. This is a special kind of cruel, because it fails precisely in the month you were busiest.</p>
<h3>5. Spam drowned it</h3>
<p>Not a technical failure. Bots fill the inbox with garbage, someone builds a filter, the filter is slightly too broad, and a real enquiry lands in the same folder. Never seen.</p>

<h2>What a form that cannot lie to you looks like</h2>
<p>When we rebuilt ours, we set one rule: <strong>the visitor is never shown a success message for a message that was not delivered.</strong> Everything else follows from it.</p>
<ul>
  <li><strong>The confirmation waits for the server.</strong> The form posts, and only a real success response turns the note into &ldquo;sent&rdquo;. A delivery failure says so and offers the email address instead.</li>
  <li><strong>It works with JavaScript off.</strong> The form has a real <code>action</code> and a real <code>method</code>. Without scripting the browser posts natively and the server redirects to a confirmation. Scripting only upgrades the experience; it is never load-bearing.</li>
  <li><strong>A missing configuration refuses the submission.</strong> If the mail credentials are absent, the endpoint answers with an error telling the visitor to email directly — rather than accepting a lead it cannot deliver. Loudly broken beats quietly broken every time.</li>
  <li><strong>Bots are filtered without a CAPTCHA.</strong> A hidden field a person never sees and a bot fills in, plus a timestamp check that drops anything submitted within two seconds of page load. Both are silent. Neither asks a customer to identify a bicycle.</li>
  <li><strong>Validation errors do not count against rate limits.</strong> Our first version throttled by request, which meant someone mistyping their email five times was locked out for ten minutes having sent nothing. Rate-limit deliveries, not attempts.</li>
  <li><strong>There is an automated test.</strong> The form is covered by a check that runs against the real endpoint and fails the build if a lost lead could ever be reported as sent.</li>
</ul>

<h2>Test yours in the next five minutes</h2>
<ol>
  <li>Submit your own form, with a real message. Now check the inbox it should reach — including spam, and including the shared inbox nobody opens.</li>
  <li>Do it again from your phone on mobile data, not office wifi.</li>
  <li>Look at the form's HTML. Search it for <code>YOUR_</code>, <code>REPLACE_</code>, <code>example.com</code> and <code>test@</code>.</li>
  <li>Check whether the confirmation appears instantly. If it does, it is probably not waiting for anything.</li>
  <li>Put a recurring reminder in your calendar to repeat step one every quarter. Forms break when a plugin updates, a domain moves or a card expires, and none of those events will tell you.</li>
</ol>
<p>It is a fifteen-minute job that occasionally turns up a year of lost enquiries.</p>
""",
    ),
]

INDEX_DESC = ("Notes on building and measuring websites, from a studio in Jupiter, "
              "Florida. Performance, honest measurement, and the failure modes that "
              "cost small businesses money.")


def article_page(a):
    prev_next = ""
    body = f"""
{phero(a['title'], a['desc'], back=("/insights", "All notes"))}
<section class="sc-section band">
  <div class="sc-wrap">
    <p class="meta" data-sc-in><span>{a['topic']}</span><span>{a['read']} read</span>
      <span>Updated <time datetime="{a['mod']}">{fmt_date(a['mod'])}</time></span></p>
    <div class="article" data-sc-in>{a['body'].strip()}</div>
  </div>
</section>

<section class="sc-section band band--alt">
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">Want this looked at on your site?</h2></div>
      <div data-sc-in>
        <p class="sc-body">A free 30-minute consult, and you leave with a written scope and one number whether or not you go ahead.</p>
        <div class="phero__cta"><a class="btn" href="/contact">Book a free consult</a><a class="btn btn--quiet" href="/insights">Read the other notes</a></div>
      </div>
    </div>
  </div>
</section>
{prev_next}"""

    node = {
        "@type": "Article", "@id": f"{SITE}/insights/{a['slug']}#article",
        "headline": a["title"], "description": a["desc"],
        "datePublished": a["date"], "dateModified": a["mod"],
        "inLanguage": "en-US", "articleSection": a["topic"],
        "author": {"@id": f"{SITE}/#studio"},
        "publisher": {"@id": f"{SITE}/#studio"},
        "image": f"{SITE}/og.png",
        "mainEntityOfPage": {"@id": f"{SITE}/insights/{a['slug']}#page"},
    }
    return head(a["title"], a["desc"], f"/insights/{a['slug']}", og_type="article",
                title_full=f"{a['seo_title']} &mdash; Design of Man",
                nodes=[crumbs([("/insights", "Insights"),
                               (f"/insights/{a['slug']}", a["title"])]), node]) \
        + body + foot()


def fmt_date(iso):
    y, m, d = iso.split("-")
    months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"]
    return f"{int(d)} {months[int(m) - 1]} {y}"


def index_page():
    items = "".join(f"""
      <li><a href="/insights/{a['slug']}">
        <p class="meta"><span>{a['topic']}</span><span>{a['read']} read</span>
          <span><time datetime="{a['date']}">{fmt_date(a['date'])}</time></span></p>
        <h2>{a['title']}</h2>
        <p>{a['desc']}</p>
      </a></li>""" for a in ARTICLES)

    body = phero(
        "Notes from the bench.",
        "What we learn building and maintaining sites, written up while it is still "
        "fresh. Every one of these comes out of real work, including the mistakes, "
        "and several of them are about our own site.",
        meta=["Performance", "Measurement", "Build quality"],
    ) + f"""
<section class="sc-section band">
  <div class="sc-wrap">
    <ul class="posts" data-sc-in data-sc-stagger="70">{items}
    </ul>
  </div>
</section>
""" + nxt("/contact", "Next", "Book a free consult")

    listing = {
        "@type": "Blog", "@id": f"{SITE}/insights#blog",
        "name": "Notes from the bench", "description": INDEX_DESC,
        "publisher": {"@id": f"{SITE}/#studio"},
        "blogPost": [{"@type": "BlogPosting",
                      "@id": f"{SITE}/insights/{a['slug']}#article",
                      "headline": a["title"], "url": f"{SITE}/insights/{a['slug']}",
                      "datePublished": a["date"]} for a in ARTICLES],
    }
    return head("Insights", INDEX_DESC, "/insights",
                nodes=[crumbs([("/insights", "Insights")]), listing]) + body + foot()


write("insights/index.html", index_page())
for a in ARTICLES:
    write(f"insights/{a['slug']}.html", article_page(a))
