import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatCard, Card, CardHeader, Button, Badge, EmptyState } from "@/components/ui";
import { money, shortDate, todayISO, firstOfYearISO, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const today = todayISO();
  const yearStart = firstOfYearISO();

  const [{ data: balances }, { data: pnl }, { data: recent }, { data: recurring }] =
    await Promise.all([
      supabase.rpc("f_account_balances", { p_as_of: today }),
      supabase.rpc("f_pnl", { p_start: yearStart, p_end: today }),
      supabase
        .from("journal_entries")
        .select("id, entry_date, memo, source, journal_lines(debit)")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("recurring_expenses")
        .select("id, name, amount, frequency, next_run_date")
        .eq("is_active", true)
        .order("next_run_date")
        .limit(5),
    ]);

  const bal = balances ?? [];
  const cash = bal
    .filter((a) => a.subtype === "bank")
    .reduce((s, a) => s + Number(a.balance), 0);
  const ar = bal
    .filter((a) => a.subtype === "accounts_receivable")
    .reduce((s, a) => s + Number(a.balance), 0);
  const cc = bal
    .filter((a) => a.subtype === "credit_card")
    .reduce((s, a) => s + Number(a.balance), 0);

  const rows = pnl ?? [];
  const income = rows
    .filter((r) => r.type === "revenue")
    .reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + Number(r.amount), 0);
  const net = income - expense;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Financial snapshot for ${new Date().getFullYear()} — year to date.`}
        action={
          <>
            <Button href="/income" variant="secondary">Record income</Button>
            <Button href="/expenses">Add expense</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Cash on hand" value={money(cash)} hint="All bank accounts" />
        <StatCard label="Accounts receivable" value={money(ar)} hint="Owed to you" />
        <StatCard
          label="Net income (YTD)"
          value={money(net)}
          tone={net >= 0 ? "positive" : "negative"}
          hint={`${money(income)} in · ${money(expense)} out`}
        />
        <StatCard label="Credit card owed" value={money(cc)} hint="Outstanding balance" tone="muted" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent transactions"
            action={<Link href="/transactions" className="text-sm text-slate-500 hover:text-slate-800">View all</Link>}
          />
          {recent && recent.length > 0 ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => {
                  const amount = (e.journal_lines ?? []).reduce(
                    (s: number, l: { debit: number }) => s + Number(l.debit),
                    0
                  );
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap text-slate-500">{shortDate(e.entry_date)}</td>
                      <td>
                        <Link href={`/transactions/${e.id}`} className="hover:underline">
                          {e.memo || "—"}
                        </Link>
                      </td>
                      <td><Badge>{titleize(e.source)}</Badge></td>
                      <td className="num tabular-nums">{money(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="No transactions yet"
              description="Record your first payment or expense to get started."
              action={<Button href="/income">Record income</Button>}
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming recurring"
            action={<Link href="/recurring" className="text-sm text-slate-500 hover:text-slate-800">Manage</Link>}
          />
          {recurring && recurring.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recurring.map((r) => (
                <li key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-400">
                      {titleize(r.frequency)} · next {shortDate(r.next_run_date)}
                    </div>
                  </div>
                  <div className="text-sm tabular-nums text-slate-700">{money(r.amount)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No recurring expenses" description="Add rent, software, etc." />
          )}
        </Card>
      </div>
    </div>
  );
}
