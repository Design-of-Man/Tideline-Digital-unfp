-- =====================================================================
-- Migration 0002: Domain tables
-- Business objects that POST into the ledger: contacts, invoices,
-- payments, expenses, recurring expenses, employees, payroll,
-- distributions, employee expense reimbursements, tax payments.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tax categories (IRS deduction lines — drives the write-off reports)
-- ---------------------------------------------------------------------
create table tax_categories (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,          -- machine key, e.g. 'meals'
  name          text not null,                 -- 'Meals (50%)'
  form_line     text,                           -- '1120-S line 19', 'Sch. C 24b', etc.
  default_deductible_pct numeric(5,2) not null default 100,
  notes         text,
  sort_order    int not null default 0
);
comment on table tax_categories is 'IRS deductible expense categories for write-off reporting.';

-- Now that tax_categories exists, wire up the FK from accounts.
alter table accounts
  add constraint accounts_tax_category_fk
  foreign key (tax_category_id) references tax_categories(id) on delete set null;

-- ---------------------------------------------------------------------
-- Company settings (single row)
-- ---------------------------------------------------------------------
create table company_settings (
  id            int primary key default 1,
  legal_name    text not null default 'Design of Man LLC',
  dba_name      text,
  ein           text,
  entity_type   text not null default 's_corp',
  tax_state     text default 'US',
  fiscal_year_start_month int not null default 1,
  address       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint company_singleton check (id = 1)
);
create trigger trg_company_updated before update on company_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Contacts (customers & vendors)
-- ---------------------------------------------------------------------
create type contact_type as enum ('customer', 'vendor', 'both');

