-- =====================================================================
-- Design of Man — Books
-- Migration 0001: Core double-entry ledger
-- =====================================================================
-- A proper double-entry system: every financial event becomes a
-- balanced journal entry (sum of debits = sum of credits). All domain
-- tables (invoices, expenses, payroll, etc.) post INTO this ledger, and
-- all reports (P&L, Balance Sheet) are computed FROM it.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense');

-- Finer classification, used for grouping on reports.
create type account_subtype as enum (
  'bank', 'accounts_receivable', 'other_current_asset', 'fixed_asset', 'other_asset',
  'accounts_payable', 'credit_card', 'payroll_liability', 'tax_liability',
  'other_current_liability', 'long_term_liability',
  'equity', 'retained_earnings', 'distributions', 'contributions',
  'income', 'other_income',
  'cogs', 'operating_expense', 'payroll_expense', 'tax_expense', 'other_expense'
);

create type entry_source as enum (
  'manual', 'opening_balance', 'transfer',
  'invoice', 'payment_received',
  'expense', 'recurring_expense',
  'payroll', 'distribution', 'employee_expense', 'tax_payment'
);

-- ---------------------------------------------------------------------
-- Chart of accounts
-- ---------------------------------------------------------------------
create table accounts (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,               -- e.g. '1000'
  name            text not null,
  type            account_type not null,
  subtype         account_subtype not null,
  parent_id       uuid references accounts(id) on delete set null,
  description     text,
  -- Tax metadata (drives the write-off / deduction reports)
  is_tax_deductible boolean not null default false,   -- expense flows to a deductible line
  tax_category_id uuid,                                -- FK added in migration 0002
  deductible_pct  numeric(5,2) not null default 100,  -- e.g. 50 for meals
  is_active       boolean not null default true,
  is_system       boolean not null default false,     -- protected core accounts (AR/AP/RE...)
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint deductible_pct_range check (deductible_pct >= 0 and deductible_pct <= 100)
);

comment on table accounts is 'Chart of accounts. Every ledger line references one account.';

-- The "normal balance" side of an account. Assets & expenses increase
-- with debits; liabilities, equity & revenue increase with credits.
create or replace function account_normal_side(p_type account_type)
returns text language sql immutable as $$
  select case when p_type in ('asset','expense') then 'debit' else 'credit' end;
$$;

-- ---------------------------------------------------------------------
-- Journal entries (the "transaction" header)
-- ---------------------------------------------------------------------
create table journal_entries (
  id           uuid primary key default gen_random_uuid(),
  entry_date   date not null,
  memo         text,
  reference    text,                        -- external ref / check no.
  source       entry_source not null default 'manual',
  source_id    uuid,                        -- id of the originating domain row
  is_posted    boolean not null default true,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on journal_entries (entry_date);
create index on journal_entries (source, source_id);

-- ---------------------------------------------------------------------
-- Journal lines (the debits & credits)
-- ---------------------------------------------------------------------
create table journal_lines (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references journal_entries(id) on delete cascade,
  account_id  uuid not null references accounts(id) on delete restrict,
  debit       numeric(14,2) not null default 0,
  credit      numeric(14,2) not null default 0,
  memo        text,
  line_no     int not null default 0,
  constraint line_amounts_valid check (
    debit >= 0 and credit >= 0        -- no negatives
    and (debit = 0 or credit = 0)     -- a line is either a debit or a credit
    and (debit + credit) > 0          -- but never zero
  )
);
create index on journal_lines (entry_id);
create index on journal_lines (account_id);

-- ---------------------------------------------------------------------
-- Balance enforcement: every entry must have >= 2 lines and net to zero.
-- Deferred so multi-statement inserts within one transaction are allowed.
-- ---------------------------------------------------------------------
create or replace function assert_entry_balanced()
returns trigger language plpgsql as $$
declare
  v_entry uuid := coalesce(new.entry_id, old.entry_id);
  v_diff  numeric;
  v_count int;
begin
  -- If the parent entry is gone (entry deleted, lines cascaded), nothing to check.
  if not exists (select 1 from journal_entries where id = v_entry) then
    return null;
  end if;
  select coalesce(sum(debit),0) - coalesce(sum(credit),0), count(*)
    into v_diff, v_count
    from journal_lines where entry_id = v_entry;
  if v_count < 2 then
    raise exception 'Journal entry % must have at least two lines', v_entry;
  end if;
  if v_diff <> 0 then
    raise exception 'Journal entry % is unbalanced (debits - credits = %)', v_entry, v_diff;
  end if;
  return null;
end;
$$;

create constraint trigger trg_entry_balanced
  after insert or update or delete on journal_lines
  deferrable initially deferred
  for each row execute function assert_entry_balanced();

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_accounts_updated before update on accounts
  for each row execute function set_updated_at();
create trigger trg_journal_entries_updated before update on journal_entries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- create_journal_entry(): the single trusted way to post to the ledger.
-- Accepts a JSON array of lines: [{account_id, debit, credit, memo}, ...]
-- Validates & inserts atomically; the balance trigger is the safety net.
-- ---------------------------------------------------------------------
create or replace function create_journal_entry(
  p_date     date,
  p_memo     text,
  p_lines    jsonb,
  p_source   entry_source default 'manual',
  p_source_id uuid default null,
  p_reference text default null
) returns uuid
language plpgsql security invoker as $$
declare
  v_entry_id uuid;
  v_line     jsonb;
  v_i        int := 0;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'A journal entry requires at least two lines';
  end if;

  insert into journal_entries (entry_date, memo, source, source_id, reference, created_by)
  values (p_date, p_memo, p_source, p_source_id, p_reference, auth.uid())
  returning id into v_entry_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into journal_lines (entry_id, account_id, debit, credit, memo, line_no)
    values (
      v_entry_id,
      (v_line->>'account_id')::uuid,
      coalesce((v_line->>'debit')::numeric, 0),
      coalesce((v_line->>'credit')::numeric, 0),
      v_line->>'memo',
      v_i
    );
    v_i := v_i + 1;
  end loop;

  return v_entry_id;
end;
$$;
