-- =====================================================================
-- Migration 0003: Reporting functions + Row Level Security
-- =====================================================================

-- ---------------------------------------------------------------------
-- Account balances as of a date (powers Balance Sheet & Trial Balance).
-- Balance is returned in the account's natural direction (positive =
-- normal balance): assets/expenses by debits, everything else by credits.
-- ---------------------------------------------------------------------
create or replace function f_account_balances(p_as_of date)
returns table(
  account_id uuid, code text, name text,
  type account_type, subtype account_subtype,
  debit numeric, credit numeric, balance numeric
) language sql stable as $$
  select a.id, a.code, a.name, a.type, a.subtype,
    coalesce(m.debit,0) as debit,
    coalesce(m.credit,0) as credit,
    case when a.type in ('asset','expense')
         then coalesce(m.debit,0) - coalesce(m.credit,0)
         else coalesce(m.credit,0) - coalesce(m.debit,0) end as balance
  from accounts a
  left join (
    select l.account_id, sum(l.debit) as debit, sum(l.credit) as credit
    from journal_lines l
    join journal_entries e on e.id = l.entry_id
    where e.entry_date <= p_as_of
    group by l.account_id
  ) m on m.account_id = a.id
  order by a.code;
$$;

-- ---------------------------------------------------------------------
-- Profit & Loss for a date range. amount is natural-positive:
-- revenue = credits - debits, expense = debits - credits.
-- ---------------------------------------------------------------------
create or replace function f_pnl(p_start date, p_end date)
returns table(
  account_id uuid, code text, name text,
  type account_type, subtype account_subtype, amount numeric
) language sql stable as $$
  select a.id, a.code, a.name, a.type, a.subtype,
    case when a.type = 'revenue'
         then coalesce(m.credit,0) - coalesce(m.debit,0)
         else coalesce(m.debit,0) - coalesce(m.credit,0) end as amount
  from accounts a
  join (
    select l.account_id, sum(l.debit) as debit, sum(l.credit) as credit
    from journal_lines l
    join journal_entries e on e.id = l.entry_id
    where e.entry_date between p_start and p_end
    group by l.account_id
  ) m on m.account_id = a.id
  where a.type in ('revenue','expense')
  order by a.code;
$$;

-- ---------------------------------------------------------------------
-- Tax deduction / write-off summary for a date range.
-- Aggregates deductible amounts from expenses and reimbursed employee
-- expenses, grouped by tax category (null category => "Uncategorized").
-- ---------------------------------------------------------------------
create or replace function f_deductions(p_start date, p_end date)
returns table(
  tax_category_id uuid, category_code text, category_name text,
  form_line text, total_amount numeric, deductible_amount numeric
) language sql stable as $$
  with items as (
    select e.tax_category_id, e.amount, e.deductible_pct
    from expenses e
    where e.expense_date between p_start and p_end
    union all
    select ee.tax_category_id, ee.amount, ee.deductible_pct
    from employee_expenses ee
    where ee.expense_date between p_start and p_end
      and ee.status in ('approved','reimbursed')
  )
  select i.tax_category_id, tc.code, tc.name, tc.form_line,
         sum(i.amount) as total_amount,
         sum(round(i.amount * i.deductible_pct / 100.0, 2)) as deductible_amount
  from items i
  left join tax_categories tc on tc.id = i.tax_category_id
  group by i.tax_category_id, tc.code, tc.name, tc.form_line, tc.sort_order
  order by tc.sort_order nulls last, tc.name nulls last;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security: this is a single-company internal tool, so any
-- authenticated user (the owners) has full access; anon has none.
-- Restrict who can sign up via Supabase Auth settings.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'accounts','journal_entries','journal_lines','tax_categories','company_settings',
    'contacts','invoices','invoice_lines','payments_received','recurring_expenses',
    'expenses','employees','payroll_runs','distributions','employee_expenses','tax_payments'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists app_all on %I', t);
    execute format(
      'create policy app_all on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
