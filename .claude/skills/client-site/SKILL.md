---
name: client-site
description: The Design of Man delivery pipeline for a client website — scope preflight, audit, build, ship check, client artifact. Use whenever the work is a client site rather than the clinic's own operations. Triggers on a client name (Abacoa Podiatry, Legends Radio, RegenOrtho, RevitalIV, Sundial, Paradise, HomeCrew, Elite Sports, IV League, Jupiter Laser, Paddy Macs, Premiere, Wellness, First Rehab site), and on "redesign", "rebuild the site", "audit their site", "before I pitch them", "pipeline verify", "is it live", "did it deploy", "ship it", "push this to Vercel", "build a page for", or any session that opens by cloning a client repo. Not for the clinic's inbox, calendar, money, or content queue — that is jarvis.
---

# Client site pipeline

Every client build runs the same four phases. Phase 0 is not optional and runs
**before the first file is touched** — skipping it is the single most expensive
recurring mistake in this operation.

## Phase 0 — Scope preflight

**The rule: the branch you will push to must live in the repo the client's site
lives in.**

Four sessions' work has landed on `firstrehabnpb` — the clinic repo — because
the session opened with the wrong source. Others got to push time and found the
clone was read-only, or the org lacked Contents:write. All of it was knowable
in the first thirty seconds.

Before editing anything:

1. **Client → repo.** Name the repo this client's site lives in. If the session
   source doesn't match it, stop and say so now.
2. **Outcome branch → same repo.** Check where the branch is actually targeted.
   This is where the clinic repo sneaks in.
3. **Push access now, not later.** A repo you can clone is not a repo you can
   push to.

If any check fails, the first reply names the exact fix — a new session on the
right source, or the org settings URL — and does not start building.

→ `references/scope-preflight.md` for the roster, the checks, and the recovery
text for each failure mode.

## Phase 1 — Audit

Read the live site before opening the repo. The findings become the pre-sale
artifact, so record them in the client's terms.

Standing traps, all of them seen on real client sites:

- **Placeholder content shipped as real** — invented phone numbers, invented
  stats ("120+ sites, 99.9% uptime"), lorem testimonials.
- **Brand split** — visible copy says one business, canonicals / schema `@id` /
  email domain say another. Search engines read that as two companies. The
  Design of Man site had exactly this against `tidelinedigital.com`.
- **Dead conversion path** — booking link 404s, contact endpoint returns 503,
  form posts nowhere. Test the actual submission; do not read the markup and
  assume.
- **Dead links** — `href="#"` on footer socials is the usual one.
- **Mobile nav that isn't hidden** — off-screen via `transform` while still
  `visibility: visible`, so the document reports a wider viewport than the
  device and keyboard users tab into an invisible menu.

Then measure rather than assert: Lighthouse mobile, axe, LCP. Those numbers are
what the artifact quotes.

## Phase 2 — Build

House conventions, not generic advice:

- **Static first.** No build step unless something genuinely needs one. Vercel
  serves the files as they are.
- **`vercel.json`** carries the security headers and cache policy — copy the
  shape from the Design of Man repo: `nosniff`, `SAMEORIGIN`,
  `strict-origin-when-cross-origin`, restrictive `Permissions-Policy`,
  immutable long cache on versioned bundles, a week on `/assets/*`.
- **`.vercelignore`** keeps `_dev/` and markdown out of the deployment.
- **A preflight gate that hard-fails.** `_dev/preflight.py` in the Design of Man
  repo is the working model — it blocks on unreplaced `REPLACE_*` placeholders,
  unset form endpoints, broken internal links, missing assets, duplicate or
  missing meta, invalid JSON-LD, images without alt, missing `<h1>`. Port it per
  client; the one thing to change is the `DOMAIN` constant. It must exit
  non-zero, or it is a suggestion rather than a gate.

For quality work, use the skill that already covers it instead of improvising:
`core-web-vitals` (LCP/INP/CLS), `web-accessibility` (WCAG, axe),
`marketing-ai-seo` (AI/answer-engine visibility), `web-typography` (type),
`refactoring-ui` and `top-design` (visual). `avoid-ai-writing` before any copy
ships.

## Phase 3 — Ship check

The written-down version of "pipeline verify". Repo → Vercel project → branch
alias resolves and isn't stale → deployment protection off so the client can
actually open the link → domain and DNS → a real submission through every form.

Two failures recur: a client sent a **stale branch alias** and saw the old site,
and a preview URL stayed **SSO-protected** so the client hit a login wall on
what was supposed to be a shareable link. Check both every time, before sending
anything.

→ `references/ship-check.md` for the ordered list and the Vercel calls.

Then commit, push with `-u origin`, open a **draft PR**.

## Phase 4 — Client artifact

Two formats, picked by where the client is:

- **Pre-sale audit** — what's broken, what it costs them, what it takes to fix.
- **Post-build proof** — what was broken, what shipped, what it measures now.

Both quote real numbers from the run. `LCP 3618→2971ms`, `Lighthouse 90→94`,
`axe 0/107` is the register that has landed. Publish with `Artifact`.

→ `references/client-artifact.md` for both skeletons and the voice rule.
