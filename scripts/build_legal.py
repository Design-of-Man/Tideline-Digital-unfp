#!/usr/bin/env python3
"""Emit the legal pages: /privacy, /terms, /cookies.

Written to be accurate about THIS site rather than generic. The site sets no
cookies, runs no analytics and embeds no third-party trackers, so the cookie
page says so instead of inventing categories to toggle. If a tracker is ever
added, that page and the privacy page have to change in the same commit.

Two values are placeholders and are deliberately spelled REPLACE_ so the
pre-launch grep catches them:  grep -rn "REPLACE_" --include="*.html" .
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import *

ENTITY  = "REPLACE_ENTITY"      # registered name, e.g. "Design of Man LLC"
ADDR    = "REPLACE_ADDRESS"     # registered business address for legal notices
UPDATED = "14 September 2026"

def sub(t):
    return (t.replace("{{ENTITY}}", ENTITY).replace("{{ADDR}}", ADDR)
             .replace("{{MAIL}}", MAIL).replace("{{UPDATED}}", UPDATED)
             .replace("{{TELD}}", TELD))

def legal_section(title, paras, ident=None):
    i = f' id="{ident}"' if ident else ""
    body = "".join(f'\n        <p class="sc-body">{p}</p>' for p in paras)
    return f"""
<section class="sc-section band"{i}>
  <div class="sc-wrap">
    <div class="split">
      <div><h2 class="sc-display sc-display--md" data-sc-kinetic="lines">{title}</h2></div>
      <div data-sc-in>{body}
      </div>
    </div>
  </div>
