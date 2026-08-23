# Rebuild v2 with scroll-craft — build plan and BRIEF

## Context

You sent a YouTube link saying "this is how I need it to look." I could not watch
it: YouTube blocks this sandbox's datacenter IP, no media streams were exposed on
any player client, and the storyboard frames downloaded corrupted. All I recovered
was the title, the channel and the thumbnail.

The thumbnail named the thing, and it turned out to be public:
[github.com/nateherkai/scroll-craft](https://github.com/nateherkai/scroll-craft) —
a Claude Code skill for premium scroll-driven sites. That repo is a better source
than the video, so this plan is built from its actual SKILL.md and references,
cloned and read, not from a summary.

**Audited against its rules, v2 already has the engine and fails the taste floor.**
Scroll as timeline, frame-by-frame video scrubbing, pinned sections, dense-GOP
encoding for seek, screenshot-the-scroll verification — all already true of v2, and
all things the skill sells. What v2 breaks: three font families against a floor of
two, `01 —` chapter numbers and a `055%` progress readout (both on the refuse list),
a "SCROLL TO OPEN" cue (refuse list), eight eyebrows against two `<h2>`s, ten visible
em dashes, and a cream/brass/espresso palette the taste doc names verbatim as the
trap that "makes every such brand look identical."

Outcome: keep the film and the engine, replace the taste layer, and expand the page
from three beats to five so it argues instead of only performing.

---

## BRIEF (scroll-craft Step 0 — interviewed, not inferred)

Answers 1–7 are yours, given in this session. Answer 8 is derived from the session's
own work rather than asked, and is marked as such.

1. **Vibe:** cold, patient, earned, unglamorous.
2. **Journey:** expand to five beats (was three).
3. **Energy curve:** quiet open, quiet middle, one loud peak.
4. **Feeling / the one moment:** the site appearing on the laptop screen.
5. **Signature move:** the site *is* what's on the screen.
6. **Range:** maximalist.
7. **Structure:** one unbroken world → resolved to **filmic one-shot** (see below).
8. **Assets (derived, not asked):** 15s of graded viking footage at 2560×1302
   (`assets/video/viking-hero.{mp4,webm}`), poster, the existing v2 pages and copy.
   20 ViewMax credits, so **no new footage** — a build from owned assets, which the
   skill calls "a first-class route, not a fallback."

**Peak, as the sentence a visitor would say:** *"you scroll into the laptop and the
website is just… running on it, you're already inside it."*

**Tell-someone sentence:** "It's the site where you walk across a cold moor and end
up inside the screen you were walking toward."

**Authored silence:** the walk. It is intentionally near-empty so the peak has
something to be a change from. The verification pass must not flag it as dead scroll.

### Reconciling two answers that pull apart

"Maximalist" and "cold, patient, unglamorous" are not the same instinct. The
resolution: **maximalist in scale and contrast, minimal in ornament.** Enormous type,
hard tonal jumps, edge-to-edge imagery, no decoration, no colour for its own sake.
Cold maximalism, not loud maximalism. If that reads wrong when you see it, it is the
first thing to change.

---

## Grammar: filmic one-shot

You picked "one unbroken world" in plain English. In this skill's vocabulary
**Continuous world** is a specific technical mode (`data-sc-mode="worldflight"`, one
fixed canvas, legs that crossfade, clickable waypoint-map nav) that **bans `scrub`
acts and hard cuts outright** — "do not reach for `scrub` acts here, however long you
make the spans." Our film is a scrub with two hard cuts in it, so that grammar means
discarding it. You chose filmic one-shot instead, which is the grammar that actually
describes the page: "a film you are pushing through," leaning on `scrub`, `pin`,
`drift`, `kinetic`, with a full-bleed scrub hero.

**Why the other seven lost:** continuous world bans our core device and our cuts;
chaptered editorial, gallery and rhythmic cutlist all require visible sequence, which
the brief's single unbroken arc rejects; live surface and split stage imply a tool or
a comparison, and this page is neither; typographic poster discards the footage the
budget already bought.

**Fingerprint gate — honest result: vacuous.** The registry at
`scrollcraft/FINGERPRINTS.md` is empty (seeded this session), so a first build clears
it by having nothing to differ from. That is not a pass earned on merit and should
not be reported as one. The one real constraint carried forward: the skill flags a
"6–7 acts at 13.6–13.8vh" band as a fingerprint dimension because all four of the
author's builds landed there. **This build is 5 acts and must not total 13.6–13.8vh.**

Filmic one-shot **forbids visible sequence** — chapter numbers, an index, a progress
readout. That independently kills the `01 —` labels and the `055%` HUD, which the
refuse list already killed. Two rules agreeing is a good sign the change is right.

---

## Signature move: the page is the screen

One bespoke interaction, coded in the page, engine untouched. We are already
three-quarters of the way there — `onGlass()` in `assets/js/v2.js` tracks the site
panel onto the laptop's real glass from 72% of the hero.

The move completes it: **scrolling past the reveal never leaves the screen.** The
laptop bezel stays as a hairline frame at the viewport edge for the rest of the page,
and the remaining four beats scroll *inside* it. The frame never breaks. The last act
pulls back out to the moor for the close, so the page resolves by leaving the machine
rather than fading to a footer.

This satisfies the skill's test for what counts (bespoke, page-level, not a retuned
kit parameter) and it argues the pitch — you are literally reading the thing the film
walked toward.

