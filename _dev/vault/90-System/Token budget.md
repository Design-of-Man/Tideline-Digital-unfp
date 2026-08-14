---
type: system
---

# Token budget

Context is the running cost of this system. These are the levers, in order of
size.

## 1. Do not subscribe to firehoses

The single largest drain observed: PR webhook events. Every push triggered five
Vercel projects, each emitting several status edits, each carrying a base64
payload plus a full markdown table — fifteen-plus events for one commit, none of
them actionable.

Unsubscribe from PR activity once a PR is understood, and poll on a schedule
instead. A check-in every hour costs a fraction of streaming every transition.

## 2. Routines run as fresh sessions

A long-lived thread re-sends its entire history on every turn, so cost grows
quadratically with the length of the conversation. A scheduled run starts clean
and reads only what it needs from the vault.

This is why every Routine is defined as fresh-session-per-fire rather than a
standing session that wakes up.

## 3. Tier the models

The biggest lever inside the agent fleet:

| Work | Model |
|---|---|
| Crawling, extraction, formatting, file shuffling | cheap |
| Voice, review, ranking impact, anything with judgment | strong |

Most of what an agent does is mechanical. Paying premium rates for `for` loops
is the commonest waste.

## 4. Disk is the interface

`site-ingest` writes to disk; agents read `inventory.md` and `images.csv`. Raw
HTML never enters context. A single client homepage can exceed the useful budget
for an entire content run.

The same applies to metrics: the sweeps write notes, and the report reads the
notes rather than re-querying every source.

## 5. Caps are explicit

`--max-pages` defaults to 40. An uncapped crawl of a 400-page site is a silent
bill. Any bounded operation logs what it dropped — silent truncation reads as
"covered everything" when it did not.

## 6. Small habits

- Batch independent tool calls into one message
- Never re-read a file already read this session
- Do not re-verify something already established
- Prefer a grep over reading a whole file
