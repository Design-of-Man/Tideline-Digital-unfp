---
type: dashboard
---

# Clients

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
  last-report AS "Last report"
FROM "10-Clients"
WHERE type = "client"
SORT status ASC, file.name ASC
```

## Monthly recurring revenue

```dataview
TABLE WITHOUT ID sum(rows.retainer) AS MRR
FROM "10-Clients"
WHERE type = "client" AND status = "active"
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
TABLE WITHOUT ID file.link AS Client, last-report AS "Last report"
FROM "10-Clients"
WHERE type = "client" AND status = "active"
  AND (last-report = null OR last-report < date(today) - dur(35 days))
SORT last-report ASC
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
  file.link AS Client, queue-days-remaining AS "Days left", last-checked AS Checked
FROM "10-Clients"
WHERE type = "content" AND queue-days-remaining != null AND queue-days-remaining < 3
SORT queue-days-remaining ASC
```
