# The Design of Man — operating vault

An Obsidian vault that scheduled agents write and a human reads.

## Wiring it up

1. Create a **private** repo and push this directory to it.
2. Open the folder as a vault in Obsidian.
3. Install **Dataview** (required — the dashboards are Dataview queries),
   **Templater**, and **Obsidian Git**.
4. In Obsidian Git, set auto-pull on startup. The Routines push; you pull.

## Structure

```
00-Inbox/        captures, unprocessed
10-Clients/      one note per client — frontmatter is the registry
20-Pipeline/     prospects and generated audits
30-Content/      clip library, hooks, series
40-Metrics/      auto-written snapshots, one note per client per month
90-System/       templates and the Routine definitions
```

## The one idea

**Frontmatter is the database.** Every client note carries structured fields;
`10-Clients/_Dashboard.md` queries them into live tables. Nothing is
maintained twice, and the volatile fields are written by the Routines rather
than by hand.

## Read this first

`10-Clients/_Dashboard.md` opens with instrumentation gaps, because as of the
first commit **no client site has Vercel Web Analytics or Search Console
enabled**. Traffic and search history cannot be backfilled, so that list is
the most expensive thing in the vault.
