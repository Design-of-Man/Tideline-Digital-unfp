-- =====================================================================
-- Migration 0005: Pin function search_path (clears linter warnings)
-- =====================================================================
alter function account_normal_side(account_type)                 set search_path = public;
alter function assert_entry_balanced()                           set search_path = public;
alter function set_updated_at()                                  set search_path = public;
alter function create_journal_entry(date, text, jsonb, entry_source, uuid, text) set search_path = public;
alter function f_account_balances(date)                          set search_path = public;
alter function f_pnl(date, date)                                 set search_path = public;
alter function f_deductions(date, date)                          set search_path = public;
alter function add_frequency(date, recurrence_frequency, int)    set search_path = public;
alter function generate_due_recurring_expenses(date)             set search_path = public;
