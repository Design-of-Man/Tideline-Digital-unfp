import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { PeriodForm } from "@/components/period-form";
import { money, shortDate, firstOfYearISO, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeductionsReport({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const start = sp.start || firstOfYearISO();
  const end = sp.end || todayISO();

  const supabase = await createClient();
  const { data: rows } = await supabase.rpc("f_deductions", { p_start: start, p_end: end });

  const data = rows ?? [];
  const totalSpent = data.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalDeductible = data.reduce((s, r) => s + Number(r.deductible_amount), 0);

  return (
    <div>
      <PageHeader
        title="Tax Write-offs"
        description={`Deductible business expenses by IRS category · ${shortDate(start)} – ${shortDate(end)}. Includes recorded expenses and approved employee reimbursements.`}
      />
      <PeriodForm start={start} end={end} action="/reports/deductions" />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total spent</div>
          <div className="text-2xl font-semibold mt-1.5 text-slate-900">{money(totalSpent)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Deductible</div>
          <div className="text-2xl font-semibold mt-1.5 text-emerald-600">{money(totalDeductible)}</div>
        </Card>
      </div>

      <Card className="max-w-3xl">
        {data.length > 0 ? (
          <table className="data">
            <thead>
              <tr><th>Category</th><th>IRS line</th><th className="num">Spent</th><th className="num">Deductible</th></tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.tax_category_id ?? `none-${i}`}>
                  <td className="font-medium text-slate-800">{r.category_name ?? "Uncategorized"}</td>
                  <td className="text-slate-400 text-xs">{r.form_line ?? "—"}</td>
                  <td className="num tabular-nums text-slate-600">{money(r.total_amount)}</td>
                  <td className="num tabular-nums text-emerald-600">{money(r.deductible_amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-semibold">
                <td className="px-5 py-3" colSpan={2}>Total</td>
                <td className="px-5 py-3 num tabular-nums">{money(totalSpent)}</td>
                <td className="px-5 py-3 num tabular-nums">{money(totalDeductible)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <EmptyState title="No deductible expenses in this period" description="Record expenses with a tax category to see them here." />
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-4 max-w-3xl">
        This summary is a bookkeeping aid, not tax advice. Meals are shown at 50% deductible by default; confirm current
        rules and your specific situation with your CPA before filing.
      </p>
    </div>
  );
}
