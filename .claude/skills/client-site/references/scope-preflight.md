# Scope preflight

Runs before the first edit. Costs thirty seconds. Has cost multiple sessions'
work when skipped.

## The roster

Client work lives under the **Design-of-Man** GitHub org and the Vercel team
`team_VWA1Ar7nCeuyUifvSyeFTT1T`. Older repos still exist under
`nicholasbkashuba-lab` — those are the migration source, not the target.

| Client | Repo | Vercel project |
|---|---|---|
| Abacoa Podiatry | `Design-of-Man/abacoapodiatry` | `abacoapodiatry` |
| RegenOrtho | `Design-of-Man/regenortho` | `regenortho` |
| RevitalIV | `Design-of-Man/revitaliv` | `revitaliv` |
| Wellness | `Design-of-Man/wellness` | `wellness` |
| First Rehab (site) | `nicholasbkashuba-lab/firstrehabnpb` | `firstrehabnpb-zywd` |
| First Rehab (app) | `nicholasbkashuba-lab/firstrehabapp` | `firstrehabapp` |
| Sundial | `Design-of-Man/sundial` | `sundial` |
| Paradise Ventures | `Design-of-Man/paradise` | `paradise` |
| Paddy Macs | `Design-of-Man/paddy` | `paddymacs` |
| Legends Radio | `Design-of-Man/legends` | `legends` |
| Premiere | — | `premiere` |
| HomeCrew | `Design-of-Man/homecrew` | `homecrew` |
| Elite Sports Med | `Design-of-Man/elitesports` | `elitesports` |
| IV League Infusions | `nicholasbkashuba-lab/ivleague` | — |
| Design of Man / Tideline | `Design-of-Man/tideline-digital-unfp` | `design-of-man` |

Supabase backs three: Wellness, First Rehabilitation App, Home Crew.

Confirm rather than trust this table — repos get migrated. It is a starting
point, not an authority.

## The checks

**1. Does the session source match the client?**

```bash
git remote -v
git branch -a
```

If the client is RegenOrtho and the remote says `firstrehabnpb`, stop here.
That exact mismatch has produced branches on the clinic repo four separate
times, discovered only at push.

**2. Where is the outcome branch targeted?**

The session's outcome repo is not always the repo you cloned. When a session
carries several sources, the branch can land on the first one rather than the
one you're editing. Check it explicitly before building.

**3. Is push access real?**

A read-only clone looks identical to a writable one until you push. Call
`add_repo` with `access: "push"` for the target repo at the start, not at the
end.

## Recovery text

Use these verbatim — each has been the actual blocker at least once.

**Wrong source repo.** The session cannot be repointed. Say:

> This session is sourced from `<wrong-repo>`, so anything I push lands there
> rather than on the client's site. Start a new session with
> `Design-of-Man/<right-repo>` as the initial source and I'll pick this up
> there — nothing is lost, I haven't edited anything yet.

**Read-only clone.** Call `add_repo` with `access: "push"`. If it comes back
denied, relay the tool's reason and the admin path:
`https://claude.ai/admin-settings/claude-in-slack`.

**Org lacks Contents:write.** The GitHub App is installed but under-scoped:

> The Claude App can read `Design-of-Man` but not write to it. Grant
> Contents:write at
> `github.com/organizations/Design-of-Man/settings/installations`, then say the
> word and I'll push.

**Stray branch already on the wrong repo.** It cannot be deleted from a session
that isn't scoped to that repo. Name the branch and the repo precisely so it can
be deleted by hand, and confirm the work also exists on the right repo before
suggesting anyone delete anything.

## Branch naming

`claude/<short-task-slug>-<suffix>`. One branch per piece of work. Do not stack
new work on a branch whose PR has already merged — restart from the default
branch under the same name.
