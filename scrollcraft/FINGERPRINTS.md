# Fingerprints

Every site you build with **scrollcraft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| design-of-man (v2.html) | filmic one-shot | fixed bar, difference-free, own scrim, no index or progress readout | full-bleed `scrub`, one 15s clip carrying two beats | 5 acts, 10.1vh, one peak at act 3 (quiet-quiet-LOUD-steady-quiet) | pinned CTA with the world returning behind it, footer inside the stage | the site is what is on the laptop screen: welded to the tracked glass, flown out to the viewport, and the bezel stays as the frame the rest of the page reads inside | cold Icelandic moor, wet stone and moss | H.264 + VP9, dense GOP 8 |

*(one row. It was written against an empty registry, so it cleared the gate by
having nothing to differ from rather than on merit. From the second build
onwards, this table is a real constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- **filmic one-shot** as a grammar, paired with a single full-bleed `scrub` act
  carrying more than one beat.
- **The screen as the page**: a tracked laptop display that the site is welded
  to, flown out to fill the viewport, with the bezel kept as a persistent frame
  for every act after it.
- **5 acts totalling ~10vh.** The band to avoid remains 13.6-13.8vh; this build
  does not sit in it, but it now occupies 10.1.
- **Close pattern**: pinned CTA with the opening world fading back in behind it,
  footer inside the stage.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scrollcraft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
