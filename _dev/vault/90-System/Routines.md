---
type: system
---

# Routines

Each one runs as a fresh session: clone the vault, sweep a source, write
markdown, commit, push. Nick pulls in Obsidian.

| Routine | Cadence | Source | Writes |
|---|---|---|---|
| Site health | weekly | Playwright + Lighthouse against live URLs | `40-Metrics/<client>/` |
| Traffic + search | weekly | Vercel Web Analytics, GSC | `40-Metrics/<client>/` |
| Content queue | daily | Post Bridge | `<Client>/Content.md` |
| Revenue | weekly | QuickBooks | `_Revenue.md` |
| Request intake | daily | agency inbox | `<Client>/Requests.md` |
| Monthly report | monthly | the metrics notes | `<Client>/Reports/YYYY-MM.md` |

## Rules every Routine follows

1. **Never invent a number.** A source that returns nothing writes "no data"
   and says why. A blank cell is information; a plausible guess is a lie that
   reaches a client.
2. **Write frontmatter, not just prose.** The dashboards are Dataview queries
   over frontmatter. Prose nobody queries is a diary.
3. **Append, never rewrite history.** Requests and metrics accumulate.
   Overwriting last month removes the comparison the report depends on.
4. **Commit one Routine per commit,** so a bad sweep reverts alone.
5. **Stay silent when nothing changed.** A Routine that reports every quiet
   run trains its reader to ignore it.

## Not automated, deliberately

Design judgement. Photography. Copy that is true about a business. Client
relationships. Lead sourcing — though the *pitch* is automated: point the
prospect audit at any URL and get a finished artifact.
