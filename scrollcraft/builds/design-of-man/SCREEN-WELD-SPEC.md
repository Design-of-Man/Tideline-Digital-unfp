# Spec: weld the site to the laptop screen for every frame the screen is on camera

**Status:** open defect. The page ships, but the payoff pops in instead of tracking.
**Owner of this file:** hand to another agent to produce an implementation prompt.
**Repo:** `Design-of-Man/Tideline-Digital-unfp`, branch `claude/laptop-opening-feature-rsi9qm`
**Live:** https://designofman-site-git-claude-lapt-9da8d5-cambo421-1638s-projects.vercel.app/v2

---

## 1. What the page is

`v2.html` is a five-act scroll-driven page built on a vendored scroll engine
(`assets/js/vendor/scrollcraft.js`, **never edited per project**). Scrolling scrubs a
15-second film: two men cross a moor, a laptop appears on a stone slab, the camera
arrives at it.

The signature move is: **the site is what is running on that laptop's screen.** The
site panel is positioned onto the laptop's real display, then flown out until it
fills the viewport.

The mechanism is a fixed overlay (`#glass`) whose child `#panel` gets absolute
`left/top/width/height` written every animation frame. Page-level code only; the
engine is untouched.

---

## 2. The defect, measured

The panel does not appear until the film's **last frame**. Before that, the laptop is
on camera with its blown-out white screen and nothing on it. Then the site appears.

Measured on a 1440x900 viewport, walking the page in 60px steps:

| | |
|---|---|
| Page scroll travel | 8066 px (8.96 viewports) |
| Laptop screen first covered by tracking data (`t = 11.583s`) | scrollY **3300** |
| Site panel first drawn (`#glass` goes live) | scrollY **3840** |
| **Gap: laptop visible, screen empty** | **540 px = 0.60 viewports** |

That 540px is the pop.

**It is worse than that number implies.** Frames pulled from the master at 900px wide:

| Film time | What is on screen |
|---|---|
| 8.0s | No laptop |
| 9.0s | No laptop |
| **9.8s** | Laptop screen **enters at the right frame edge**, clipped by it |
| **10.4s** | Laptop **fully in frame, unoccluded, clean** |
| 11.0s | Fully in frame, larger, clean |
| **11.583s** | Where `SCREEN_TRACK` currently begins; man's cloak clips the right edge |

So there is roughly **1.8 seconds of clean, fully-visible laptop screen (t≈9.8 to
t≈11.583) for which no tracking data exists at all.** Fixing only the code path
would still leave that stretch empty. **Both parts below are required.**

---

## 3. Root cause, in code

`assets/js/v3.js`. The overlay is driven entirely off the **peak act's scroll
position**, never off the film's playback time:

```js
// line ~119
var pTop = absTop(peak), pH = peak.offsetHeight;
var g = clamp01((y - (pTop - vh)) / Math.max(pH, 1));   // 0 at film pin end
setLive(g > 0 && g < 1);
```

`g` only becomes > 0 when the **film act's pin ends**, which is the moment the clip
reaches `t = 15s`. Every earlier frame — including all the clean laptop frames — is
outside the overlay's life.

`QUAD` (line 51) is a **single hardcoded rectangle**, the screen position on the
final frame only:

```js
var QUAD = [0.33358, 0.27761, 0.33773, 0.42257];  // x, y, w, h normalised to frame
```

The previous build had the right idea and it was dropped in the rebuild. It kept the
full per-frame table and interpolated it by video time:

```js
var SCREEN_TRACK = [ [t, x, y, w, h], ... ];   // 28 rows, 11.583 -> 14.958
var GLASS_FROM_T = SCREEN_TRACK[0][0];
function screenNorm(t) { /* linear interp between bracketing rows */ }
```

That table still exists in git history at `assets/js/v2.js` on commit `785d547`
(look for `SCREEN_TRACK`). **Recover it rather than re-deriving it** — see §5.

---

## 4. Required behaviour: three phases, one continuous weld

The overlay must have three phases instead of one. The site must be on the glass
from the first frame the screen is measurable, and must never jump.

**Phase A — TRACK (during the film act, from `t = GLASS_FROM_T` to `t = 15s`)**
- Panel `left/top/width/height` = `screenNorm(videoTime)` mapped through the cover
  transform (§6).
- Drive from the **live `<video>` element's `currentTime`**, read each frame — *not*
  from scroll position. The engine lerps the video toward its target, so scroll and
  playback time are not in lockstep; deriving time from scroll will make the panel
  lead or lag the footage by a few frames and it will visibly swim.
  - `document.querySelector('video[data-sc-scrub]').currentTime`
