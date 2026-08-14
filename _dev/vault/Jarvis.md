---
type: brief
---

# Jarvis

One hub. The vault is the system of record; this note is the front door, and the
HUD artifact is the same data at a glance. Rewritten each morning by the brief
Routine — the sections below are live queries, so they are current even between
runs.

## Needs you

Nothing in this system publishes or pushes on its own, so these are the gates.

```dataview
TABLE WITHOUT ID file.link AS Piece, client AS Client
FROM "30-Content"
WHERE type = "content-piece" AND status = "draft"
SORT date ASC
```

## Clients not instrumented

Traffic and search history cannot be backfilled. Every row is a month you will
never be able to show that client.

```dataview
TABLE WITHOUT ID file.link AS Client, analytics AS Analytics, gsc AS GSC
FROM "10-Clients"
WHERE type = "client" AND (analytics = false OR gsc = false)
```

## Open client requests

```dataview
TABLE WITHOUT ID file.link AS Client
FROM "10-Clients"
WHERE type = "requests"
```

## Reports overdue

```dataview
TABLE WITHOUT ID file.link AS Client, last-report AS "Last report"
FROM "10-Clients"
WHERE type = "client" AND status = "active"
  AND (last-report = null OR last-report < date(today) - dur(35 days))
SORT last-report ASC
```

## Elsewhere

- [[10-Clients/_Dashboard|Clients]]
- [[30-Content/_Calendar|Content]]
- [[10-Clients/_Revenue|Revenue]]
- [[90-System/Agents|Agents]]
- [[90-System/Token budget|Token budget]]

---

*The morning sweep writes calendar, mail, deployments and money above this line.
Everything below is queried live and needs no sweep to be true.*
