-- =====================================================================
-- Migration 0004: Seed data + recurring automation
-- S-Corp chart of accounts, IRS tax categories, company settings,
-- the two shareholder-employees, and the recurring-expense generator.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tax categories (Form 1120-S / common deductible lines)
-- ---------------------------------------------------------------------
insert into tax_categories (code, name, form_line, default_deductible_pct, sort_order) values
  ('officer_comp',       'Compensation of Officers',      '1120-S Line 7',  100, 10),
  ('wages',              'Salaries & Wages',              '1120-S Line 8',  100, 20),
  ('repairs',            'Repairs & Maintenance',         '1120-S Line 9',  100, 30),
  ('bad_debts',          'Bad Debts',                     '1120-S Line 10', 100, 40),
  ('rent',               'Rents',                         '1120-S Line 11', 100, 50),
  ('taxes_licenses',     'Taxes & Licenses',              '1120-S Line 12', 100, 60),
  ('interest',           'Interest',                      '1120-S Line 13', 100, 70),
  ('depreciation',       'Depreciation',                  '1120-S Line 14', 100, 80),
  ('advertising',        'Advertising',                   '1120-S Line 16', 100, 90),
  ('benefits',           'Employee Benefit Programs',     '1120-S Line 18', 100, 100),
  ('contract_labor',     'Contract Labor (1099)',         '1120-S Line 19', 100, 110),
  ('legal_professional', 'Legal & Professional',          '1120-S Line 19', 100, 120),
  ('office',             'Office Expense',                '1120-S Line 19', 100, 130),
  ('supplies',           'Supplies',                      '1120-S Line 19', 100, 140),
  ('utilities',          'Utilities',                     '1120-S Line 19', 100, 150),
  ('travel',             'Travel',                        '1120-S Line 19', 100, 160),
  ('meals',              'Meals (50%)',                   '1120-S Line 19',  50, 170),
  ('car_truck',          'Car & Truck Expenses',          '1120-S Line 19', 100, 180),
  ('dues_subscriptions', 'Dues & Subscriptions',          '1120-S Line 19', 100, 190),
  ('bank_fees',          'Bank & Merchant Fees',          '1120-S Line 19', 100, 200),
  ('education',          'Education & Training',           '1120-S Line 19', 100, 210),
  ('other',              'Other Deductions',              '1120-S Line 19', 100, 220);

