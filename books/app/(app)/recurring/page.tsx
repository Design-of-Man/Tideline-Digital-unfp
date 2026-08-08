import { createClient } from "@/lib/supabase/server";
import { getAccounts, getPaymentAccounts, getContacts } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, FormError, Badge, EmptyState, Button } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO, titleize } from "@/lib/format";
import { createRecurring, postRecurringNow, generateDue, deleteRecurring, toggleRecurring } from "./actions";

export const dynamic = "force-dynamic";

const FREQS = ["weekly", "biweekly", "semimonthly", "monthly", "quarterly", "semiannually", "annually"];

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [expenseAccounts, paymentAccounts, vendors, { data: rows }] = await Promise.all([
    getAccounts({ types: ["expense"] }),
    getPaymentAccounts(),
    getContacts("vendor"),
    supabase
      .from("recurring_expenses")
      .select("*, category:accounts!recurring_expenses_category_account_id_fkey(name), vendor:contacts(name)")
      .order("next_run_date"),
  ]);

  const monthly = (rows ?? [])
    .filter((r) => r.is_active)
    .reduce((s, r) => s + monthlyEquivalent(Number(r.amount), r.frequency, r.interval_count), 0);

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Templates for regular bills — rent, software, subscriptions. Post them on demand, or set auto-post and run the generator (a daily cron can call it for you)."
        action={
          <form action={generateDue}>
            <SubmitButton variant="secondary">Generate all due</SubmitButton>
          </form>
        }
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-slate-700 list-none">
          + New recurring expense
        </summary>
        <Card className="mt-3 p-5">
          <form action={createRecurring} className="grid sm:grid-cols-3 gap-4">
            <Field label="Name" className="sm:col-span-2"><Input name="name" placeholder="Adobe Creative Cloud" required /></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
            <Field label="Category">
              <Select name="category_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {expenseAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Paid from">
              <Select name="paid_from_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {paymentAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Vendor">
              <Select name="vendor_id" defaultValue="">
                <option value="">— None —</option>
                {vendors.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
              </Select>
            </Field>
            <Field label="Frequency">
              <Select name="frequency" defaultValue="monthly">
                {FREQS.map((f) => (<option key={f} value={f}>{titleize(f)}</option>))}
              </Select>
            </Field>
            <Field label="Every N intervals" hint="1 = every period"><Input name="interval_count" type="number" min="1" defaultValue={1} /></Field>
            <Field label="Start date"><Input name="start_date" type="date" defaultValue={todayISO()} /></Field>
            <Field label="End date (optional)"><Input name="end_date" type="date" /></Field>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2 mt-6">
              <input type="checkbox" name="auto_post" /> Auto-post when due (via generator)
            </label>
            <div className="sm:col-span-3"><SubmitButton>Save template</SubmitButton></div>
          </form>
        </Card>
      </details>

      <div className="mb-4 text-sm text-slate-500">
        Active recurring cost: <span className="font-semibold text-slate-800">{money(monthly)}</span>/mo equivalent
      </div>

      <Card>
        {rows && rows.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Frequency</th>
                <th>Next</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className={r.is_active ? "" : "opacity-50"}>
                  <td className="font-medium text-slate-800">
                    {r.name}
                    {r.auto_post && <Badge tone="blue">auto</Badge>}
                    {!r.is_active && <Badge>paused</Badge>}
                  </td>
                  <td className="text-slate-500">{r.category?.name}</td>
                  <td className="text-slate-500">
                    {titleize(r.frequency)}{r.interval_count > 1 ? ` ×${r.interval_count}` : ""}
                  </td>
                  <td className="text-slate-500">{shortDate(r.next_run_date)}</td>
                  <td className="num tabular-nums">{money(r.amount)}</td>
                  <td className="text-right pr-4 whitespace-nowrap">
                    <form action={postRecurringNow} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-slate-500 hover:text-slate-900 text-sm mr-3">Post now</button>
                    </form>
                    <form action={toggleRecurring} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="active" value={String(r.is_active)} />
                      <button className="text-slate-400 hover:text-slate-700 text-sm mr-3">{r.is_active ? "Pause" : "Resume"}</button>
                    </form>
                    <form action={deleteRecurring} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-slate-300 hover:text-rose-600 text-sm">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No recurring expenses" description="Add rent, software subscriptions, and other regular bills." />
        )}
      </Card>
    </div>
  );
}

function monthlyEquivalent(amount: number, freq: string, interval: number): number {
  const perYear: Record<string, number> = {
    weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12,
    quarterly: 4, semiannually: 2, annually: 1,
  };
  const times = (perYear[freq] ?? 12) / Math.max(1, interval);
  return (amount * times) / 12;
}
