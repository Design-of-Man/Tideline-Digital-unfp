import { createClient } from "@/lib/supabase/server";
import { getAccounts, getContacts } from "@/lib/data";
import {
  PageHeader,
  Card,
  CardHeader,
  Field,
  Input,
  Textarea,
  Select,
  FormError,
  Badge,
  EmptyState,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, todayISO, titleize } from "@/lib/format";
import {
  createRecurringInvoice,
  generateDueInvoices,
  toggleRecurringInvoice,
  deleteRecurringInvoice,
  postDraft,
  deleteDraft,
} from "./actions";

export const dynamic = "force-dynamic";

const FREQS = ["weekly", "biweekly", "semimonthly", "monthly", "quarterly", "semiannually", "annually"];
const TYPE_LABEL: Record<string, string> = {
  implementation: "Implementation",
  monthly: "Monthly",
  standard: "Standard",
};

export default async function RecurringInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [customers, incomeAccounts, { data: templates }, { data: drafts }] = await Promise.all([
    getContacts("customer"),
    getAccounts({ types: ["revenue"] }),
    supabase
      .from("recurring_invoices")
      .select("*, contact:contacts(name), income:accounts!recurring_invoices_income_account_id_fkey(code, name)")
      .order("next_run_date"),
    supabase
      .from("invoices")
      .select("*, contact:contacts(name)")
      .eq("status", "draft")
      .order("issue_date", { ascending: false }),
  ]);

  const active = (templates ?? []).filter((t) => t.is_active);
  const monthly = active.reduce(
    (s, t) => s + monthlyEquivalent(Number(t.amount), t.frequency, t.interval_count),
    0
  );
  const draftTotal = (drafts ?? []).reduce((s, d) => s + Number(d.total), 0);

  return (
    <div>
      <PageHeader
        title="Recurring Invoices"
        description="Templates for retainers and monthly service. Generate drafts when they come due, review them, then finalize to post and send."
        action={
          <form action={generateDueInvoices}>
            <SubmitButton variant="secondary">Generate all due</SubmitButton>
          </form>
        }
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}

      {customers.length === 0 && (
        <Card className="p-4 mb-6 bg-muted border-border">
          <p className="text-sm text-warning">
            Add a customer on the Income &amp; Invoices page first, then build a template here.
          </p>
        </Card>
      )}

      <details className="mb-6">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 list-none">
          + New recurring invoice
        </summary>
        <Card className="mt-3 p-5">
          <form action={createRecurringInvoice} className="grid sm:grid-cols-3 gap-4">
            <Field label="Customer">
              <Select name="contact_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </Field>
            <Field label="Template name" className="sm:col-span-2">
              <Input name="name" placeholder="Regen Ortho — monthly retainer" required />
            </Field>
            <Field label="Type">
              <Select name="invoice_type" defaultValue="monthly">
                <option value="monthly">Monthly</option>
                <option value="implementation">Implementation</option>
                <option value="standard">Standard</option>
              </Select>
            </Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
            <Field label="Income account">
              <Select name="income_account_id" required defaultValue="">
                <option value="" disabled>Select…</option>
                {incomeAccounts.map((a) => (<option key={a.id} value={a.id}>{a.code} · {a.name}</option>))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-3" hint="Appears as the invoice line item.">
              <Input name="description" placeholder="Monthly design & maintenance retainer" />
            </Field>
            <Field label="Frequency">
              <Select name="frequency" defaultValue="monthly">
                {FREQS.map((f) => (<option key={f} value={f}>{titleize(f)}</option>))}
              </Select>
            </Field>
            <Field label="Every N intervals" hint="1 = every period"><Input name="interval_count" type="number" min="1" defaultValue={1} /></Field>
            <Field label="Net days (due)" hint="Days until due"><Input name="net_days" type="number" min="0" defaultValue={15} /></Field>
            <Field label="Start date"><Input name="start_date" type="date" defaultValue={todayISO()} /></Field>
            <Field label="End date (optional)"><Input name="end_date" type="date" /></Field>
            <Field label="Terms (optional)"><Input name="terms" placeholder="Payable by check" /></Field>
            <Field label="Notes (optional)" className="sm:col-span-3"><Textarea name="memo" rows={2} /></Field>
            <div className="sm:col-span-3"><SubmitButton>Save template</SubmitButton></div>
          </form>
        </Card>
      </details>

      {/* Drafts awaiting review */}
      {drafts && drafts.length > 0 && (
        <Card className="mb-6">
          <CardHeader title={`Drafts to review · ${money(draftTotal)}`} />
          <table className="data">
            <thead>
              <tr><th>Customer</th><th>Type</th><th>Service period</th><th>Due</th><th className="num">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {drafts.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium text-foreground">
                    <a href={`/invoices/${d.id}`} className="text-accent hover:underline">{d.contact?.name}</a>
                  </td>
                  <td className="text-muted-foreground">{TYPE_LABEL[d.invoice_type] ?? d.invoice_type}</td>
                  <td className="text-muted-foreground">
                    {d.service_period_start ? `${shortDate(d.service_period_start)} – ${shortDate(d.service_period_end)}` : "—"}
                  </td>
                  <td className="text-muted-foreground">{shortDate(d.due_date)}</td>
                  <td className="num tabular-nums">{money(d.total)}</td>
                  <td className="text-right pr-4 whitespace-nowrap">
                    <a href={`/invoices/${d.id}`} className="text-muted-foreground hover:text-foreground text-sm mr-3">View</a>
                    <form action={postDraft} className="inline">
                      <input type="hidden" name="id" value={d.id} />
                      <button className="text-accent hover:underline text-sm font-medium mr-3">Finalize &amp; post</button>
                    </form>
                    <form action={deleteDraft} className="inline">
                      <input type="hidden" name="id" value={d.id} />
                      <button className="text-muted-foreground/60 hover:text-destructive text-sm">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mb-4 text-sm text-muted-foreground">
        Active recurring revenue: <span className="font-semibold text-foreground">{money(monthly)}</span>/mo equivalent
      </div>

      <Card>
        <CardHeader title="Templates" />
        {templates && templates.length > 0 ? (
          <table className="data">
            <thead>
              <tr><th>Name</th><th>Customer</th><th>Type</th><th>Frequency</th><th>Next</th><th className="num">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {templates.map((t: any) => (
                <tr key={t.id} className={t.is_active ? "" : "opacity-50"}>
                  <td className="font-medium text-foreground">
                    {t.name}
                    {!t.is_active && <Badge>paused</Badge>}
                  </td>
                  <td className="text-muted-foreground">{t.contact?.name}</td>
                  <td className="text-muted-foreground">{TYPE_LABEL[t.invoice_type] ?? t.invoice_type}</td>
                  <td className="text-muted-foreground">{titleize(t.frequency)}{t.interval_count > 1 ? ` ×${t.interval_count}` : ""}</td>
                  <td className="text-muted-foreground">{shortDate(t.next_run_date)}</td>
                  <td className="num tabular-nums">{money(t.amount)}</td>
                  <td className="text-right pr-4 whitespace-nowrap">
                    <form action={generateDueInvoices} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <button className="text-muted-foreground hover:text-foreground text-sm mr-3">Generate now</button>
                    </form>
                    <form action={toggleRecurringInvoice} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="active" value={String(t.is_active)} />
                      <button className="text-muted-foreground hover:text-foreground text-sm mr-3">{t.is_active ? "Pause" : "Resume"}</button>
                    </form>
                    <form action={deleteRecurringInvoice} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <button className="text-muted-foreground/60 hover:text-destructive text-sm">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No recurring invoices" description="Create a template for a retainer or monthly-service client." />
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