---

## Journey, feeling curve and score

Five beats. Curve written before devices, per feel.md.

| # | Beat | Feeling | Device | Why this one |
|---|---|---|---|---|
| 1 | The crossing | patient, cold, slightly bored | `scrub` | The camera moving under the reader's own hand. This is the authored silence |
| 2 | Arrival | recognition | `scrub` → `pin` | The film resolves; the frame holds as the site takes the glass |
| 3 | **The screen** | **the peak** | `pin` + signature | Largest span on the page, most dwell, the payoff |
| 4 | What we do | steady, concrete | `kinetic` + `flow` | Type assembling line by line inside the bezel; the argument |
| 5 | The one action | resolved, quiet | `pin` + pointer | Pull back to the moor, the CTA is an object in the frame |

Checks against the skill's own list: four device families (`scrub`, `pin`, `kinetic`,
pointer, plus `flow`) ✓; no family twice in a row ✓; **two `scrub` acts, not three** —
the film is one scrub device spanning beats 1–2, not three separate acts, which
resolves the cap cleanly ✓; no two adjacent acts share a feeling ✓; one peak with the
largest span ✓; act 2 is quieter than act 3 ✓.

**Total length: 11vh.** Inside the 8–14 band, outside the 13.6–13.8 fingerprint band.
Current hero alone is 7.8vh.

---

## The design floor — what actually changes

Read `references/taste.md` before writing markup, not after.

- **Two families.** Drop IBM Plex Mono. Keep a display face and a text face. The mono
  only exists to serve the HUD and the eyebrows, both of which are being deleted.
- **Palette off the trap.** Six roles plus one accent, locked for the page, secondary
  text tinted not flat grey, no pure black. The taste doc lists rotations away from
  cream-and-brass: cold silver and chrome; deep forest with bone and amber; true
  off-black with warm tan. **Cold silver/off-black with one warm accent** is the fit
  for "cold, patient, earned" and for footage that is entirely grey stone and wet
  moss. This is the change that touches every v2 page — flagged as scope below.
- **Delete:** the `01 —` labels, the `%` HUD readout, "SCROLL TO OPEN", six of the
  eight eyebrows, all ten visible em dashes.
- **Type:** tracking tightens as size grows; body measure 45–75ch (hero body is 36ch
  today); light-on-dark compensated on line height, tracking and weight;
  `text-wrap: balance` on headings; hero steps down one rung below 700px.
- **Engine:** copy `engine/scrollcraft.js` and `engine/scrollcraft.css` into the build
  and theme by tokens. **Never edit the engine per project** — bespoke behaviour goes
  in page JS driven off `--sc-p` and our own `data-sc-*`.

## Files

- `assets/css/v2.css` — tokens, palette, type scale, delete eyebrow/HUD rules
- `assets/js/v2.js` — keep `onGlass()`, `screenNorm()`, `SCREEN_TRACK`, the seek
  coalescer and watchdog, and the reduced-motion flow layout; extend the signature
  move past the reveal; delete the HUD percentage writer
- `v2.html` and the three sibling pages — markup, counters, cue, eyebrows, em dashes
- New: `scrollcraft/builds/design-of-man/BRIEF.md` (this brief, verbatim)
- Unchanged: `assets/video/viking-hero.*`, the poster, the whole encode pipeline