create table contacts (
  id            uuid primary key default gen_random_uuid(),
  type          contact_type not null default 'customer',
  name          text not null,
  email         text,
  phone         text,
  address       text,
  tax_id        text,                          -- EIN/SSN for 1099s
  is_1099       boolean not null default false, -- contractor to 1099 at year end
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_contacts_updated before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Invoices & incoming payments (Accounts Receivable)
-- ---------------------------------------------------------------------
create type invoice_status as enum ('draft', 'open', 'partial', 'paid', 'void');

create table invoices (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid references contacts(id) on delete restrict,
  number        text unique,
  issue_date    date not null default current_date,
  due_date      date,
  status        invoice_status not null default 'draft',
  memo          text,
  terms         text,
  subtotal      numeric(14,2) not null default 0,
  total         numeric(14,2) not null default 0,
  amount_paid   numeric(14,2) not null default 0,
  ar_account_id uuid references accounts(id),
  journal_entry_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on invoices (contact_id);
create index on invoices (status);
create trigger trg_invoices_updated before update on invoices
  for each row execute function set_updated_at();

create table invoice_lines (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  description   text,
  quantity      numeric(14,4) not null default 1,
  unit_price    numeric(14,2) not null default 0,
  amount        numeric(14,2) not null default 0,
  income_account_id uuid references accounts(id),
  line_no       int not null default 0
);
create index on invoice_lines (invoice_id);

create type payment_method as enum ('bank_transfer','check','card','cash','ach','wire','paypal','stripe','other');

create table payments_received (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid references contacts(id) on delete restrict,
  invoice_id    uuid references invoices(id) on delete set null,
  payment_date  date not null default current_date,
  amount        numeric(14,2) not null,
  method        payment_method not null default 'bank_transfer',
  reference     text,
  memo          text,
  deposit_account_id uuid references accounts(id),   -- bank the money landed in
  income_account_id  uuid references accounts(id),   -- used when not tied to an invoice
  journal_entry_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint payment_amount_pos check (amount > 0)
);
create index on payments_received (invoice_id);
create index on payments_received (payment_date);
create trigger trg_payments_updated before update on payments_received
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Expenses & recurring expenses (Accounts Payable / cash out)
-- ---------------------------------------------------------------------
create type expense_status as enum ('unpaid', 'paid');
create type recurrence_frequency as enum
  ('weekly','biweekly','semimonthly','monthly','quarterly','semiannually','annually');

create table recurring_expenses (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid references contacts(id) on delete set null,
  name          text not null,
  amount        numeric(14,2) not null,
  category_account_id  uuid not null references accounts(id),
  paid_from_account_id uuid not null references accounts(id),
  frequency     recurrence_frequency not null default 'monthly',
  interval_count int not null default 1,
  start_date    date not null default current_date,
  next_run_date date not null default current_date,
  end_date      date,
  tax_category_id uuid references tax_categories(id) on delete set null,
  deductible_pct numeric(5,2) not null default 100,
  auto_post     boolean not null default false,  -- create expenses automatically when due
  is_active     boolean not null default true,
  memo          text,
  last_run_date date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint recurring_amount_pos check (amount > 0)
);
create trigger trg_recurring_updated before update on recurring_expenses
  for each row execute function set_updated_at();

create table expenses (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid references contacts(id) on delete set null,
  expense_date  date not null default current_date,
  amount        numeric(14,2) not null,
  category_account_id  uuid not null references accounts(id),  -- what it was spent on
  paid_from_account_id uuid not null references accounts(id),  -- bank / credit card / A/P
  status        expense_status not null default 'paid',
  reference     text,
  memo          text,
  receipt_url   text,
  tax_category_id uuid references tax_categories(id) on delete set null,
  deductible_pct numeric(5,2) not null default 100,
  recurring_id  uuid references recurring_expenses(id) on delete set null,
  journal_entry_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint expense_amount_pos check (amount > 0)
);
create index on expenses (expense_date);
create index on expenses (category_account_id);
create index on expenses (vendor_id);
create trigger trg_expenses_updated before update on expenses
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Employees (the two shareholder-employees + any future hires)
-- ---------------------------------------------------------------------
create type pay_frequency as enum ('weekly','biweekly','semimonthly','monthly','quarterly','annually');

create table employees (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  email         text,
  title         text,
  is_owner      boolean not null default false,
  is_shareholder boolean not null default false,
  ownership_pct numeric(5,2) default 0,
  annual_salary numeric(14,2) default 0,
  pay_frequency pay_frequency not null default 'monthly',
  equity_account_id uuid references accounts(id),  -- this shareholder's distributions/equity acct
  is_active     boolean not null default true,
  hired_on      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_employees_updated before update on employees
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Payroll runs (reasonable-salary W-2 pay for the owners)
-- ---------------------------------------------------------------------
create table payroll_runs (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references employees(id) on delete restrict,
  pay_date      date not null default current_date,
  period_start  date,
  period_end    date,
  gross_pay     numeric(14,2) not null default 0,
  -- Employee-side withholdings (reduce net pay, become payroll liabilities)
  employee_fica       numeric(14,2) not null default 0,
  federal_withholding numeric(14,2) not null default 0,
  state_withholding   numeric(14,2) not null default 0,
  other_withholding   numeric(14,2) not null default 0,
  -- Employer-side taxes (a company expense + a liability)
  employer_fica numeric(14,2) not null default 0,
  futa          numeric(14,2) not null default 0,
  suta          numeric(14,2) not null default 0,
  net_pay       numeric(14,2) not null default 0,
  pay_from_account_id          uuid references accounts(id),
  salary_expense_account_id    uuid references accounts(id),
  payroll_tax_expense_account_id uuid references accounts(id),
  payroll_liability_account_id uuid references accounts(id),
  memo          text,
  journal_entry_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on payroll_runs (employee_id);
create index on payroll_runs (pay_date);
create trigger trg_payroll_updated before update on payroll_runs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Shareholder distributions (equity draws, NOT payroll)
-- ---------------------------------------------------------------------
create table distributions (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references employees(id) on delete restrict,
  distribution_date date not null default current_date,
  amount        numeric(14,2) not null,
  pay_from_account_id uuid references accounts(id),
  equity_account_id   uuid references accounts(id),
  memo          text,
  reference     text,
  journal_entry_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint distribution_amount_pos check (amount > 0)
);
create index on distributions (employee_id);
create trigger trg_distributions_updated before update on distributions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Employee expense reimbursements
-- ---------------------------------------------------------------------
create type emp_expense_status as enum ('submitted','approved','reimbursed','rejected');

create table employee_expenses (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references employees(id) on delete restrict,
  expense_date  date not null default current_date,
  amount        numeric(14,2) not null,
  description   text,
  category_account_id uuid not null references accounts(id),
  tax_category_id uuid references tax_categories(id) on delete set null,
  deductible_pct numeric(5,2) not null default 100,
  receipt_url   text,
  status        emp_expense_status not null default 'submitted',
  reimbursable  boolean not null default true,
  liability_account_id uuid references accounts(id),  -- Employee Reimbursements Payable
  pay_from_account_id  uuid references accounts(id),
  reimbursed_on date,
  journal_entry_accrual_id uuid references journal_entries(id) on delete set null,
  journal_entry_payment_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint emp_expense_amount_pos check (amount > 0)
);
create index on employee_expenses (employee_id);
create index on employee_expenses (status);
create trigger trg_emp_expenses_updated before update on employee_expenses
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Tax payments (payroll tax deposits, state franchise/excise, estimates)
-- ---------------------------------------------------------------------
create type tax_payment_type as enum (
  'federal_income_est','state_income_est','payroll_941','payroll_940',
  'state_payroll','state_franchise','sales_tax','property_tax','other'
);

create table tax_payments (
  id            uuid primary key default gen_random_uuid(),
  tax_type      tax_payment_type not null default 'other',
  period_label  text,                       -- e.g. 'Q3 2026'
  payment_date  date not null default current_date,
  amount        numeric(14,2) not null,
  pay_from_account_id uuid references accounts(id),
  tax_account_id uuid references accounts(id),  -- liability to settle OR tax expense
  reference     text,
  memo          text,
  journal_entry_id uuid references journal_entries(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint tax_amount_pos check (amount > 0)
);
create index on tax_payments (payment_date);
create trigger trg_tax_payments_updated before update on tax_payments
  for each row execute function set_updated_at();
