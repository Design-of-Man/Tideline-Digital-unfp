import { createClient } from "@/lib/supabase/server";
import { getEmployees, getBankAccounts } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, FormError, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO } from "@/lib/format";
import { runPayroll, deletePayroll } from "./actions";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [employees, banks, { data: runs }] = await Promise.all([
    getEmployees(),
    getBankAccounts(),
    supabase.from("payroll_runs").select("*, employee:employees(first_name, last_name)").order("pay_date", { ascending: false }).limit(50),
  ]);

  const ytd = (runs ?? [])
    .filter((r) => r.pay_date >= todayISO().slice(0, 4) + "-01-01")
    .reduce((s, r) => s + Number(r.gross_pay), 0);

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Record W-2 salary runs for your shareholder-employees. FICA defaults to 7.65% each side — override any field. The entry books gross wages, employer taxes, net pay, and payroll liabilities."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6" open={!runs?.length}>
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-slate-700 list-none">+ Run payroll</summary>
        <Card className="mt-3 p-5">
          <form action={runPayroll} className="space-y-5">
            <div className="grid sm:grid-cols-4 gap-4">
              <Field label="Employee" className="sm:col-span-2">
                <Select name="employee_id" required defaultValue="">
                  <option value="" disabled>Select…</option>
                  {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
                </Select>
              </Field>
              <Field label="Pay date"><Input name="pay_date" type="date" defaultValue={todayISO()} required /></Field>
              <Field label="Gross pay"><Input name="gross_pay" type="number" step="0.01" min="0" required /></Field>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Employee withholdings (reduce net pay)</div>
              <div className="grid sm:grid-cols-4 gap-4">
                <Field label="Employee FICA" hint="Blank = 7.65%"><Input name="employee_fica" type="number" step="0.01" min="0" placeholder="auto" /></Field>
                <Field label="Federal W/H"><Input name="federal_withholding" type="number" step="0.01" min="0" defaultValue={0} /></Field>
                <Field label="State W/H"><Input name="state_withholding" type="number" step="0.01" min="0" defaultValue={0} /></Field>
                <Field label="Other W/H"><Input name="other_withholding" type="number" step="0.01" min="0" defaultValue={0} /></Field>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Employer taxes (company expense)</div>
              <div className="grid sm:grid-cols-4 gap-4">
                <Field label="Employer FICA" hint="Blank = 7.65%"><Input name="employer_fica" type="number" step="0.01" min="0" placeholder="auto" /></Field>
                <Field label="FUTA"><Input name="futa" type="number" step="0.01" min="0" defaultValue={0} /></Field>
                <Field label="SUTA"><Input name="suta" type="number" step="0.01" min="0" defaultValue={0} /></Field>
                <Field label="Pay from (bank)">
                  <Select name="pay_from_account_id" required defaultValue="">
                    <option value="" disabled>Select…</option>
                    {banks.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
                  </Select>
                </Field>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Period start"><Input name="period_start" type="date" /></Field>
              <Field label="Period end"><Input name="period_end" type="date" /></Field>
              <Field label="Memo"><Input name="memo" placeholder="Optional" /></Field>
            </div>
            <SubmitButton>Post payroll</SubmitButton>
          </form>
        </Card>
      </details>

      <div className="mb-4 text-sm text-slate-500">
        Gross wages this year: <span className="font-semibold text-slate-800">{money(ytd)}</span>
      </div>

      <Card>
        {runs && runs.length > 0 ? (
          <table className="data">
            <thead>
              <tr><th>Date</th><th>Employee</th><th className="num">Gross</th><th className="num">Taxes</th><th className="num">Net</th><th></th></tr>
            </thead>
            <tbody>
              {runs.map((r: any) => (
                <tr key={r.id}>
                  <td className="text-slate-500 whitespace-nowrap">{shortDate(r.pay_date)}</td>
                  <td className="font-medium text-slate-800">{r.employee?.first_name} {r.employee?.last_name}</td>
                  <td className="num tabular-nums">{money(r.gross_pay)}</td>
                  <td className="num tabular-nums text-slate-500">{money(Number(r.employee_fica) + Number(r.federal_withholding) + Number(r.state_withholding) + Number(r.other_withholding) + Number(r.employer_fica) + Number(r.futa) + Number(r.suta))}</td>
                  <td className="num tabular-nums">{money(r.net_pay)}</td>
                  <td className="text-right pr-4">
                    <form action={deletePayroll}><input type="hidden" name="id" value={r.id} /><button className="text-slate-300 hover:text-rose-600 text-sm">Delete</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<EmptyState title="No payroll runs yet" description="Run your first payroll above." />)}
      </Card>
    </div>
  );
}
