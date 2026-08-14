# The Design of Man — operating vault

An Obsidian vault that scheduled agents write and a human reads.

## Open it right now

No GitHub needed for this part.

1. Unzip this folder somewhere you'll keep it — `~/Documents/DesignOfMan` is fine.
2. In Obsidian: **Open folder as vault**, and pick that folder.
3. **Settings → Community plugins → turn off Restricted Mode**, then Browse and
   install **Dataview**. Enable it.

Step 3 is not optional. Every dashboard here is a Dataview query, and without the
plugin they render as grey code blocks and the vault looks broken. If you see
```` ```dataview ```` blocks instead of tables, that is the only thing wrong.

Then open **`Jarvis.md`** at the root. It is the front door.

## Later, when you want the agents writing into it

They cannot write to a folder that only exists on your laptop, so at that point:

1. Create a **private** GitHub repo and push this directory to it.
2. Install **Obsidian Git** and set auto-pull on startup. The scheduled Routines
   push; you pull.
3. Install **Templater** if you want the note templates in `90-System/Templates/`
   to fill themselves in.

Until then this is a static snapshot — accurate as of when it was made, and it
will not update itself.

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
