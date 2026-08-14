# Ship check

"Pipeline verify," written down. Run it in order. Every step has a pass
condition — "it looked fine" is not one of them.

## 1. Gate

```bash
python3 _dev/preflight.py
```

Pass: prints `READY TO DEPLOY` and exits 0. A non-zero exit means do not
deploy, regardless of how small the blocker looks. Unreplaced `REPLACE_*`
placeholders and unset form endpoints are the two that matter most — they ship
a site whose contact path silently goes nowhere, which is worse than not
shipping.

## 2. Repo → Vercel project

`mcp__Vercel__get_project` — confirm the project's Git connection points at the
repo you just pushed to. A project wired to the pre-migration
`nicholasbkashuba-lab` repo will keep serving the old site while you push to
the new one and wonder why nothing changes.

**Confirm which project is canonical before trusting a preview URL.** Repos
here routinely have more than one Vercel project attached — this one has four
(`design-of-man`, `designofman-site`, `tideline-digital-eiq7`,
`tideline-digital-hxu2`), two of them rooted at `books/`. Each posts its own
preview link on every PR, so the top link in the Vercel comment is not
necessarily the site. Check `mcp__Vercel__list_teams` and
`mcp__Vercel__list_projects` rather than assuming a team ID; projects live
across more than one team.

Retire or rename the duplicates when you find them. Every stale project is a
future stale link sent to a client.

## 3. Deployment succeeded

`mcp__Vercel__list_deployments` — newest deployment is `READY`, its commit SHA
matches your push, and its branch is the branch you pushed.

On failure: `mcp__Vercel__get_deployment_build_logs`. Read the log; do not
re-push and hope.

## 4. The URL you're about to send

This is where it has gone wrong twice.

**Stale alias.** A branch alias points at the branch's latest deployment, but a
URL captured from an earlier branch keeps resolving to old output. Open the URL
you intend to send and confirm the change is visibly present. If a client
reports "I don't see it," suspect the alias before suspecting the cache — then
send the current one rather than asking them to hard-refresh a dead link.

**Protection wall.** `mcp__Vercel__get_project_deployment_protection` — for
anything a client will open, `ssoProtection` must be off. Otherwise they hit a
Vercel login and conclude the site is broken. Verify in a private window, where
your own session cookie can't mask it.

## 5. Domain

Custom domain attached, DNS resolving, HTTPS valid, `www` and apex both landing
somewhere sensible. Canonical tags point at the production domain — the
preflight gate checks this, which is why it runs first.

## 6. Real submissions

Not markup review. Actually submit:

- Contact / chat widget → confirm the email arrives
- Booking link → confirm it opens the real scheduler
- Billing or invoice form, where present
- Payment portal link loads

A form that returns 200 into the void looks identical to one that works.

## 7. Post-live

- `sitemap.xml` submitted in Google Search Console
- Lighthouse mobile on the production URL, not the preview
- Tested on a real mid-range Android if the page carries heavy JS
- Call-tracking / analytics firing

## 8. Then

Commit, `git push -u origin <branch>`, open a **draft PR**, subscribe to its
activity, and drive CI to green. Only then build the client artifact — it quotes
the numbers this check produced.