-- ---------------------------------------------------------------------
-- Chart of accounts
-- ---------------------------------------------------------------------
insert into accounts (code, name, type, subtype, is_tax_deductible, deductible_pct, is_system, sort_order) values
  -- Assets
  ('1010','Business Checking',            'asset','bank',                 false,100,false,1010),
  ('1020','Business Savings',             'asset','bank',                 false,100,false,1020),
  ('1050','Cash on Hand',                 'asset','bank',                 false,100,false,1050),
  ('1200','Accounts Receivable',          'asset','accounts_receivable',  false,100,true, 1200),
  ('1400','Prepaid Expenses',             'asset','other_current_asset',  false,100,false,1400),
  ('1500','Computers & Equipment',        'asset','fixed_asset',          false,100,false,1500),
  ('1550','Accumulated Depreciation',     'asset','fixed_asset',          false,100,false,1550),
  -- Liabilities
  ('2000','Accounts Payable',             'liability','accounts_payable',      false,100,true, 2000),
  ('2050','Business Credit Card',         'liability','credit_card',           false,100,false,2050),
  ('2100','Payroll Liabilities',          'liability','payroll_liability',     false,100,true, 2100),
  ('2110','Federal Payroll Taxes Payable','liability','payroll_liability',     false,100,false,2110),
  ('2120','State Payroll Taxes Payable',  'liability','payroll_liability',     false,100,false,2120),
  ('2200','Employee Reimbursements Payable','liability','other_current_liability',false,100,true,2200),
  ('2300','Sales Tax Payable',            'liability','tax_liability',         false,100,false,2300),
  ('2400','State Franchise/Income Tax Payable','liability','tax_liability',    false,100,false,2400),
  -- Equity
  ('3000','Contributed Capital',          'equity','contributions',      false,100,false,3000),
  ('3100','Retained Earnings',            'equity','retained_earnings',   false,100,true, 3100),
  ('3200','Shareholder 1 - Distributions','equity','distributions',      false,100,false,3200),
  ('3210','Shareholder 1 - Contributions','equity','contributions',      false,100,false,3210),
  ('3300','Shareholder 2 - Distributions','equity','distributions',      false,100,false,3300),
  ('3310','Shareholder 2 - Contributions','equity','contributions',      false,100,false,3310),
  -- Revenue
  ('4000','Design Services Income',       'revenue','income',            false,100,false,4000),
  ('4010','Web Development Income',        'revenue','income',            false,100,false,4010),
  ('4020','Consulting Income',            'revenue','income',            false,100,false,4020),
  ('4900','Other Income',                 'revenue','other_income',       false,100,false,4900),
  -- Cost of services
  ('5000','Cost of Services',             'expense','cogs',              true, 100,false,5000),
  -- Operating expenses
  ('6000','Advertising & Marketing',      'expense','operating_expense', true, 100,false,6000),
  ('6010','Software & Subscriptions',     'expense','operating_expense', true, 100,false,6010),
  ('6020','Office Supplies',              'expense','operating_expense', true, 100,false,6020),
  ('6030','Office Expense',               'expense','operating_expense', true, 100,false,6030),
  ('6040','Rent',                         'expense','operating_expense', true, 100,false,6040),
  ('6050','Utilities',                    'expense','operating_expense', true, 100,false,6050),
  ('6055','Telephone & Internet',         'expense','operating_expense', true, 100,false,6055),
  ('6060','Insurance',                    'expense','operating_expense', true, 100,false,6060),
  ('6070','Legal & Professional Fees',    'expense','operating_expense', true, 100,false,6070),
  ('6080','Bank & Merchant Fees',         'expense','operating_expense', true, 100,false,6080),
  ('6090','Travel',                       'expense','operating_expense', true, 100,false,6090),
  ('6100','Meals',                        'expense','operating_expense', true,  50,false,6100),
  ('6110','Vehicle & Mileage',            'expense','operating_expense', true, 100,false,6110),
  ('6120','Dues & Subscriptions',         'expense','operating_expense', true, 100,false,6120),
  ('6130','Continuing Education',         'expense','operating_expense', true, 100,false,6130),
  ('6140','Repairs & Maintenance',        'expense','operating_expense', true, 100,false,6140),
  ('6200','Contract Labor (1099)',        'expense','operating_expense', true, 100,false,6200),
  -- Payroll-related expenses
  ('6300','Officer Compensation',         'expense','payroll_expense',   true, 100,false,6300),
  ('6310','Payroll Tax Expense',          'expense','payroll_expense',   true, 100,false,6310),
  ('6320','Employee Benefits',            'expense','payroll_expense',   true, 100,false,6320),
  ('6330','Owner Health Insurance',       'expense','payroll_expense',   true, 100,false,6330),
  -- Taxes & other
  ('6400','Taxes & Licenses',             'expense','tax_expense',       true, 100,false,6400),
  ('6500','Depreciation Expense',         'expense','operating_expense', true, 100,false,6500),
  ('6910','Business Gifts',               'expense','operating_expense', true, 100,false,6910),
  ('6900','Other Expense',                'expense','other_expense',     true, 100,false,6900);

