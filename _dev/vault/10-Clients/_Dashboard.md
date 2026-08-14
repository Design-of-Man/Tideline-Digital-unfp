---
type: dashboard
---

# Clients

> [!tip] Seeing nothing? Start here.
> This list should name 16 clients. If it is **empty**, Obsidian is pointed at
> the wrong folder — you opened the folder *containing* `vault`, rather than
> `vault` itself. Close the vault and reopen, picking the `vault` folder.
> If it shows a grey code block instead of a list, Dataview is not enabled yet.

```dataview
LIST
FROM "10-Clients"
WHERE type = "client"
```

## Instrumentation gaps — fix these first

Traffic and search data cannot be backfilled. Every client on this list is a
month of history you will never be able to show them.

```dataview
TABLE WITHOUT ID
  file.link AS Client, vercel AS Project, analytics AS Analytics, gsc AS GSC
FROM "10-Clients"
WHERE type = "client" AND (analytics = false OR gsc = false)
SORT file.name ASC
```

## Roster

```dataview
TABLE WITHOUT ID
  file.link AS Client, status AS Status, retainer AS Retainer,
  last_report AS "Last report"
FROM "10-Clients"
WHERE type = "client"
SORT status ASC, file.name ASC
```

## Monthly recurring revenue

```dataview
TABLE WITHOUT ID sum(rows.retainer) AS MRR, length(rows) AS "Clients counted"
FROM "10-Clients"
WHERE type = "client" AND status = "active" AND retainer > 0
GROUP BY true
```

Reads blank until retainers are filled in. That is the point — an MRR you
cannot state is an MRR you are not managing.

## Missing basics

```dataview
TABLE WITHOUT ID
  file.link AS Client,
  choice(length(domains) = 0, "domain", "") AS Missing,
  choice(length(contacts) = 0, "contacts", "") AS Also
FROM "10-Clients"
WHERE type = "client" AND (length(domains) = 0 OR length(contacts) = 0)
SORT file.name ASC
```

## Reports overdue

```dataview
TABLE WITHOUT ID file.link AS Client, last_report AS "Last report"
FROM "10-Clients"
WHERE type = "client" AND status = "active"
  AND (last_report = null OR last_report < date(today) - dur(35 days))
SORT last_report ASC
```

## Brand kits not locked

A build should not start against an unlocked kit.

```dataview
TABLE WITHOUT ID file.link AS Kit
FROM "10-Clients"
WHERE type = "brand" AND locked = false
SORT file.name ASC
```

## Content queues running dry

```dataview
TABLE WITHOUT ID
  file.link AS Client, queue_days AS "Days left", last_checked AS Checked
FROM "10-Clients"
WHERE type = "content" AND queue_days != null AND queue_days < 3
SORT queue_days ASC
```
