import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";
import { money, shortDate, titleize } from "@/lib/format";

export const dynamic = "force-dynamic";

const SOURCE_TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  payment_received: "green",
  invoice: "blue",
  expense: "amber",
  recurring_expense: "amber",
  payroll: "blue",
  distribution: "red",
  employee_expense: "amber",
  tax_payment: "red",
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, entry_date, memo, source, reference, journal_lines(debit)")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="The general ledger — every posted journal entry, newest first."
        action={<Button href="/transactions/new">+ New entry</Button>}
      />
      <Card>
        {entries && entries.length > 0 ? (
          <table className="data">
            <thead>
              <tr>
                <th className="w-28">Date</th>
                <th>Description</th>
                <th>Source</th>
                <th>Ref</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const amount = (e.journal_lines ?? []).reduce(
                  (s: number, l: { debit: number }) => s + Number(l.debit),
                  0
                );
                return (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-slate-500">{shortDate(e.entry_date)}</td>
                    <td>
                      <Link href={`/transactions/${e.id}`} className="font-medium text-slate-800 hover:underline">
                        {e.memo || "—"}
                      </Link>
                    </td>
                    <td><Badge tone={SOURCE_TONE[e.source] ?? "slate"}>{titleize(e.source)}</Badge></td>
                    <td className="text-slate-400 text-xs">{e.reference || "—"}</td>
                    <td className="num tabular-nums">{money(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Post a manual entry, or record income/expenses and they'll appear here."
            action={<Button href="/transactions/new">+ New entry</Button>}
          />
        )}
      </Card>
    </div>
  );
}
