import { createClient } from "@/lib/supabase/server";
import { getEmployees, getBankAccounts } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, FormError, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO } from "@/lib/format";
import { createDistribution, deleteDistribution } from "./actions";

export const dynamic = "force-dynamic";

export default async function DistributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [shareholders, banks, { data: rows }] = await Promise.all([
    getEmployees(),
    getBankAccounts(),
    supabase.from("distributions").select("*, employee:employees(first_name, last_name)").order("distribution_date", { ascending: false }).limit(50),
  ]);
  const owners = shareholders.filter((e) => e.is_shareholder);

  const ytd = (rows ?? [])
    .filter((r) => r.distribution_date >= todayISO().slice(0, 4) + "-01-01")
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader
        title="Shareholder Distributions"
        description="Owner draws of profit — not payroll, and not subject to payroll tax. Each posts against that shareholder's equity. Keep salary reasonable relative to distributions to stay IRS-compliant."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6" open={!rows?.length}>
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-slate-700 list-none">+ Record distribution</summary>
        <Card className="mt-3 p-5">
          <form action={createDistribution} className="grid sm:grid-cols-3 gap-4">
            <Field label="Shareholder">
              <Select name="employee_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {owners.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
              </Select>
            </Field>
            <Field label="Date"><Input name="distribution_date" type="date" defaultValue={todayISO()} required /></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
            <Field label="Paid from (bank)">
              <Select name="pay_from_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {banks.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Reference"><Input name="reference" placeholder="Check #" /></Field>
            <Field label="Memo"><Input name="memo" /></Field>
            <div className="sm:col-span-3"><SubmitButton>Record distribution</SubmitButton></div>
          </form>
        </Card>
      </details>

      <div className="mb-4 text-sm text-slate-500">
        Distributions this year: <span className="font-semibold text-slate-800">{money(ytd)}</span>
      </div>

      <Card>
        {rows && rows.length > 0 ? (
          <table className="data">
            <thead><tr><th>Date</th><th>Shareholder</th><th>Memo</th><th className="num">Amount</th><th></th></tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="text-slate-500 whitespace-nowrap">{shortDate(r.distribution_date)}</td>
                  <td className="font-medium text-slate-800">{r.employee?.first_name} {r.employee?.last_name}</td>
                  <td className="text-slate-500">{r.memo || "—"}</td>
                  <td className="num tabular-nums">{money(r.amount)}</td>
                  <td className="text-right pr-4">
                    <form action={deleteDistribution}><input type="hidden" name="id" value={r.id} /><button className="text-slate-300 hover:text-rose-600 text-sm">Delete</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<EmptyState title="No distributions yet" />)}
      </Card>
    </div>
  );
}
