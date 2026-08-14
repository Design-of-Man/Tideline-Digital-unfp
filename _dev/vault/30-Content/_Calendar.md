---
type: dashboard
---

# Content calendar

What the agents have made and where it stands. Nothing here has published
itself — everything queues as a draft.

## Awaiting your approval

```dataview
TABLE WITHOUT ID file.link AS Piece, client AS Client, channels AS Channels, review AS Review
FROM "30-Content"
WHERE type = "content-piece" AND status = "draft"
SORT date ASC
```

## Blocked by review

Most often an unsourced clinical claim.

```dataview
TABLE WITHOUT ID file.link AS Piece, client AS Client, review-note AS Why
FROM "30-Content"
WHERE type = "content-piece" AND status = "blocked"
SORT date ASC
```

## Scheduled

```dataview
TABLE WITHOUT ID file.link AS Piece, client AS Client, scheduled AS When
FROM "30-Content"
WHERE type = "content-piece" AND status = "scheduled"
SORT scheduled ASC
```

## Queue depth by client

Under three days is an alarm. The recurring failure is the queue emptying while
finished assets sit unposted.

```dataview
TABLE WITHOUT ID file.link AS Client, queue-days-remaining AS "Days left"
FROM "10-Clients"
WHERE type = "content"
SORT queue-days-remaining ASC
```
