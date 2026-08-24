# Billing Setup — Design of Man

`pay.html` is the front door. The actual billing system lives in Stripe. This guide
gets it running in about two hours with **no backend, no serverless functions and no
PCI scope.**

Everything below is configuration in the Stripe Dashboard. You paste four URLs into
`pay.html` and you're done.

---

## Why no custom integration

You could build checkout into the site with Vercel serverless functions. Don't, at
least not yet.

The moment you handle payment data yourself you inherit PCI obligations, fraud
liability, subscription state to keep in sync, dunning logic, and proration maths
when someone changes plan mid-month. Stripe's hosted pages do all of it, are already
localised and accessible, and cost the same. The only thing you give up is having
the payment form on your own domain — worth roughly nothing to a client who is
about to see a stripe.com URL and relax.

Revisit this when you're past ~50 recurring clients and want a branded dashboard.

---

## Step 1 — Stripe account

1. Create the account at stripe.com, business type as appropriate for Design of Man.
2. Complete verification (EIN or SSN, bank account for payouts).
3. **Settings → Business → Public details** — set the business name, support email,
   support phone and logo. This is what clients see on every checkout page and
   receipt, so it should say Design of Man, not your legal entity name if they
   differ.
4. **Settings → Payments → Payment methods** — turn on **ACH Direct Debit**. It is
   off by default and it is the single most valuable setting on this list.

### Why ACH matters here

| Invoice | Card (2.9% + 30¢) | ACH (0.8%, capped $5) |
|---|---|---|
| $2,500 Launch | $72.80 | $5.00 |
| $6,000 Grow | $174.30 | $5.00 |
| $12,000 build | $348.30 | $5.00 |
| $99 monthly plan | $3.17 | $0.79 |

On twenty builds a year averaging $6,000, that's roughly **$3,400 of pure margin**
you keep by defaulting to bank transfer. Card is still worth offering for the small
recurring charges, where the fee is trivial and instant settlement is nicer.

---

## Step 2 — Products and prices

Every client is on a plan scoped to their own site, so there is no public price list
to model. Two ways to handle that in Stripe:

**Option A — one product, custom prices (recommended).** Create a single product
called *Monthly Plan*, then add a separate recurring price per client at whatever you
agreed. Stripe allows unlimited prices under one product. Your dashboard stays tidy
and reporting rolls up cleanly.

**Option B — a product per client.** Only worth it if plans differ enough that you
want them reported separately.

Either way, create the subscription **for** the client rather than sending them to a
signup page:

**Customers → select the client → Actions → Create subscription.** Choose the price,
set the billing date, and Stripe emails them a secure link to enter payment details.
They never see a price they did not agree to.

Consider offering an annual option at ten months' cost. Annual prepay collapses churn
and puts the cash up front — the single biggest improvement available to agency cash
flow.

## Step 4 — Invoicing for project work

Don't use Payment Links for builds. Use **Invoicing**, so each client gets a real
numbered invoice their bookkeeper can file.

**Customers → Add customer** once per client, then **Invoices → Create invoice**.

Recommended structure for a $6,000 Grow build:

| Invoice | Amount | When |
|---|---|---|
| Deposit | $3,000 | On signature, before work starts |
| Balance | $3,000 | On launch, before DNS cutover |

For anything over ~$10,000, split into three or four milestones instead. Getting
paid at milestones rather than at the end is what keeps a small studio solvent.

**Invoice settings worth changing** (Settings → Billing → Invoices):
- Default payment methods: **ACH first**, card second
- Payment terms: due on receipt, or net 7
- Turn on automatic reminders: 3 days before due, on the due date, 3 and 7 days after
- Add your logo and brand colour (`#16233B` deep, `#C15F3C` coral)
- Enable **Stripe hosted invoice page** so the client gets a pay button, not a PDF

You never need a "pay an invoice" form on the site — the invoice email carries its
own secure link. That's why `pay.html` sends people to a *resend* form instead of
asking them to type an invoice number, which would require a backend to look up.

---

## Step 5 — Customer Portal (the "manage my plan" link)

This is the piece most agencies miss. It's free and it removes almost all billing
admin from your inbox.

**Settings → Billing → Customer portal:**

- Turn on: update payment method, view invoice history, update billing address
- Turn on: **cancel subscription** — let them. A forced phone call to cancel buys you
  a month and costs you a referral.
- Turn on: **switch plan**, and select which plans can move to which
- Set cancellation to **at period end**, not immediately
- Under **Login page**, enable it and copy the `https://billing.stripe.com/p/login/...`
  URL

Paste that into `pay.html` replacing `REPLACE_PORTAL_LINK`.

Clients enter their email, Stripe emails a magic link, and they land in a dashboard
where they can update a card or download two years of receipts without asking you.

---

## Step 6 — Failed payment recovery

Recurring revenue dies quietly from expired cards, not from cancellations.

**Settings → Billing → Subscriptions and emails → Manage failed payments:**

- **Smart Retries**: on. Stripe picks retry timing from its own success data.
- Retry schedule: 4 attempts over ~2 weeks
- After final retry: **leave the subscription unpaid** and email you, rather than
  cancelling automatically. You want a conversation, not a silent churn.
- Turn on **card expiry reminders** and **automatic card updater** (free, updates
  card numbers when banks reissue them)

Also enable, under emails: successful payment receipts, failed payment notices, and
upcoming invoice notices for annual plans.

---

## Step 7 — Wire the forms and go live

1. Create a Formspree form for the invoice-resend request. Replace
   `REPLACE_FORM_ID` in `pay.html`.
2. Switch Stripe out of test mode and **regenerate the portal link in live mode** —
   test-mode links do not work in production and this is the most common launch bug.
3. Submit a real $1 invoice to yourself and pay it by ACH. Confirm the receipt, the
   portal login, and the payout.
4. Add `/pay` to `sitemap.xml`.

---

## Ongoing operations

**Monthly:** check Stripe's Billing dashboard for failed payments and involuntary
churn. Anything unpaid past the retry window gets a personal email, not an automated
one.

**Watch MRR, not revenue.** Twenty clients at $99 is $23,760 a year that arrives
whether or not you sell a single build. That number is what makes the business
stable, and it's the one to grow deliberately — every launch should end with a plan
conversation, not an invoice and a goodbye.

**Put the monthly plan in the build proposal**, not after launch. Included months
followed by a stated monthly figure converts far better than raising it six months
later — and the subscription should be created on day one with a trial period, so it
converts by itself.

---

## Legal — do this before taking money

- **Terms of Service** and a **Master Services Agreement** covering scope, revisions,
  payment terms, late fees, IP ownership at final payment, and what happens to
  hosting if a client stops paying.
- **Monthly plan terms**: what's included at each client's agreed level, response
  times, what counts as a "small content change", and notice period.
- **Refund policy**, stated plainly.
- **Privacy policy** covering Stripe as a processor.
- Confirm **sales tax** treatment. Florida generally does not tax custom website
  development services, but hosting and prewritten software can be treated
  differently. Ask a Florida CPA before your first invoice rather than after your
  twentieth — this is the one item here worth paying for advice on.

---

## Placeholders in `pay.html`

Search for `REPLACE_` to find all of them:

| Placeholder | Where it comes from |
|---|---|
| `REPLACE_PORTAL_LINK` | Step 5 — Customer portal login page |
| `REPLACE_FORM_ID` | Step 7 — Formspree endpoint |

Also still placeholder from the original build: the phone number
`(561) 555-0100`. The email (`hello@designofman.com`) and domain
(`designofman.com`) are final.
