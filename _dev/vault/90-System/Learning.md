---
type: system
---

# How the agents actually improve

## The thing to be clear about

These agents do not learn from experience. There is no weight update, no memory
that accumulates skill. An agent run tomorrow is exactly as good as its
instructions and its inputs make it — no better for having run a hundred times.

So "agents that constantly improve" has to mean something concrete, or it means
nothing and quietly means nothing for a year. Here it means three things:

1. **The instructions get better** — the skill files are edited.
2. **The inputs get better** — Voice notes and ingest inventories improve.
3. **The outcomes get recorded** — so 1 and 2 are driven by evidence.

The improvement is real. It just lives in files, not in the model.

## Where the signal comes from

Only external signal counts. An agent reading its own output and grading it
produces confidence, not quality — the same context that made a mistake is the
worst judge of it.

| Signal | Source | What it tells you |
|---|---|---|
| Engagement per post | Post Bridge analytics | whether anyone cared |
| Review rejections, by cause | the content notes | where Make is systematically weak |
| What you edited before approving | draft vs published diff | where the voice is off |
| What you rejected outright | the calendar | where the whole idea missed |
| Client replies | Requests notes | the only signal that pays |
| SEO findings that recur | the monthly metric notes | a fix that is not sticking |

**The most valuable of these is what you change before approving.** Every edit
you make by hand is a precise statement about where the instructions are wrong.
Those edits are the training data, and they are free.

## The retro

Monthly, as a Routine. It reads the signals above and writes
`90-System/Retros/YYYY-MM.md` containing:

- What Review rejected, grouped by cause, with counts
- Which pieces you edited before approving, and what you changed
- Engagement against the previous month
- **Proposed edits to specific skill files** — quoted before and after

Then it opens a PR against those files. You merge or you do not.

## Why it lands as a diff

An agent that silently rewrites its own instructions drifts, and nobody can say
when or why the output changed. A diff is reviewable, revertable, and dated. If
the content gets worse in November, `git log` on the skill file says what
changed in October.

This is also the honest answer to "make them better and better": the loop is
visible, and it stops if you stop merging. That is a feature.

## What gets edited, in order of value

1. **`Voice.md` per client** — the highest-leverage file. Most off-voice copy is
   a voice note that was thin, not an agent that was careless.
2. **Review's block rules** — a claim that slipped through once will slip
   through again until the rule names it.
3. **Make's prompts** — last, and only for a pattern seen three times. A prompt
   edited after every single miss becomes a pile of exceptions nobody can read.

## The rule against gaming

The retro reports what happened, including months where nothing improved. A
retro that always finds progress is not measuring anything.
