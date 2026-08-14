# Client artifact

Two formats. Pick by where the client is — deciding whether to hire, or looking
at what they paid for.

## Voice rule

**Name the cost in the client's terms, not the technique's.**

The titles that have landed say what it means to the business: *"What's Costing
You Patients"*, *"Failure Mode Audit"*, *"What I Built — First Rehabilitation of
North Palm Beach"*. The ones that would not have landed say *"LCP Optimization
Report"*.

Same rule inside the document. Not "LCP was 3.6s" — "the page took 3.6 seconds
to show anything on a phone, and roughly a fifth of people leave before that."
Then give the number, because the number is the proof.

Every claim quotes a measurement from the run. No estimates presented as
findings, no "industry average" filler. If it wasn't measured, it isn't in the
document.

## Format A — Pre-sale audit

For a prospect. The job is to make an invisible problem visible and expensive.

1. **What we found** — three to five findings, ordered by cost of leaving them
   alone. Each: what it is, how it was verified, what it costs.
2. **The conversion path** — trace one real attempt to become a customer, from
   search result to booked appointment, and mark where it breaks. This is the
   most persuasive section; a booking link that 404s needs no argument.
3. **How they show up in search** — including AI answers, which most local
   competitors are not thinking about. See `marketing-ai-seo`.
4. **What it takes** — scope, sequence, what changes first. Honest about what
   isn't worth doing.

State conditions plainly when they exist. One audit ended "build recommended
with conditions" — that reads as judgment, not salesmanship, and it's why it
was believed.

## Format B — Post-build proof

For an existing client, after shipping. The job is to make invisible work
visible.

1. **What was broken** — the before state, in the terms the audit used, so the
   two documents line up.
2. **What shipped** — grouped by what it does for them, not by commit.
3. **What it measures now** — before → after, real numbers:
   `LCP 3618→2971ms` · `Lighthouse 90→94` · `axe violations 0/107`
4. **Verified live** — what was actually tested end to end: booking links, call
   tracking, form submissions, the photo that was wrong.
5. **What's still open** — the honest list. It buys more credibility than a
   clean sheet, and it sets up the next piece of work.

## Publishing

Build with `Artifact`. Load `artifact-design` first; `artifact-diagramming` if
the conversion path is worth drawing. `dataviz` before any before/after chart.

Title it as a name, not a summary — *"Elite Sports Medicine — Web & Search
Audit"*, not *"Audit Report for Elite Sports Medicine Covering Web and Search
Performance"*.

Artifacts start private. Hand over the link and let the client decide who sees
it.
