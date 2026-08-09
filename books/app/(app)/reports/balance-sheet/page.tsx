import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { PeriodForm } from "@/components/period-form";
import { money, shortDate, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BalanceSheet({
  searchParams,
}: {
  searchParams: Promise<{ as_of?: string }>;
}) {
  const sp = await searchParams;
  const asOf = sp.as_of || todayISO();

  const supabase = await createClient();
  const [{ data: balances }, { data: pnl }] = await Promise.all([
    supabase.rpc("f_account_balances", { p_as_of: asOf }),
    supabase.rpc("f_pnl", { p_start: "1900-01-01", p_end: asOf }),
  ]);

  const rows = (balances ?? []).filter((b) => Number(b.balance) !== 0);
  const assets = rows.filter((b) => b.type === "asset");
  const liabilities = rows.filter((b) => b.type === "liability");
  const equity = rows.filter((b) => b.type === "equity");

  const sum = (arr: typeof rows) => arr.reduce((s, b) => s + Number(b.balance), 0);
  const totalAssets = sum(assets);
  const totalLiab = sum(liabilities);
  const totalEquityAccts = sum(equity);

  // Net income (revenue - expenses) closes the accounting equation into equity.
  const netIncome = (pnl ?? []).reduce(
    (s, r) => s + (r.type === "revenue" ? Number(r.amount) : -Number(r.amount)),
    0
  );
  const totalEquity = totalEquityAccts + netIncome;

  return (
    <div>
      <PageHeader title="Balance Sheet" description={`As of ${shortDate(asOf)}`} />
      <PeriodForm asOf={asOf} action="/reports/balance-sheet" />

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <Card>
          <div className="px-5 py-3 border-b border-border font-medium text-foreground">Assets</div>
          <table className="data">
            <tbody>
              {assets.map((b) => <Row key={b.account_id} name={`${b.code} · ${b.name}`} amount={Number(b.balance)} />)}
              <Total label="Total assets" amount={totalAssets} />
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="px-5 py-3 border-b border-border font-medium text-foreground">Liabilities &amp; Equity</div>
          <table className="data">
            <tbody>
              <Section label="Liabilities" />
              {liabilities.map((b) => <Row key={b.account_id} name={`${b.code} · ${b.name}`} amount={Number(b.balance)} />)}
              <Total label="Total liabilities" amount={totalLiab} />

              <Section label="Equity" />
              {equity.map((b) => <Row key={b.account_id} name={`${b.code} · ${b.name}`} amount={Number(b.balance)} />)}
              <Row name="Net income (current period)" amount={netIncome} />
              <Total label="Total equity" amount={totalEquity} />

              <tr className="bg-primary text-primary-foreground">
                <td className="px-5 py-3 font-semibold">Total liabilities &amp; equity</td>
                <td className="px-5 py-3 num tabular-nums font-semibold">{money(totalLiab + totalEquity)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      {Math.abs(totalAssets - (totalLiab + totalEquity)) > 0.01 && (
        <p className="text-sm text-destructive mt-4">
          Note: assets and liabilities+equity differ by {money(totalAssets - (totalLiab + totalEquity))}. This usually
          means an opening balance still needs to be entered.
        </p>
      )}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <tr className="bg-muted">
      <td colSpan={2} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</td>
    </tr>
  );
}
function Row({ name, amount }: { name: string; amount: number }) {
  return (
    <tr>
      <td className="px-5 py-2 text-foreground">{name}</td>
      <td className="px-5 py-2 num tabular-nums text-foreground">{money(amount)}</td>
    </tr>
  );
}
function Total({ label, amount }: { label: string; amount: number }) {
  return (
    <tr className="border-t border-border font-medium">
      <td className="px-5 py-2 text-foreground">{label}</td>
      <td className="px-5 py-2 num tabular-nums text-foreground">{money(amount)}</td>
    </tr>
  );
}
