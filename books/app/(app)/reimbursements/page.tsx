import { createClient } from "@/lib/supabase/server";
import { getEmployees, getAccounts, getBankAccounts } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, FormError, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO } from "@/lib/format";
import {
  createEmployeeExpense, approveEmployeeExpense, reimburseEmployeeExpense,
  rejectEmployeeExpense, deleteEmployeeExpense,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  submitted: "amber", approved: "blue", reimbursed: "green", rejected: "red",
};

export default async function ReimbursementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [employees, expenseAccounts, banks, { data: rows }] = await Promise.all([
    getEmployees(),
    getAccounts({ types: ["expense"] }),
    getBankAccounts(),
    supabase
      .from("employee_expenses")
      .select("*, employee:employees(first_name, last_name), category:accounts!employee_expenses_category_account_id_fkey(name)")
      .order("expense_date", { ascending: false })
      .limit(100),
  ]);

  const owed = (rows ?? [])
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader
        title="Employee Expenses"
        description="Out-of-pocket business costs an owner/employee paid personally. Approve to book the expense (owed back), then reimburse to pay it from the business."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 list-none">+ Submit expense</summary>
        <Card className="mt-3 p-5">
          <form action={createEmployeeExpense} className="grid sm:grid-cols-3 gap-4">
            <Field label="Employee">
              <Select name="employee_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {employees.map((e) => (<option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>))}
              </Select>
            </Field>
            <Field label="Date"><Input name="expense_date" type="date" defaultValue={todayISO()} required /></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
            <Field label="Category">
              <Select name="category_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {expenseAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2"><Input name="description" placeholder="Client dinner, supplies…" /></Field>
            <div className="sm:col-span-3"><SubmitButton>Submit</SubmitButton></div>
          </form>
        </Card>
      </details>

      <div className="mb-4 text-sm text-muted-foreground">
        Currently owed to employees: <span className="font-semibold text-foreground">{money(owed)}</span>
      </div>

      <Card>
        {rows && rows.length > 0 ? (
          <table className="data">
            <thead>
              <tr><th>Date</th><th>Employee</th><th>Category</th><th>Status</th><th className="num">Amount</th><th className="text-right pr-4">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="text-muted-foreground whitespace-nowrap">{shortDate(r.expense_date)}</td>
                  <td className="font-medium text-foreground">{r.employee?.first_name} {r.employee?.last_name}<div className="text-xs text-muted-foreground">{r.description}</div></td>
                  <td className="text-muted-foreground">{r.category?.name}</td>
                  <td><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                  <td className="num tabular-nums">{money(r.amount)}</td>
                  <td className="text-right pr-4 whitespace-nowrap">
                    {r.status === "submitted" && (
                      <form action={approveEmployeeExpense} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <button className="text-foreground hover:text-foreground text-sm mr-3">Approve</button>
                      </form>
                    )}
                    {(r.status === "submitted" || r.status === "approved") && (
                      <details className="inline-block align-middle mr-3">
                        <summary className="text-success hover:text-success text-sm cursor-pointer list-none inline">Reimburse</summary>
                        <form action={reimburseEmployeeExpense} className="inline-flex items-center gap-2 ml-2">
                          <input type="hidden" name="id" value={r.id} />
                          <Select name="pay_from_account_id" required defaultValue="" className="!py-1 !text-xs">
                            <option value="" disabled>Bank…</option>
                            {banks.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                          </Select>
                          <button className="text-success text-sm font-medium">Pay</button>
                        </form>
                      </details>
                    )}
                    {r.status === "submitted" && (
                      <form action={rejectEmployeeExpense} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <button className="text-muted-foreground hover:text-foreground text-sm mr-3">Reject</button>
                      </form>
                    )}
                    <form action={deleteEmployeeExpense} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-muted-foreground/60 hover:text-destructive text-sm">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<EmptyState title="No employee expenses" description="Submit a reimbursement request above." />)}
      </Card>
    </div>
  );
}
