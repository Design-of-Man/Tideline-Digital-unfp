// Formatting helpers shared across the app.

export function money(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return (v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// Money without the $ sign, for right-aligned report columns.
export function amt(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return (v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function shortDate(d: string | null | undefined): string {
  if (!d) return "—";
  // d is an ISO date (yyyy-mm-dd); avoid TZ shifts by parsing parts.
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, day || 1);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}

export function num(v: FormDataEntryValue | null, fallback = 0): number {
  if (v == null) return fallback;
  const n = parseFloat(String(v).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function str(v: FormDataEntryValue | null): string | null {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? null : s;
}

export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses",
};

export const SUBTYPE_LABEL: Record<string, string> = {
  bank: "Bank",
  accounts_receivable: "Accounts Receivable",
  other_current_asset: "Other Current Asset",
  fixed_asset: "Fixed Asset",
  other_asset: "Other Asset",
  accounts_payable: "Accounts Payable",
  credit_card: "Credit Card",
  payroll_liability: "Payroll Liability",
  tax_liability: "Tax Liability",
  other_current_liability: "Other Current Liability",
  long_term_liability: "Long-Term Liability",
  equity: "Equity",
  retained_earnings: "Retained Earnings",
  distributions: "Distributions",
  contributions: "Contributions",
  income: "Income",
  other_income: "Other Income",
  cogs: "Cost of Services",
  operating_expense: "Operating Expense",
  payroll_expense: "Payroll Expense",
  tax_expense: "Tax Expense",
  other_expense: "Other Expense",
};

export const TAX_PAYMENT_TYPE_LABEL: Record<string, string> = {
  federal_income_est: "Federal Income (Estimated)",
  state_income_est: "State Income (Estimated)",
  payroll_941: "Federal Payroll (941)",
  payroll_940: "Federal Unemployment (940)",
  state_payroll: "State Payroll",
  state_franchise: "State Franchise / Excise",
  sales_tax: "Sales Tax",
  property_tax: "Property Tax",
  other: "Other",
};

export function titleize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
