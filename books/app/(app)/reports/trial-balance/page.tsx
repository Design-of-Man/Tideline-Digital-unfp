import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { PeriodForm } from "@/components/period-form";
import { money, shortDate, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrialBalance({
  searchParams,
}: {
  searchParams: Promise<{ as_of?: string }>;
}) {
  const sp = await searchParams;
  const asOf = sp.as_of || todayISO();

  const supabase = await createClient();
  const { data: balances } = await supabase.rpc("f_account_balances", { p_as_of: asOf });

  // Present each account on its natural side.
  const rows = (balances ?? [])
    .filter((b) => Number(b.debit) !== 0 || Number(b.credit) !== 0)
    .map((b) => {
      const net = Number(b.debit) - Number(b.credit);
      return {
        ...b,
        debitCol: net > 0 ? net : 0,
        creditCol: net < 0 ? -net : 0,
      };
    });
  const totalD = rows.reduce((s, r) => s + r.debitCol, 0);
  const totalC = rows.reduce((s, r) => s + r.creditCol, 0);

  return (
    <div>
      <PageHeader title="Trial Balance" description={`As of ${shortDate(asOf)} — proof that the ledger is balanced.`} />
      <PeriodForm asOf={asOf} action="/reports/trial-balance" />

      <Card className="max-w-2xl">
        <table className="data">
          <thead>
            <tr><th>Account</th><th className="num">Debit</th><th className="num">Credit</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account_id}>
                <td className="text-slate-700"><span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>{r.name}</td>
                <td className="num tabular-nums">{r.debitCol ? money(r.debitCol) : ""}</td>
                <td className="num tabular-nums">{r.creditCol ? money(r.creditCol) : ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-semibold">
              <td className="px-5 py-3">Totals</td>
              <td className="px-5 py-3 num tabular-nums">{money(totalD)}</td>
              <td className="px-5 py-3 num tabular-nums">{money(totalC)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
      <p className={`text-sm mt-3 ${Math.abs(totalD - totalC) < 0.01 ? "text-emerald-600" : "text-rose-600"}`}>
        {Math.abs(totalD - totalC) < 0.01 ? "✓ Debits equal credits — the books are in balance." : `Out of balance by ${money(totalD - totalC)}.`}
      </p>
    </div>
  );
}