- The overlay must be **transparent** in this phase so the live video shows through.
  It is currently `background: var(--sc-canvas)` and `.glass__still` is opaque —
  both must be off here, or the film disappears behind a black rectangle.
- Panel copy should be legible against the panel's own dark ground, which is what
  makes it read as a lit screen rather than a black hole.

**Phase B — COVER (film pin end through the stage's exit slide)**
- Unchanged from today, and it is the one part that works: swap to the still
  `assets/video/sc/film-end.jpg` (the film's actual final frame) so the overlay can
  hide the scrub stage unsticking and sliding away underneath.
- The handoff A→B must be seamless: at the boundary, `screenNorm(15.0)` and the
  still's quad are the same rectangle, so nothing should move.

**Phase C — FLIGHT (the peak act)**
- Unchanged: ease the panel from the final-frame quad out to the full viewport, then
  hand off to act 4 with the bezel left behind.

**The invariant to hold across all three: the panel's rectangle is a continuous
function of scroll. No discontinuity at any phase boundary.**

---

## 5. Extending the track backwards (the measurement half)

`SCREEN_TRACK` must be extended from `11.583s` back to about `9.8s` — roughly 14 more
rows at the existing 0.125s spacing.

**How the existing rows were derived**, and why it stops where it does: the laptop
display is the only large *solid bright* shape in the frame, so taking the **longest
run of bright pixels per row** finds it with no seed and no search window. Before
11.583 the men clip its edges in some frames; after 9.8 it is clean. The stopping
point was chosen for the *later* occlusion, not the earlier one, so extending
backwards into the clean stretch should be easier, not harder.

**Constraints on the extension:**
- Between 9.8 and ~10.3 the screen is **clipped by the right frame edge**. A detector
  that requires a closed bright region will fail or return a truncated width. Either
  start the table at the first frame where the screen is fully inside the frame
  (~10.3s) and accept a shorter entry, or handle the edge-clipped case explicitly by
  extrapolating the true width from the visible portion.
- Rows must be **smooth to ~2px of second difference** on centre, width and foot
  line, or the panel shimmers under a scrub. The previous build measured exactly this
  and hit max 2.0px on centre, 0.4px on width, 0.8px on the foot line. Use a
  symmetric shrinking-window median — an asymmetric rolling median biases the
  endpoints (this cost a full debugging round last time: cx was off by 30px at the
  first frame).
- Source of truth for measurement is the master at full resolution, not the encoded
  delivery file.

**Assets:**
- Delivery clip: `assets/video/sc/film.mp4` (1920x976, crf25, GOP 8) and
  `film.webm` (VP9). Both 15.000s.
- Poster: `film-poster.jpg` (first frame). Final frame still: `film-end.jpg`.
- The 2560x1302 master used for measurement is **only in the session scratchpad**
  (`viking/master12.mp4`) and is **not in the repo**. The delivery mp4 is the same
  framing at lower resolution and can be used instead; the track is normalised to
  the frame so resolution does not matter, only aspect ratio.

---

## 6. The geometry (do not re-derive this, it is correct today)

`SCREEN_TRACK` rows are `[t, x, y, w, h]` **normalised to the video frame**, not to
the viewport. The video is displayed `object-fit: cover` over a full-viewport stage.
To get CSS pixels:

```js
var AR = 2560 / 1302;          // 1.9662 — master and delivery share this
function quadRect(vw, vh, q) { // q = [x, y, w, h] from screenNorm(t)
  var dw, dh;
  if (vw / vh > AR) { dw = vw; dh = vw / AR; }   // pillar/letterbox by cover
  else              { dh = vh; dw = vh * AR; }
  var ox = (vw - dw) / 2, oy = (vh - dh) / 2;
  return { l: ox + q[0]*dw, t: oy + q[1]*dh, w: q[2]*dw, h: q[3]*dh };
}
```

**Portrait viewports:** at 390x844 the cover crop is severe and the screen quad comes
out **wider than the viewport** (~561px wide against a 390px viewport). This is
already handled — `.panel__inner` carries `max-width: 100vw` so the copy wraps to the
visible slice. The quad happens to be near-centred there, so it still reads as being
on the glass. **Do not "fix" this by shrinking the panel to the viewport**; the panel
must stay welded to the quad or the weld breaks.

---

## 7. Hard constraints

1. **Never edit `assets/js/vendor/scrollcraft.js` or `assets/css/vendor/scrollcraft.css`.**
   All bespoke behaviour is page-level, in `assets/js/v3.js` / `assets/css/v3.css`.
2. **Do not set `position` on `.close` or any `[data-sc-stage]` element.** The engine
   sticks stages with `position: sticky`; a page-level `position: relative` silently
   beats it and un-pins the act, putting content below reachable scroll. This already
   happened once.
3. **Accessibility.** `#glass` contains a real CTA link. It must be `inert` +
   `aria-hidden` whenever the panel is too small or too faint to use, and only
   reachable when it is genuinely usable (WCAG 4.1.2). The existing `setInert()` does
   this off flight progress; extending to phase A means the tracked panel is small
   and must stay inert throughout it.
4. **Reduced motion.** No position animation. The current branch drops the flight and
   presents the panel full-viewport. Phase A must degrade the same way — do not
   introduce tracked motion under `prefers-reduced-motion: reduce`.
5. **Codecs.** The test Chromium at `/opt/pw-browsers/chromium` has **no H.264**. The
   page picks VP9 at runtime when `canPlayType` reports no avc1 support. Without that
   fallback a verification run silently "passes" against a poster. Do not remove it.
6. **Cache-busters.** All asset URLs carry `?v=YYYYMMDDx` and must be bumped together
   with the HTML, or a 7-day cache serves stale JS against new markup.

---

## 8. Traps already hit — do not propose these

- **Compositing the site into the video file.** Tried at length and deleted. A face-on
  2D paste against a camera looking down has no base, no contact shadow and no
  parallax; it reads as a sticker. The live DOM panel is the correct approach.
- **Blurring or hazing the panel edges** to hide the seam. Three variants were
  indistinguishable at 1:1 and none addressed the real cause.
- **Deriving video time from scroll position.** The engine lerps `currentTime` toward
  a target; the two are not in lockstep. Read the element.
- **Seeding the tracker from a fitted curve.** Outside its fitted range it snapped to
  the nearest dark object (a cloak) and the element floated off the laptop. Use the
  seed-free, scale-free brightest-run detector.
- **Mapping the clip across the stage's whole visible life** (the engine default).
  The act deliberately uses `data-sc-clip-map="travel"` so the last frame lands
  exactly at the pin end, which is where the still takes over. The verification
  harness will report a 270px "frozen clip" for this. **That warning is expected and
  correct** — the overlay covers precisely that stretch.

---

## 9. Acceptance criteria

1. Walking the page in 60px steps at 1440x900, there is **no scroll position** where
   the laptop screen is on camera at `t >= GLASS_FROM_T` and the site panel is not
   drawn on it. The 540px gap goes to zero.
2. The panel's rectangle is continuous: **no single 60px scroll step moves any edge of
   the panel by more than ~2% of the viewport**, at any phase boundary.
3. The panel stays locked to the screen — sample at least 12 positions across
   `t = 10.4 -> 15.0` and confirm the panel's edges sit on the display's edges, by
   eye on the screenshots, not by metric alone. **A brightness or coverage metric is
   what missed the last tracking failure.**
4. Contact sheets clean at 1440x900, 390x844 and reduced motion, via
   `scrollcraft/scripts/shoot.mjs` (skill lives outside the repo, see §10).
5. All cues still clear 4.5:1 measured on composited pixels.
6. `scrollcraft/verify/a11y-check.cjs` reports zero errors, zero failed requests and
   zero reachable-but-invisible focusables on all four pages.

---

## 10. File inventory

| Path | Role |
|---|---|
| `v2.html` | The five-act page. `#glass`, `#panel`, `#bezel` live at the bottom. |
| `assets/js/v3.js` | **The file to change.** Signature move, ~150 lines. `QUAD` L51, `quadRect()` L70, `render()` L107. |
| `assets/css/v3.css` | Theme tokens + page classes. `.glass` L92, `.panel` L102, `.bezel` L138. |
| `assets/js/vendor/scrollcraft.js` | Engine. **Read-only.** |
| `assets/css/vendor/scrollcraft.css` | Engine styles. **Read-only.** |
| `assets/video/sc/film.{mp4,webm}` | 15s scrub clip, dense GOP. |
| `assets/video/sc/film-end.jpg` | Final frame still, used by phase B. |
| `scrollcraft/verify/a11y-check.cjs` | Contrast + tab-order harness. |
| `scrollcraft/builds/design-of-man/BRIEF.md` | Why the page is shaped this way. |
| git `785d547:assets/js/v2.js` | **Contains the 28-row `SCREEN_TRACK` and `screenNorm()`.** Recover from here. |

Verification harness (outside the repo, cloned this session):
`/home/user/nateherkai/scroll-craft/plugins/nateherk-design/skills/scrollcraft/scripts/shoot.mjs`
Run with `SCROLLCRAFT_CHROME=/opt/pw-browsers/chromium` against a local
`serve.mjs --root . --port 4500`.

---

## 11. The one-sentence ask

Make the site panel track the laptop's display continuously from the first frame the
display is cleanly on camera (~`t = 10.3s`) through to the end of the flight, driven
by the video element's own `currentTime`, with the existing 28-row track extended
backwards and the overlay made transparent during the tracking phase.

---

# AS BUILT

The defect is fixed. What follows is what was actually wrong, because only one
of the two causes in §1–§3 above turned out to be the whole story.

## The four real causes

**1. Wrong driver (as diagnosed).** The overlay ran off the peak act's scroll
position, so it switched on at one instant instead of following the screen. Now
driven off `video.currentTime`.

**2. Missing tracking data (as diagnosed).** The table started at 11.583s. It now
starts at 10.333s — the first frame the screen is fully in shot — with 9.833s to
10.291s linearly extrapolated (the screen is still entering at the right frame
edge there; the motion is linear to 3.0px over the anchor frames).

**3. NOT a rectangle — a perspective quad.** The screen is a strongly tilted
parallelogram through the whole wide shot and a keystoned trapezoid even in the
close one (at t=14.958 its bottom edge is 884px against 849px at the top). Any
axis-aligned box reads as a flat sticker at the wrong angle. The table is now
four corners per frame and the panel is placed with a matrix3d homography solved
per frame (verified exact: 0.0000px corner error on a synthetic keystone).

**4. Frame quantisation — the one that mattered most, and was not in the plan.**
A scrubbed `<video>` displays a DISCRETE frame held for 1/24s while
`currentTime` advances continuously through it. Interpolating the track against
a continuous time slides the panel up to a whole frame of motion away from the
picture it is welded to. The close shot moves ~3px/frame and hid this; the wide
shot moves ~23px/frame and it showed as a wedge of un-covered screen. Snapping
the lookup to `floor(t * 24) / 24` cut measured un-covered bright pixels from
7932 to 914 — `round()` is 8.7x worse than `floor()`, measured, not assumed.

Two further findings worth keeping:

- **The cut is at ~11.44s, not 11.5s, and t=11.458 is a BLENDED transition
  frame** whose corners are an average of both shots. The original 0.125s grid
  had a row exactly there; smoothing then dragged that average backwards through
  the entire wide shot. It is excluded from the table.
- **Sampling at 0.125s was too coarse.** At ~23px of motion per frame, any window
  wide enough to suppress noise also lags and shrinks the quad. The table is now
  one row per frame at 24fps with a symmetric ±1 window (0.083s), giving max
  second-differences of 2.7px (wide shot) and 4.0px (close).

## What shipped, and why it is simpler than the plan

The final design does not composite anything onto the laptop at all.

The plate's screen is blown out to a measured rgb(244,250,243). Rather than try
to put content on that screen while it is 300px wide and moving 23px a frame,
the page leaves the footage alone and **pushes into it**: at the end of the film
the last frame is scaled about the screen's own centre until the screen has
swallowed the viewport. What you are looking at is then, literally, the machine's
screen. The mark comes up on that white, and the site boots on it.

That removes the entire defect class. There is no panel welded to a moving quad,
so there is no sub-pixel alignment to get wrong, no dilation to tune, no frame
quantisation to compensate for, and nothing that can betray itself as a
composite. The 123-row track was reduced to the ONE rectangle the push-in needs
to aim at, and roughly 120 lines of homography, interpolation and frame-snapping
machinery were deleted.

The findings above are kept because they are true of the footage and would be
needed again by anyone who does want to track something onto it.

## The design change that made it robust

Grading a dark panel into a daylit plate was the wrong problem to solve, and so,
in the end, was welding anything to the glass. The sequence is: the film runs
untouched → the last frame is scaled about the screen's centre until the screen
IS the viewport → the mark comes up on the white → the site boots. `--mark` and
`--boot` carry the last two states.

## Decision on the clipped entry stretch (§2 asked for this explicitly)

Moot in the shipped design: nothing is drawn on the screen while the film runs,
so the stretch where the screen is entering at the right frame edge needs no
tracking data and no fade. It is simply the film.

## Contrast, which the redesign broke and then fixed

Making the screen white put a large blown-out object in the same frame as the
copy, and re-shaping the film scrim to stop it crushing the laptop pulled density
off the copy at the same time. Worst frame went to 1.40:1. Three things were
wrong and each had to be measured rather than guessed:

- A pad placed INSIDE the cue element fades with the text while the plate behind
  it does not, so it buys nothing at the frames that matter. The scrim has to be
  independent of the reveal.
- The failing line was white body copy over a pale cream cloak, not the accent
  italic — removing the accent changed the number by zero, which is how that was
  ruled out.
- On viewports under 860px the engine spans the copy full width, so a
  corner-weighted scrim leaves the right end of every line unprotected.

Final: every cue clears 4.5:1 at its worst frame on desktop, at 390x844, and
under reduced motion.