</section>
"""

# ------------------------------------------------------------------ privacy
PRIVACY = phero(
    "Privacy policy.",
    "What we collect, why, and how to make us delete it. This site runs no "
    "analytics and sets no tracking cookies, so most of this page is about the "
    "one thing we do collect: what you type into a form.",
    meta=["Last updated {{UPDATED}}", "Jupiter, Florida"],
) + legal_section("Who is responsible.", [
    "{{ENTITY}} (&ldquo;Design of Man&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates designofman.com and is the data controller for the personal information described here.",
    "Registered address: {{ADDR}}. Email: <a href=\"mailto:{{MAIL}}\">{{MAIL}}</a>. Phone: {{TELD}}.",
    "For anything on this page, including a request to see or delete your data, email us. A person reads that inbox; there is no ticket queue.",
])+ legal_section("What we collect.", [
    "<strong>What you send us.</strong> The consult form asks for your name, email address, an optional company name, the kind of project, and your message. The invoice form on the payment page asks for an invoice number and an email address. That is the whole list. Nothing is required that we do not need in order to reply.",
    "<strong>What the server records.</strong> Our host keeps standard request logs (IP address, timestamp, page requested, browser user-agent) for a short period for security and to keep the site up. We do not use those logs to build a profile of you and we do not combine them with form submissions.",
    "<strong>What we do not collect.</strong> No analytics, no advertising or social pixels, no session recording, no fingerprinting, no location beyond the country your IP implies, and no special category data. We do not buy personal data, and we do not sell or share yours.",
], ident="collect") + legal_section("Why we are allowed to hold it.", [
    "If you contact us about a project, we process what you sent in order to take steps at your request before entering a contract, and because we have a legitimate interest in answering enquiries about our own services (UK and EU GDPR Article 6(1)(b) and 6(1)(f)).",
    "If you are already a client, we process your details to perform the contract between us, and to meet legal and tax obligations for invoices and records.",
    "We do not send marketing email. If we ever start, it will be to people who opted in, with an unsubscribe link in every message, and you can refuse at the point of collection.",
]) + legal_section("Who else can see it.", [
    "<strong>Formspree</strong> receives and delivers form submissions to our inbox. <strong>Vercel</strong> hosts the site and processes the server logs above. <strong>Stripe</strong> handles payments if you pay an invoice; card details go to Stripe directly and never reach us or this site.",
    "Each of those is a processor acting on our instructions under a contract, not a party free to use your data for its own purposes. We may also disclose information where the law requires it, or to establish or defend a legal claim.",
    "All three are US companies. If you are in the UK or EEA, that means your information is transferred to the United States, which those processors cover with the standard contractual clauses or an equivalent approved safeguard.",
]) + legal_section("How long we keep it.", [
    "Enquiries that do not become projects: deleted within 24 months, and sooner if you ask.",
    "Client records, contracts and invoices: kept for seven years after the engagement ends, because tax and limitation rules require it.",
    "Server logs: retained by our host for a short rolling window, typically under 30 days.",
]) + legal_section("Your rights.", [
    "Wherever you live, you can ask us what we hold about you, ask us to correct it, or ask us to delete it, and we will do it without charging you or making it difficult.",
    "If you are in the UK or EEA you also have the right to restrict or object to processing, the right to portability, and the right not to be subject to automated decision-making &mdash; we do not do any. You can complain to your supervisory authority; in the UK that is the Information Commissioner&rsquo;s Office.",
    "If you are in California, Colorado, Connecticut, Virginia or another US state with a privacy statute, you have rights of access, correction, deletion and portability, and the right not to be discriminated against for using them. We do not sell personal information or share it for cross-context behavioural advertising, so there is nothing for you to opt out of, but you are welcome to confirm that with us in writing.",
    "To exercise any of it, email <a href=\"mailto:{{MAIL}}\">{{MAIL}}</a>. We reply within 30 days.",
], ident="rights") + legal_section("Children.", [
    "This site is for businesses hiring a web studio. It is not directed to children, and we do not knowingly collect personal information from anyone under 13, in line with the Children&rsquo;s Online Privacy Protection Act.",
    "If you believe a child under 13 has sent us information, email <a href=\"mailto:{{MAIL}}\">{{MAIL}}</a> and we will delete it. Where UK or EU law applies, the same commitment covers anyone under 16.",
]) + legal_section("Security, and changes to this page.", [
    "The site is served over HTTPS with a strict transport policy and standard protective headers. Form submissions travel encrypted. Access to the inbox is limited to the people who need it. No system is perfect, and we will not pretend otherwise: if a breach ever affects your data, we will tell you and the relevant regulator within the time the law allows.",
    "If this policy changes we update the date at the top of the page. Material changes get a notice on the site.",
]) + nxt("/contact", "Questions", "Ask us directly")

# -------------------------------------------------------------------- terms
TERMS = phero(
    "Terms and conditions.",
    "The terms for using this website. The work we do for clients is governed "
    "by a separate written agreement, not by this page.",
    meta=["Last updated {{UPDATED}}", "Governed by Florida law"],
) + legal_section("Using this site.", [
    "This website is operated by {{ENTITY}}, {{ADDR}}. By using it you accept these terms. If you do not, please do not use the site.",
    "You may read, print and share these pages for your own use. You may not copy the design, code, text or photography for a commercial purpose, scrape the site, attempt to break or overload it, or use it to send anything unlawful.",
]) + legal_section("What is on the page is not an offer.", [
    "Prices, packages and timeframes on this site are indicative. Nothing here is a binding offer and nothing forms a contract until we have both signed a written proposal that sets out the scope, the price and the schedule for your specific project.",
    "Where the site shows results achieved for a client, those numbers are that client&rsquo;s, measured over the stated window with the method stated alongside them. They are evidence of what we have done, not a projection of what your site will do. Results depend on your market, your budget, your competition and factors outside anyone&rsquo;s control. <strong>We do not guarantee any particular ranking, traffic level, enquiry volume or revenue.</strong>",
]) + legal_section("Who owns what.", [
    "The name Design of Man, the wordmark, the layout, the written content and the code of this site belong to us.",
    "Client names, logos, screenshots and trademarks shown in our work belong to those clients and appear with their permission. Nothing on this site transfers any right in them.",
    "Ownership of what we build for you is set out in your project agreement. As a rule, you own the finished site and your content once the final invoice is paid, and we keep the right to describe the work and show it in our portfolio unless you ask us not to.",
]) + legal_section("Payments.", [
    "Invoices are payable on the terms printed on them. Card and bank payments are processed by Stripe under Stripe&rsquo;s own terms; we never see or store your card number.",
    "Late payment may pause work on a project and may attract interest at the rate allowed by Florida law. Hosting and care plans renew as described in your agreement and can be cancelled in writing.",
]) + legal_section("Liability.", [
    "The site is provided as it is. We take real care over its accuracy but we do not warrant that it is free of errors or always available.",
    "To the fullest extent the law allows, we are not liable for indirect or consequential loss, lost profits, lost data or lost business arising from your use of this website. Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be limited &mdash; including, for consumers in the UK and EEA, your statutory rights.",
    "Our total liability arising from your use of this website is limited to one hundred US dollars. Liability for project work is capped separately in your project agreement, normally at the fees paid for that project.",
]) + legal_section("Third parties, law, and changes.", [
    "This site links to other websites, including our clients&rsquo; and our payment provider&rsquo;s. We do not control them and are not responsible for their content or their privacy practices.",
    "These terms are governed by the laws of the State of Florida. Any dispute goes to the state or federal courts sitting in Palm Beach County, Florida, and we each submit to that jurisdiction. If you are a consumer in the UK or EEA, this does not deprive you of the protection of the mandatory law of the country where you live.",
    "We may update these terms; the date at the top shows when. If a provision turns out to be unenforceable, the rest stays in force. Questions go to <a href=\"mailto:{{MAIL}}\">{{MAIL}}</a>.",
]) + nxt("/privacy", "Related", "Read the privacy policy")

# ------------------------------------------------------------------ cookies
COOKIES = phero(
    "Cookie policy.",
    "The short version: this site does not set tracking cookies, and there is "
    "no consent banner because there is nothing to consent to.",
    meta=["Last updated {{UPDATED}}", "No trackers, no analytics"],
) + legal_section("What this site stores.", [
    "One entry, in your browser&rsquo;s session storage, called <code>dom.film.seen</code>. It records that you have already watched the opening sequence so it does not replay every time you move between pages. It holds a single character, it is readable only by this site, and your browser deletes it when you close the tab.",
    "That is the entire list. It is strictly necessary to how the page behaves, it identifies nobody, and under the UK and EU e-privacy rules storage of that kind does not require consent. That is why you are not being asked to click anything.",
]) + legal_section("What this site does not do.", [
    "No Google Analytics or any other analytics. No advertising pixels, no Meta or LinkedIn tags, no retargeting. No session recording or heatmaps. No social media embeds. No fonts loaded from a third party &mdash; they are served from our own domain, so no request leaves for anyone else when a page paints.",
    "We are not claiming virtue here; it is a design decision. It also means we cannot tell you which pages are popular, which is a trade we are currently making on purpose. If we add analytics later we will say so on this page first, and we will choose a tool that does not need cookies &mdash; and if it does need them, you will get a real consent choice before it loads.",
]) + legal_section("What other companies may set.", [
    "<strong>Formspree</strong>, when you actually submit a form, to deliver the message and to block spam. <strong>Stripe</strong>, if you follow a payment link, to process the payment and detect fraud. Both are subject to their own policies, and neither is loaded while you are simply reading the site.",
    "Our host, <strong>Vercel</strong>, keeps standard server logs. Those are not cookies and nothing is written to your browser.",
]) + legal_section("Clearing it, and asking us about it.", [
    "Closing the tab removes it. You can also clear site data for designofman.com in your browser settings, or browse in a private window. Nothing on the site breaks if you do &mdash; the opening sequence simply plays again.",
    "Questions go to <a href=\"mailto:{{MAIL}}\">{{MAIL}}</a>. How we handle the information you send us is covered in the <a href=\"/privacy\">privacy policy</a>.",
]) + nxt("/privacy", "Related", "Read the privacy policy")

PAGES = [
    ("privacy.html", "Privacy policy",
     "What Design of Man collects, why, how long we keep it, and how to have it deleted. No analytics, no tracking cookies.",
     "/privacy", PRIVACY),
    ("terms.html", "Terms and conditions",
     "The terms for using designofman.com, including intellectual property, payments, liability and governing law.",
     "/terms", TERMS),
    ("cookies.html", "Cookie policy",
     "This site sets no tracking cookies and runs no analytics. What it does store, and what third parties may set.",
     "/cookies", COOKIES),
]

if __name__ == "__main__":
    for name, title, desc, path, body in PAGES:
        write(name, sub(head(title, desc, path) + body + foot()))
