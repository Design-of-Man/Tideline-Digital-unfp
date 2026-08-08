import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { PeriodForm } from "@/components/period-form";
import { money, shortDate, firstOfYearISO, todayISO, SUBTYPE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PnlReport({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const start = sp.start || firstOfYearISO();
  const end = sp.end || todayISO();

  const supabase = await createClient();
  const { data: rows } = await supabase.rpc("f_pnl", { p_start: start, p_end: end });

  const revenue = (rows ?? []).filter((r) => r.type === "revenue" && Number(r.amount) !== 0);
  const expenses = (rows ?? []).filter((r) => r.type === "expense" && Number(r.amount) !== 0);
  const totalRev = revenue.reduce((s, r) => s + Number(r.amount), 0);
  const totalExp = expenses.reduce((s, r) => s + Number(r.amount), 0);
  const net = totalRev - totalExp;

  return (
    <div>
      <PageHeader title="Profit & Loss" description={`${shortDate(start)} – ${shortDate(end)}`} />
      <PeriodForm start={start} end={end} action="/reports/pnl" />

      <Card className="max-w-2xl">
        <table className="data">
          <tbody>
            <Section label="Revenue" />
            {revenue.map((r) => (
              <Row key={r.account_id} name={`${r.code} · ${r.name}`} amount={Number(r.amount)} />
            ))}
            <Total label="Total revenue" amount={totalRev} />

            <Section label="Expenses" />
            {expenses.map((r) => (
              <Row key={r.account_id} name={`${r.code} · ${r.name}`} sub={SUBTYPE_LABEL[r.subtype]} amount={Number(r.amount)} />
            ))}
            <Total label="Total expenses" amount={totalExp} />

            <tr className="bg-slate-900 text-white">
              <td className="px-5 py-3 font-semibold">Net income</td>
              <td className="px-5 py-3 num tabular-nums font-semibold">{money(net)}</td>
            </tr>
          </tbody>
        </table>
      </Card>
      {(revenue.length === 0 && expenses.length === 0) && (
        <p className="text-sm text-slate-400 mt-4">No activity in this period.</p>
      )}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={2} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</td>
    </tr>
  );
}
function Row({ name, sub, amount }: { name: string; sub?: string; amount: number }) {
  return (
    <tr>
      <td className="px-5 py-2 text-slate-700">{name}{sub && <span className="text-xs text-slate-400 ml-2">{sub}</span>}</td>
      <td className="px-5 py-2 num tabular-nums text-slate-700">{money(amount)}</td>
    </tr>
  );
}
function Total({ label, amount }: { label: string; amount: number }) {
  return (
    <tr className="border-t border-slate-200 font-medium">
      <td className="px-5 py-2 text-slate-800">{label}</td>
      <td className="px-5 py-2 num tabular-nums text-slate-800">{money(amount)}</td>
    </tr>
  );
}
