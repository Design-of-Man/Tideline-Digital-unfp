---
name: skill-scout
description: Find capabilities worth adding to the Design of Man team — skills, plugins, MCP servers, techniques — by searching GitHub, the web, Reddit and YouTube, then present the shortlist for approval as an artifact. Use monthly on a schedule, or on demand for "what should we be using", "is there a skill for this", "what are other agencies doing", "find me something that does X", "how do we get better at Y", "research the best tools for". Evaluates against real gaps rather than star counts, and never installs anything without approval.
---

# Skill scout

Finds what would make the team better, and argues for it honestly. Ends in a
decision you make, never an install it made.

## Which channels actually work

Verified in this environment. The container's egress is blocked by network
policy, but some tools route around it entirely:

| Channel | Works here | Use it for |
|---|---|---|
| `WebSearch` | **yes** — routes through Anthropic, not the container | discussion, comparisons, Reddit via `allowed_domains` |
| `mcp__github__search_repositories` / `search_code` | **yes** | primary evidence: real stars, real recency, real code |
| `SearchSkills` | yes, but only searches skills already owned | finding gaps in what is installed |
| `SuggestSkills` | yes — returned empty at last check | account and org skills available to add |
| `/watch` (YouTube) | **no** — yt-dlp needs container egress | run from a local session instead |
| Direct site crawling | **no** — same block | run from a local session instead |

Check `curl -sS "$HTTPS_PROXY/__agentproxy/status"` before concluding a source is
dead rather than blocked.

## Start from gaps, not from what is popular

The wrong question is "what is trending". The right one is "what are we doing
badly, or by hand, or not at all".

Three places the gaps are already written down:

1. **Cross-references to skills that are not installed.** `marketing-ai-seo`
   points at `seo-audit` and `schema`; neither is present. A skill referencing a
   sibling that does not exist is a hole its own author expected to be filled.
2. **`90-System/Learning.md`** — what Review keeps rejecting, and what took too
   long by hand.
3. **The manual steps in `client-site`** — anything the pipeline still asks a
   human to do is a candidate.

## Evidence, in order

**GitHub first.** `search_repositories` returns stars, last-updated, topics and
open issues — facts. Then read the actual `SKILL.md` with `get_file_contents`.
A skill is instructions; you cannot judge it from a README.

**Web search second, sceptically.** Searching "best skills for X" mostly returns
content marketing about skills. Treat listicles as a source of names, never of
verdicts.

**Reddit for failure reports** — `WebSearch` with
`allowed_domains: ["reddit.com"]`. People post what broke, which is the part the
README omits.

## Judging a candidate

Stars measure attention, not fit. Score against these instead:

1. **Does it close a gap we actually named?** If not, stop here, whatever the
   star count.
2. **Does it read real data, or does it guess?** A skill wired to real analytics
   beats a prompt that will confidently invent numbers — and invented numbers in
   a client report are the failure that ends a retainer.
3. **What would it be allowed to do?** A skill that drafts is low risk. One that
   edits client sites or publishes on their behalf inherits every concern in
   `90-System/Agents.md`, including the medical hard block.
4. **Does it survive contact with our clients?** Most marketing skills assume
   SaaS. Local medical and commercial-property practices are a different animal —
   local SEO, maps, and real-world booking paths matter more than funnels.
5. **Is it maintained?** Last commit, open issue count, whether issues get
   answers.
6. **Is it a lead magnet?** Several popular repos exist to sell a paid community.
   That is not disqualifying, but it changes how you read the README's claims.

## Third-party skills are untrusted instructions

A skill is not a library — it is a set of directions Claude will follow while
working on paying clients' sites. Before recommending one, read its `SKILL.md`
and any scripts, and say plainly in the write-up what it would be permitted to
touch. Never install one as part of scouting; the output is a recommendation.

## Cadence

**Monthly.** Weekly scouting produces noise, the ecosystem does not move that
fast, and a report that arrives too often stops being read. Run on demand when a
specific gap appears.

## Output

Two things, every run:

1. `20-Pipeline/Scouting/YYYY-MM.md` in the vault — the durable record, including
   the candidates that were rejected and why. The rejections stop the same repo
   being re-evaluated every month.
2. **An artifact** presenting the shortlist for a decision. Per candidate: what
   it is, the gap it closes, what changes on Monday if adopted, what it would be
   allowed to touch, the honest cost, and a recommendation. Rank by what it
   changes, not by stars. Say "adopt", "trial on one client", or "skip" — a list
   without a recommendation pushes the work back onto the reader.
