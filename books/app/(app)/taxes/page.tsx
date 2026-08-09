import { createClient } from "@/lib/supabase/server";
import { getAccounts, getBankAccounts } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, Textarea, FormError, EmptyState, Button } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO, TAX_PAYMENT_TYPE_LABEL } from "@/lib/format";
import { createTaxPayment, deleteTaxPayment } from "./actions";

export const dynamic = "force-dynamic";

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [banks, taxLiabilityAccounts, taxExpenseAccounts, { data: rows }] = await Promise.all([
    getBankAccounts(),
    getAccounts({ subtypes: ["tax_liability", "payroll_liability"] }),
    getAccounts({ subtypes: ["tax_expense"] }),
    supabase.from("tax_payments").select("*").order("payment_date", { ascending: false }).limit(50),
  ]);

  const ytd = (rows ?? [])
    .filter((r) => r.payment_date >= todayISO().slice(0, 4) + "-01-01")
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader
        title="Tax Payments"
        description="Record payroll tax deposits, state franchise/excise tax, sales tax, and estimated payments. As a pass-through S-Corp, federal income tax is generally paid by the owners personally — track those as estimated payments if you like."
        action={<Button href="/reports/deductions" variant="secondary">View write-offs</Button>}
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <Card className="p-4 mb-6 bg-muted border-border">
        <p className="text-sm text-foreground">
          Paying down payroll taxes you already withheld? Choose <strong>Payroll Liabilities</strong> as the tax account —
          that clears the liability instead of double-counting the expense. For franchise/state taxes the business owes
          directly, choose the <strong>Taxes &amp; Licenses</strong> expense account.
        </p>
      </Card>

      <details className="mb-6" open={!rows?.length}>
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 list-none">+ Record tax payment</summary>
        <Card className="mt-3 p-5">
          <form action={createTaxPayment} className="grid sm:grid-cols-3 gap-4">
            <Field label="Tax type">
              <Select name="tax_type" defaultValue="payroll_941">
                {Object.entries(TAX_PAYMENT_TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </Select>
            </Field>
            <Field label="Period"><Input name="period_label" placeholder="Q3 2026" /></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
            <Field label="Date"><Input name="payment_date" type="date" defaultValue={todayISO()} required /></Field>
            <Field label="Paid from (bank)">
              <Select name="pay_from_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {banks.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Applies to (tax account)" hint="Liability to clear, or tax expense.">
              <Select name="tax_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                <optgroup label="Liabilities (clear withheld/owed)">
                  {taxLiabilityAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
                </optgroup>
                <optgroup label="Expenses (business tax)">
                  {taxExpenseAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
                </optgroup>
              </Select>
            </Field>
            <Field label="Reference"><Input name="reference" placeholder="Confirmation #" /></Field>
            <Field label="Memo" className="sm:col-span-2"><Textarea name="memo" rows={1} /></Field>
            <div className="sm:col-span-3"><SubmitButton>Record payment</SubmitButton></div>
          </form>
        </Card>
      </details>

      <div className="mb-4 text-sm text-muted-foreground">
        Tax paid this year: <span className="font-semibold text-foreground">{money(ytd)}</span>
      </div>

      <Card>
        {rows && rows.length > 0 ? (
          <table className="data">
            <thead><tr><th>Date</th><th>Type</th><th>Period</th><th className="num">Amount</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-muted-foreground whitespace-nowrap">{shortDate(r.payment_date)}</td>
                  <td className="font-medium text-foreground">{TAX_PAYMENT_TYPE_LABEL[r.tax_type]}</td>
                  <td className="text-muted-foreground">{r.period_label || "—"}</td>
                  <td className="num tabular-nums">{money(r.amount)}</td>
                  <td className="text-right pr-4">
                    <form action={deleteTaxPayment}><input type="hidden" name="id" value={r.id} /><button className="text-muted-foreground/60 hover:text-destructive text-sm">Delete</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<EmptyState title="No tax payments recorded" />)}
      </Card>
    </div>
  );
}