## What I am not doing, and why

- **No new footage.** 20 credits, and Veo Fast is locked to 8s so 4K is 40. The film
  we have is the film.
- **Not taking two of its rules.** "At most two scrub acts" is written for a six-act
  marketing page — resolved above by counting the film as one device, not three.
  "Serif is not a synonym for premium" is fair in general, but Instrument Serif is
  doing real work; it stays unless the palette change makes it wrong.
- **Not running its asset generator.** No KIE key, and none needed.

---

## Verification

The skill treats Step 5 as a ship-blocker. Environment is already prepared: Node
v22, ffmpeg with 564 filters, `playwright-core` installed, `SCROLLCRAFT_CHROME`
pointing at `/opt/pw-browsers/chromium`, workspace resolved to `scrollcraft/`.

1. `node scripts/serve.mjs --root . --port 4500`, then `shoot.mjs` at desktop, at
   390×844, and with `--reduced-motion`. It walks each act at six positions, waits
   for the scrub to settle, and reports dead scroll, cues that never reach full
   opacity, and contrast measured on the composited page per line.
2. **Read `sheet.png` myself.** The harness proves a clip advances; it cannot say the
   composition is good. Confirm the peak is the largest visual change and holds the
   most scroll room, and that the close resolves rather than fading out.
3. **The feel check:** scroll it cold, write one word per act, then diff against the
   curve above. Where they disagree, the page is wrong, not the brief.
4. Confirm the authored silence in act 1 is not reported as dead scroll.
5. Keep our own existing checks, which the skill does not replace: tab order and the
   `inert` panel gate, all four v2 pages loading clean, and the media cache-buster
   resolving to the current stamp.
6. Commit to `claude/laptop-opening-feature-rsi9qm`, confirm the deploy, send the
   preview link with the contact sheet.
7. Append the build row to `scrollcraft/FINGERPRINTS.md`.

## Scope flag

The palette change is the one item that reaches beyond the hero: it re-skins
`v2.html`, `v2-process.html`, `v2-studio.html` and `v2-contact.html` together, since
they share `v2.css`. Everything else on this list is contained to the hero and its
markup. If you want the palette left alone, say so and the rest still stands — it
just leaves the single biggest "looks like every other craft brand" problem in place.

## Also pending

The hourly PR #5 check-in could not be re-armed under plan mode. Last check: all five
Vercel deploys Ready on `785d547`, no review comments, nothing actionable.

---

## As built — where the shipped page differs from this plan

Four things changed during the build. Each is a decision, not a slip.

1. **Beats 1 and 2 are one `scrub` act, not two.** The plan counted "the film is
   one device spanning beats 1–2" but the markup would still have been two
   adjacent `scrub` sections, which breaks the never-the-same-family-twice-in-a-
   row rule and adds a stage swap in the middle of a continuous shot. The film
   is one 15s clip in one act carrying two cues, which is what the sentence
   actually described.

2. **The peak is a fixed layer, not the act's stage.** A pinned stage unsticks
   and slides away at the end of its act. Drawing the payoff there put a seam in
   the exact moment the page exists for. The glass layer opens on the film's own
   final frame, so the handoff is invisible; the peak section owns the scroll and
   draws nothing.

3. **A VP9 source ships alongside H.264.** The engine takes one src per clip, so
   format choice is the page's job. Without it, Firefox and any Chromium built
   without the licensed decoder get the poster and no scrub — which is also how
   the verification harness would have "passed" this build against a still.

4. **Spans: 5.2 / 2.4 / flow / 1.4, totalling 10.1vh** (plan said 11). The peak
   was cut from 3.4 after the contact sheet showed it holding still for eight of
   29 samples. Clear of the 13.6–13.8vh fingerprint band either way.

**Verification run:** desktop 1440×900, 390×844, and reduced motion. No dead
scroll on any pass; act 1's authored silence was not flagged. All cues clear
4.5:1 measured on composited pixels. Zero console errors, zero failed requests
and zero reachable-but-invisible focusables across all four pages.

The harness does report one **frozen clip** (270px on its last frame while the
stage slides out). That is the seam-cover, not a defect: the glass layer turns on
at exactly that scroll position and the frozen frame is what it is showing.
