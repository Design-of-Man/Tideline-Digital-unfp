---
type: system
---

# Agents

Three content roles, not seven. A larger fleet loses the source material at
every handoff — a writer working from a researcher's summary produces generic
copy, and four channel agents produce four unrelated posts instead of one idea
in four forms.

## Voice — a document, not an agent

`10-Clients/<Client>/Voice.md`, generated once from the `site-ingest` output.
How they describe themselves **in their own words**, vocabulary they use and
avoid, sentence rhythm, what they never claim, and the proof they can actually
cite.

Locked. Regenerated only when their positioning genuinely changes. An agent that
re-derives voice on every run drifts; a document does not.

## Make

| | |
|---|---|
| Cadence | per content run |
| Model | strong — this is the judgment step |
| Reads | `Voice.md`, the ingest inventory, recent posts, Post Bridge analytics |
| Writes | `30-Content/<client>/<date>-<slug>.md` |
| Then | queues to Post Bridge **as drafts** |

Researches, writes and adapts to every channel in **one pass**, holding the idea
throughout. The per-channel variants live in one note, so they are visibly the
same idea rather than four separate inventions.

Reading recent posts is not optional — the failure mode of automated content is
saying the same thing every fortnight in slightly different words.

## Review

| | |
|---|---|
| Cadence | after every Make run |
| Model | strong — adversarial reading is not a cheap task |
| Reads | the content note, `Voice.md`, the sources cited |
| Writes | a verdict into the content note |
| Blocks | anything failing the rules below |

Separate from Make on purpose. Self-review is weak: the same context that
produced a claim is the worst judge of it.

### The medical rule — hard block

Six clients are medical practices. **Any statement about outcomes, recovery
times, or treatment efficacy ships only with a citation.** Without one it is
rewritten to describe the service and the process instead.

Not a style preference. A wrong recovery-time claim on a clinic's feed is a
liability, and it outlives the post.

### Also blocked

- Statistics with no traceable source
- Claims about the client the client has not made about themselves
- Anything contradicting `Voice.md`
- Superlatives the client cannot substantiate — "best", "leading", "number one"

## seo-audit

Weekly per client. Runs `site-ingest`, then checks titles, meta descriptions,
canonicals, schema, internal linking, alt text, sitemap freshness and Core Web
Vitals. Diffs against last week so the note says what *changed*, not just what
is true. Writes findings ranked by expected impact to
`40-Metrics/<client>/seo-YYYY-MM.md`.

Cheap model for the crawl and extraction; strong model only for ranking impact.

## seo-apply

Takes the top findings, edits the client repo **on a branch**, runs the preflight
gate, and opens a **draft PR** showing before and after.

**It never pushes to a client's live site.** You do none of the work and still
hold the last gate. Given the shop's own site currently ships a fictional phone
number in fourteen places, an unattended agent editing a paying client's
production site is not where this starts.

## When to add a fourth role

"Add more if output is thin" needs a definition or it never gets revisited.

After one month, compare per-post engagement in Post Bridge against the
pre-agent baseline, and log Review's rejection rate **by cause**. Then:

- High rejection for off-voice copy → separate research from writing
- Low engagement isolated to one channel → add a specialist for that channel
- High rejection for unsourced claims → add a research step before Make, not after

Nothing splits on instinct. A role added without a measured weakness is a
handoff added without a reason.
