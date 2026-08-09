import { getEmployees, getAccounts } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, FormError, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, titleize } from "@/lib/format";
import { createEmployee, updateEmployee } from "./actions";

export const dynamic = "force-dynamic";

const PAY_FREQS = ["weekly", "biweekly", "semimonthly", "monthly", "quarterly", "annually"];

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [employees, equityAccounts] = await Promise.all([
    getEmployees(),
    getAccounts({ types: ["equity"] }),
  ]);
  const distributionAccounts = equityAccounts.filter((a) => a.subtype === "distributions");

  function EmployeeFormFields({ e }: { e?: any }) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="First name"><Input name="first_name" defaultValue={e?.first_name} required /></Field>
        <Field label="Last name"><Input name="last_name" defaultValue={e?.last_name} required /></Field>
        <Field label="Title"><Input name="title" defaultValue={e?.title ?? ""} placeholder="Owner" /></Field>
        <Field label="Email"><Input name="email" type="email" defaultValue={e?.email ?? ""} /></Field>
        <Field label="Annual salary" hint="Reasonable W-2 salary."><Input name="annual_salary" type="number" step="0.01" min="0" defaultValue={e?.annual_salary ?? 0} /></Field>
        <Field label="Pay frequency">
          <Select name="pay_frequency" defaultValue={e?.pay_frequency ?? "monthly"}>
            {PAY_FREQS.map((f) => (<option key={f} value={f}>{titleize(f)}</option>))}
          </Select>
        </Field>
        <Field label="Ownership %"><Input name="ownership_pct" type="number" step="0.01" min="0" max="100" defaultValue={e?.ownership_pct ?? 0} /></Field>
        <Field label="Distributions equity account" className="sm:col-span-2">
          <Select name="equity_account_id" defaultValue={e?.equity_account_id ?? ""}>
            <option value="">— None —</option>
            {distributionAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="is_owner" defaultChecked={e ? e.is_owner : true} /> Owner
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="is_shareholder" defaultChecked={e ? e.is_shareholder : true} /> Shareholder
        </label>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Employees & Owners"
        description="Your two shareholder-employees are pre-created — rename them below. Each takes a reasonable W-2 salary plus distributions."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 list-none">+ Add person</summary>
        <Card className="mt-3 p-5">
          <form action={createEmployee} className="space-y-4">
            <EmployeeFormFields />
            <SubmitButton>Add</SubmitButton>
          </form>
        </Card>
      </details>

      <div className="space-y-3">
        {employees.length > 0 ? employees.map((e) => (
          <Card key={e.id} className="p-0">
            <details>
              <summary className="cursor-pointer px-5 py-4 flex items-center justify-between list-none">
                <div>
                  <span className="font-medium text-foreground">{e.first_name} {e.last_name}</span>
                  <span className="text-muted-foreground text-sm ml-2">{e.title}</span>
                  {e.is_owner && <Badge tone="blue">owner</Badge>}
                  {e.is_shareholder && <Badge>{Number(e.ownership_pct)}%</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{money(e.annual_salary)}/yr · edit</div>
              </summary>
              <div className="px-5 pb-5 border-t border-border pt-4">
                <form action={updateEmployee} className="space-y-4">
                  <input type="hidden" name="id" value={e.id} />
                  <EmployeeFormFields e={e} />
                  <SubmitButton variant="secondary">Save changes</SubmitButton>
                </form>
              </div>
            </details>
          </Card>
        )) : (
          <EmptyState title="No employees" description="Add your owners to run payroll and distributions." />
        )}
      </div>
    </div>
  );
}
