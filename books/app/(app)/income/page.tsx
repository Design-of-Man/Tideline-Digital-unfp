import { createClient } from "@/lib/supabase/server";
import { getAccounts, getBankAccounts, getContacts } from "@/lib/data";
import { PageHeader, Card, CardHeader, Field, Input, Select, FormError, Badge, EmptyState, StatCard } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO, titleize } from "@/lib/format";
import { createInvoice, recordPayment, createCustomer, deleteInvoice, deletePayment } from "./actions";

export const dynamic = "force-dynamic";

const INV_TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  paid: "green", partial: "amber", open: "blue", draft: "slate", void: "red",
};

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [customers, incomeAccounts, banks, { data: invoices }, { data: payments }] = await Promise.all([
    getContacts("customer"),
    getAccounts({ types: ["revenue"] }),
    getBankAccounts(),
    supabase.from("invoices").select("*, contact:contacts(name)").order("issue_date", { ascending: false }).limit(50),
    supabase.from("payments_received").select("*, contact:contacts(name), invoice:invoices(number)").order("payment_date", { ascending: false }).limit(50),
  ]);

  const openInvoices = (invoices ?? []).filter((i) => i.status === "open" || i.status === "partial");
  const outstanding = openInvoices.reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0);
  const receivedYtd = (payments ?? [])
    .filter((p) => p.payment_date >= todayISO().slice(0, 4) + "-01-01")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="Income & Invoices"
        description="Record incoming payments directly, or invoice a customer and mark it paid when the money lands."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label="Received this year" value={money(receivedYtd)} tone="positive" />
        <StatCard label="Outstanding" value={money(outstanding)} hint={`${openInvoices.length} open invoices`} />
      </div>

      {customers.length === 0 && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">Add a customer first to create invoices or attribute payments.</p>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <details>
          <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-slate-700 list-none">+ Record payment</summary>
          <Card className="mt-3 p-5 w-full">
            <form action={recordPayment} className="grid sm:grid-cols-3 gap-4">
              <Field label="Date"><Input name="payment_date" type="date" defaultValue={todayISO()} required /></Field>
              <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
              <Field label="Deposit to (bank)">
                <Select name="deposit_account_id" required defaultValue="">
                  <option value="" disabled>Select…</option>
                  {banks.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
                </Select>
              </Field>
              <Field label="Apply to invoice" hint="Or leave blank for a direct sale.">
                <Select name="invoice_id" defaultValue="">
                  <option value="">— None —</option>
                  {openInvoices.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.number || i.id.slice(0, 6)} · {i.contact?.name} · {money(Number(i.total) - Number(i.amount_paid))} due
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Or customer">
                <Select name="contact_id" defaultValue="">
                  <option value="">— None —</option>
                  {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </Select>
              </Field>
              <Field label="Or income account" hint="For direct sales.">
                <Select name="income_account_id" defaultValue="">
                  <option value="">— None —</option>
                  {incomeAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
                </Select>
              </Field>
              <Field label="Method">
                <Select name="method" defaultValue="bank_transfer">
                  {["bank_transfer", "ach", "check", "card", "cash", "wire", "paypal", "stripe", "other"].map((m) => (
                    <option key={m} value={m}>{titleize(m)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Reference"><Input name="reference" placeholder="Check / txn #" /></Field>
              <Field label="Memo"><Input name="memo" /></Field>
              <div className="sm:col-span-3"><SubmitButton>Record payment</SubmitButton></div>
            </form>
          </Card>
        </details>

        <details>
          <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-white text-slate-700 border border-slate-300 px-3.5 py-2 text-sm font-medium hover:bg-slate-50 list-none">+ Create invoice</summary>
          <Card className="mt-3 p-5 w-full">
            <form action={createInvoice} className="grid sm:grid-cols-3 gap-4">
              <Field label="Customer">
                <Select name="contact_id" required defaultValue="">
                  <option value="" disabled>Select…</option>
                  {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </Select>
              </Field>
              <Field label="Invoice #"><Input name="number" placeholder="INV-001" /></Field>
              <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
              <Field label="Income account">
                <Select name="income_account_id" required defaultValue="">
                  <option value="" disabled>Select…</option>
                  {incomeAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
                </Select>
              </Field>
              <Field label="Issue date"><Input name="issue_date" type="date" defaultValue={todayISO()} /></Field>
              <Field label="Due date"><Input name="due_date" type="date" /></Field>
              <Field label="Description" className="sm:col-span-3"><Input name="description" placeholder="Website design — Phase 1" /></Field>
              <div className="sm:col-span-3"><SubmitButton>Create invoice</SubmitButton></div>
            </form>
          </Card>
        </details>

        <details>
          <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg text-slate-600 hover:bg-slate-100 px-3.5 py-2 text-sm font-medium list-none">+ New customer</summary>
          <Card className="mt-3 p-5 w-full">
            <form action={createCustomer} className="grid sm:grid-cols-3 gap-4 items-end">
              <Field label="Name" className="sm:col-span-2"><Input name="name" required /></Field>
              <Field label="Email"><Input name="email" type="email" /></Field>
              <div className="sm:col-span-3"><SubmitButton>Add customer</SubmitButton></div>
            </form>
          </Card>
        </details>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Invoices" />
          {invoices && invoices.length > 0 ? (
            <table className="data">
              <thead><tr><th>#</th><th>Customer</th><th>Status</th><th className="num">Total</th><th></th></tr></thead>
              <tbody>
                {invoices.map((i: any) => (
                  <tr key={i.id}>
                    <td className="text-slate-500">{i.number || i.id.slice(0, 6)}<div className="text-xs text-slate-400">{shortDate(i.issue_date)}</div></td>
                    <td className="font-medium text-slate-800">{i.contact?.name}</td>
                    <td><Badge tone={INV_TONE[i.status]}>{i.status}</Badge></td>
                    <td className="num tabular-nums">{money(i.total)}<div className="text-xs text-slate-400">{money(i.amount_paid)} paid</div></td>
                    <td className="text-right pr-4">
                      <form action={deleteInvoice}><input type="hidden" name="id" value={i.id} /><button className="text-slate-300 hover:text-rose-600 text-sm">Delete</button></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<EmptyState title="No invoices" />)}
        </Card>

        <Card>
          <CardHeader title="Payments received" />
          {payments && payments.length > 0 ? (
            <table className="data">
              <thead><tr><th>Date</th><th>From</th><th>Method</th><th className="num">Amount</th><th></th></tr></thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-slate-500 whitespace-nowrap">{shortDate(p.payment_date)}</td>
                    <td className="font-medium text-slate-800">{p.contact?.name || "—"}{p.invoice?.number && <div className="text-xs text-slate-400">{p.invoice.number}</div>}</td>
                    <td className="text-slate-500">{titleize(p.method)}</td>
                    <td className="num tabular-nums text-emerald-600">{money(p.amount)}</td>
                    <td className="text-right pr-4">
                      <form action={deletePayment}><input type="hidden" name="id" value={p.id} /><button className="text-slate-300 hover:text-rose-600 text-sm">Delete</button></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<EmptyState title="No payments yet" />)}
        </Card>
      </div>
    </div>
  );
}