-- Map expense accounts to their default tax category + deductible pct.
update accounts a
set tax_category_id = tc.id
from (values
  ('5000','contract_labor'),
  ('6000','advertising'),('6010','dues_subscriptions'),('6020','supplies'),
  ('6030','office'),('6040','rent'),('6050','utilities'),('6055','utilities'),
  ('6060','insurance'),('6070','legal_professional'),('6080','bank_fees'),
  ('6090','travel'),('6100','meals'),('6110','car_truck'),('6120','dues_subscriptions'),
  ('6130','education'),('6140','repairs'),('6200','contract_labor'),
  ('6300','officer_comp'),('6310','taxes_licenses'),('6320','benefits'),('6330','benefits'),
  ('6400','taxes_licenses'),('6500','depreciation'),('6910','other'),('6900','other')
) as m(code, cat)
join tax_categories tc on tc.code = m.cat
where a.code = m.code;

-- ---------------------------------------------------------------------
-- Company settings
-- ---------------------------------------------------------------------
insert into company_settings (id, legal_name, dba_name, entity_type, tax_state, fiscal_year_start_month)
values (1, 'Design of Man LLC', 'Design of Man', 's_corp', 'US', 1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Shareholder-employees (rename in the app). 50/50 owners.
-- ---------------------------------------------------------------------
insert into employees (first_name, last_name, title, is_owner, is_shareholder, ownership_pct, pay_frequency, equity_account_id)
select 'Shareholder','One','Owner',true,true,50,'monthly', (select id from accounts where code='3200');
insert into employees (first_name, last_name, title, is_owner, is_shareholder, ownership_pct, pay_frequency, equity_account_id)
select 'Shareholder','Two','Owner',true,true,50,'monthly', (select id from accounts where code='3300');

-- ---------------------------------------------------------------------
-- Recurring expense automation
-- ---------------------------------------------------------------------
create or replace function add_frequency(p_date date, p_freq recurrence_frequency, p_n int)
returns date language sql immutable as $$
  select case p_freq
    when 'weekly'       then p_date + (7 * p_n)
    when 'biweekly'     then p_date + (14 * p_n)
    when 'semimonthly'  then p_date + (15 * p_n)
    when 'monthly'      then (p_date + (p_n || ' month')::interval)::date
    when 'quarterly'    then (p_date + (3 * p_n || ' month')::interval)::date
    when 'semiannually' then (p_date + (6 * p_n || ' month')::interval)::date
    when 'annually'     then (p_date + (p_n || ' year')::interval)::date
  end;
$$;

-- Generates (and posts) expense records for every active, auto-post
-- recurring template whose next_run_date has arrived. Safe to run daily.
create or replace function generate_due_recurring_expenses(p_through date default current_date)
returns int language plpgsql as $$
declare
  r      record;
  v_next date;
  v_exp  uuid;
  v_je   uuid;
  v_count int := 0;
begin
  for r in
    select * from recurring_expenses
    where is_active and auto_post and next_run_date <= p_through
  loop
    v_next := r.next_run_date;
    while v_next <= p_through and (r.end_date is null or v_next <= r.end_date) loop
      insert into expenses (
        vendor_id, expense_date, amount, category_account_id, paid_from_account_id,
        status, memo, tax_category_id, deductible_pct, recurring_id)
      values (
        r.vendor_id, v_next, r.amount, r.category_account_id, r.paid_from_account_id,
        'paid', coalesce(r.memo, r.name), r.tax_category_id, r.deductible_pct, r.id)
      returning id into v_exp;

      v_je := create_journal_entry(
        v_next,
        coalesce(r.memo, r.name),
        jsonb_build_array(
          jsonb_build_object('account_id', r.category_account_id,  'debit', r.amount, 'credit', 0),
          jsonb_build_object('account_id', r.paid_from_account_id, 'debit', 0, 'credit', r.amount)
        ),
        'recurring_expense', v_exp, r.name);

      update expenses set journal_entry_id = v_je where id = v_exp;
      v_count := v_count + 1;
      v_next  := add_frequency(v_next, r.frequency, r.interval_count);
    end loop;
    update recurring_expenses
      set next_run_date = v_next, last_run_date = p_through
      where id = r.id;
  end loop;
  return v_count;
end;
$$;
