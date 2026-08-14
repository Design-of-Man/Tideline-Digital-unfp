---
name: site-ingest
description: Pull a client's existing website into a reusable inventory — every page's copy and metadata, and every image catalogued by whether it is actually big enough to reuse. Run this before scoping any rebuild, redesign, migration or prospect audit. Triggers on "pull their site", "what do they already have", "get their photos", "what images do they have", "grab their copy", "can we reuse", "inventory their site", "before I pitch them", and at the start of any new client build. Requires outbound web access, which Claude Code cloud sessions usually do not have — see Network below.
---

# Site ingest

Most "their site looks cheap" problems are missing photography, not missing
design. Most rebuilds stall waiting on assets nobody counted. This answers, on
day one, what actually exists.

## Network — read before running

The crawler needs to reach the open web. **Claude Code cloud sessions usually
cannot**: the environment's network policy routes egress through an agent proxy
that denies general browsing, and the script will exit with that diagnosis
rather than reporting an empty site.

Check before assuming a site is broken:

```bash
curl -sS "$HTTPS_PROXY/__agentproxy/status"
```

`recentRelayFailures` showing `connect_rejected` for ordinary hosts means the
policy is the blocker. Run the ingest from a local Claude Code session, or from
a remote environment configured with open egress.

## Running it

```bash
python3 ingest.py https://theirsite.com --out ./ingest/theirsite
python3 ingest.py https://theirsite.com --out ./out --max-pages 80
python3 ingest.py https://theirsite.com --out ./out --skip-images   # inventory only
```

Uses the preinstalled Chromium under `/opt/pw-browsers` — it resolves the binary
itself, so **never run `playwright install`**. If only the pip package is
missing, `pip install playwright` is enough; the browser is already there.

Discovery prefers `sitemap.xml` and falls back to a same-origin crawl. The
`--max-pages` cap defaults to 40 deliberately: an uncapped crawl of a large site
is a silent bill.

## What comes out

| File | Contents |
|---|---|
| `inventory.md` | the summary — lead with this |
| `pages/*.md` | per page: title, meta, canonical, headings, full copy, phone and email links, form count |
| `images/` | every image downloaded |
| `images.csv` | every image with natural dimensions, bytes, alt text, verdict, and which pages use it |

## Reading the verdicts

Judged on **natural** width, because that is the only number that says whether an
asset survives a rebuild. Rendered size just reflects the layout it is trapped in.

- **hero** (≥2000px) — full bleed at 2x
- **section** (≥1200px) — section imagery, not a full-bleed hero
- **thumbnail** (≥800px) — cards only
- **unusable** (<800px) — recommission; upscaling produces the blurry hero that
  has already cost one project a fortnight
- **unknown** — CSS background or lazy-loaded; measure by hand

**The hero count is the number that matters.** If it is near zero, the rebuild is
blocked on photography and that belongs in the kickoff conversation, not
discovered three weeks in.

## What to do with it

1. Fill the client's `Brand.md` asset checklist from what is genuinely present.
2. Turn the gaps into a specific request. *"31 photographs at 2000px or wider,
   landscape, of the treatment rooms and staff"* gets acted on. *"Send photos"*
   does not.
3. Feed `pages/*.md` to `brand-voice` — a voice derived from how they already
   write beats a voice invented from a brief.
4. For a prospect, the copy and the broken conversion path feed straight into the
   pre-sale audit in `client-site/references/client-artifact.md`.

## Care

Crawling someone's site is reading a public page, but do it politely: the script
identifies itself in its user agent and keeps the page cap low. For a prospect
you have not spoken to, keep it to what an audit genuinely needs.
