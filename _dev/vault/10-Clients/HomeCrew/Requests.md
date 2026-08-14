---
type: requests
client: homecrew
---

# HomeCrew — requests

Append-only. The intake Routine writes here, newest at the bottom, one
block per request:

```
## 2026-08-14 — <subject>
From: <sender>
Asked: <the request, in their words where possible>
Status: open | done | declined
```

Nothing is deleted. Closing a request means changing its `Status`, so the
history of what was asked stays readable.

