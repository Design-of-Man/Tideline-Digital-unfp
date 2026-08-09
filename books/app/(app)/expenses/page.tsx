import { createClient } from "@/lib/supabase/server";
import { getAccounts, getPaymentAccounts, getContacts, getTaxCategories } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, Textarea, FormError, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO } from "@/lib/format";
import { createExpense, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [expenseAccounts, paymentAccounts, vendors, taxCats, { data: expenses }] = await Promise.all([
    getAccounts({ types: ["expense"] }),
    getPaymentAccounts(),
    getContacts("vendor"),
    getTaxCategories(),
    supabase
      .from("expenses")
      .select("*, category:accounts!expenses_category_account_id_fkey(code,name), vendor:contacts(name), tax_categories(name)")
      .order("expense_date", { ascending: false })
      .limit(100),
  ]);

  const totalYtd = (expenses ?? [])
    .filter((e) => e.expense_date >= todayISO().slice(0, 4) + "-01-01")
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Record what the business spends. Assign each to a category and it flows into your P&L and tax write-offs automatically."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 list-none">
          + Add expense
        </summary>
        <Card className="mt-3 p-5">
          <form action={createExpense} className="grid sm:grid-cols-3 gap-4">
            <Field label="Date"><Input name="expense_date" type="date" defaultValue={todayISO()} required /></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required /></Field>
            <Field label="Vendor">
              <Select name="vendor_id" defaultValue="">
                <option value="">— None —</option>
                {vendors.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
              </Select>
            </Field>
            <Field label="Category" hint="What it was spent on.">
              <Select name="category_account_id" required defaultValue="">
                <option value="" disabled>Select category…</option>
                {expenseAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Paid from" hint="Bank, card, or A/P if unpaid.">
              <Select name="paid_from_account_id" required defaultValue="">
                <option value="" disabled>Select account…</option>
                {paymentAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue="paid">
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid (bill)</option>
              </Select>
            </Field>
            <Field label="Tax category" hint="Leave blank to inherit from category.">
              <Select name="tax_category_id" defaultValue="">
                <option value="">— Inherit —</option>
                {taxCats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </Field>
            <Field label="Deductible %" hint="Blank = inherit.">
              <Input name="deductible_pct" type="number" min="0" max="100" placeholder="inherit" />
            </Field>
            <Field label="Reference"><Input name="reference" placeholder="Check / txn #" /></Field>
            <Field label="Memo" className="sm:col-span-3"><Textarea name="memo" rows={2} placeholder="Optional note" /></Field>
            <div className="sm:col-span-3"><SubmitButton>Save expense</SubmitButton></div>
          </form>
        </Card>
      </details>

      <div className="mb-4 text-sm text-muted-foreground">
        Total this year: <span className="font-semibold text-foreground">{money(totalYtd)}</span>
      </div>

      <Card>
        {expenses && expenses.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th className="w-28">Date</th>
                <th>Vendor / Memo</th>
                <th>Category</th>
                <th>Tax</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-muted-foreground">{shortDate(e.expense_date)}</td>
                  <td className="font-medium text-foreground">
                    {e.vendor?.name || e.memo || "—"}
                    {e.status === "unpaid" && <Badge tone="amber">unpaid</Badge>}
                  </td>
                  <td className="text-muted-foreground">{e.category?.name}</td>
                  <td>
                    {e.tax_categories?.name ? (
                      <Badge tone="green">{e.deductible_pct < 100 ? `${e.deductible_pct}% ` : ""}deductible</Badge>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="num tabular-nums">{money(e.amount)}</td>
                  <td className="text-right pr-4">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-muted-foreground/60 hover:text-destructive text-sm">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No expenses yet" description="Add your first business expense above." />
        )}
      </Card>
    </div>
  );
}
