# Deploying Design of Man

A static site with one serverless function. No build step: Vercel serves the
files as they are, and `api/contact.mjs` runs on demand.

Everything below was verified against this repository on 2026-09-03. If a
statement here disagrees with the code, the code is right and this file is a
bug.

---

## 1 · Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**, for
Production and Preview.

| Variable | Required | What happens without it |
|---|---|---|
| `RESEND_API_KEY` | **yes** | `/api/contact` answers `503` and tells the visitor to email instead. It never accepts a lead it cannot deliver. |
| `CONTACT_TO` | no | Defaults to `hello@designofman.com`. |
| `CONTACT_FROM` | no | Defaults to `Design of Man <site@designofman.com>`. Must be on a domain **verified in Resend**, or every send is rejected. |

Verifying the sending domain in Resend means adding its DKIM and SPF records
to DNS. Skipping that step is the single most common reason a working form
still delivers nothing: the endpoint returns 200, Resend accepts the request,
and the receiving server drops the mail.

## 2 · Turn on analytics

**Vercel → Project → Analytics → Enable**, and the same for **Speed Insights**.
Both scripts are already in every page's footer, served from `/_vercel/*` on
your own domain — no third-party host, no cookie banner, and nothing to add to
the Content-Security-Policy. Until the features are enabled in the dashboard
those two paths 404 harmlessly.

## 3 · Domain

Add `designofman.com` in **Settings → Domains** and let Vercel issue the
certificate. Every canonical, Open Graph URL, schema `@id`, `robots.txt` and
`sitemap.xml` already points at `https://www.designofman.com`; if you serve the
apex instead, change `SITE` in `scripts/pages.py` and re-run the build below.

## 4 · Build and gate

```bash
python3 scripts/pages.py            # shared head/header/footer helpers
for p in work services studio process pricing contact case 404 local insights; do
  python3 "scripts/build_$p.py"
done
python3 scripts/sync_index.py       # homepage's shared blocks
python3 scripts/build_poster.py     # responsive LCP image (needs Pillow)
python3 scripts/build_meta.py       # sitemap.xml, robots.txt, llms.txt

./scrollcraft/verify/run-all.sh     # every gate; non-zero if anything fails
```

`run-all.sh` runs the pre-deploy gate plus seven browser checks: internal links
resolve, every reveal fires, every tap target clears 24×24, the contact
endpoint cannot silently lose a lead, every page loads clean under the shipped
Content-Security-Policy, Core Web Vitals stay inside Google's "good" band on a
throttled phone, and no text is painted over at any scroll position.

**Do not deploy on a red run.** Each of those checks exists because the thing
it tests has already broken here once.

## 5 · Deploy

```bash
vercel --prod
```

or push to the connected branch and let the Git integration do it.

---

## After the first deploy

1. **Submit the sitemap** in Google Search Console: `https://www.designofman.com/sitemap.xml`.
2. **Send yourself a real enquiry** through `/contact`, and confirm it arrives —
   including in spam. Repeat quarterly; forms break when a card expires or a
   DNS record moves, and nothing tells you.
3. **Check the security headers** at <https://securityheaders.com>. The
   configuration in `vercel.json` is written for an A+ and the CSP is enforced
   locally by `csp-check.cjs`, but only the live response proves it.
4. **Confirm `/pay` still shows its stand-in.** See the open item below.

## Payments are not on the site

`/pay` is not built or deployed. Payments are not being taken through the site
for now, so the page came off rather than shipping with a Stripe placeholder on
a button a paying client might press. `/pay` and `/pay.html` **302 to
`/contact`**, so an old link or one inside an already-sent invoice still lands
somewhere useful.

Everything needed to bring it back is still in the repo. To restore it:

1. **Stripe Dashboard → Settings → Billing → Customer portal → Login page**,
   and paste that URL over `REPLACE_PORTAL_LINK` in `scripts/build_pay.py`.
2. `python3 scripts/build_pay.py`
3. Put `("/pay", "Pay")` back in `FOOTNAV` in `scripts/pages.py`, re-run the
   build, and drop the two `/pay` redirects from `vercel.json`.

See `BILLING-SETUP.md` for the Stripe side.
