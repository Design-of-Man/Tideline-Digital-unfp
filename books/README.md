# Design of Man — Books

A double-entry accounting system for **Design of Man LLC** (a 2-owner LLC taxed
as an S-Corp). Built with Next.js (App Router) + Supabase (Postgres + Auth).

## What it does

- **Income & invoices** — record incoming payments or invoice customers and mark them paid.
- **Expenses** — categorized business spending with tax write-off tracking.
- **Recurring expenses** — templates for rent/software/etc.; post on demand or auto-generate.
- **Payroll** — W-2 salary runs for the shareholder-employees (gross, withholdings, employer taxes, net).
- **Distributions** — shareholder profit draws booked against equity (not payroll).
- **Employee expenses** — submit → approve (accrue) → reimburse.
- **Taxes** — payroll deposits, state franchise/excise, sales tax, estimated payments.
- **Reports** — Profit & Loss, Balance Sheet, Trial Balance, and a Tax Write-off summary.

Everything posts to a **true double-entry ledger**: every transaction is a balanced
journal entry (a Postgres trigger rejects anything that doesn't balance), and all
reports are computed from the ledger.

## Tech

- Next.js 15 (App Router, Server Actions), TypeScript, Tailwind CSS v4
- Supabase: Postgres, Row Level Security, and Auth (email/password)
- SQL schema lives in `supabase/migrations/`

## Local development

```bash
cd books
cp .env.example .env.local     # fill in your Supabase URL + publishable/anon key
npm install
npm run dev
```

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (or anon) key |

## First login

This is a single-company internal tool. Any authenticated user has full access,
so **restrict who can sign up**:

1. In Supabase → **Authentication → Users**, create accounts for the two owners
   (or use the "Create an account" link on the login page).
2. In Supabase → **Authentication → Providers → Email**, you can turn off
   "Confirm email" for instant access, and disable open sign-ups once both
   owners have accounts.

## Recurring automation (optional)

`generate_due_recurring_expenses()` posts any auto-post recurring expenses that
are due. Schedule it daily with Supabase's pg_cron, or click **Generate all due**
on the Recurring page.

## Deploy to Vercel

Import this repo in Vercel, set **Root Directory** to `books`, add the two env
vars above, and deploy. (Framework preset: Next.js — auto-detected.)
