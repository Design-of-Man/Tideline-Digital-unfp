import { createClient } from "@/lib/supabase/server";
import { getTaxCategories } from "@/lib/data";
import { PageHeader, Card, Field, Input, Select, Textarea, FormError, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ACCOUNT_TYPE_LABEL, SUBTYPE_LABEL, money } from "@/lib/format";
import { createAccount } from "./actions";

export const dynamic = "force-dynamic";

const SUBTYPES_BY_TYPE: Record<string, string[]> = {
  asset: ["bank", "accounts_receivable", "other_current_asset", "fixed_asset", "other_asset"],
  liability: ["accounts_payable", "credit_card", "payroll_liability", "tax_liability", "other_current_liability", "long_term_liability"],
  equity: ["equity", "retained_earnings", "distributions", "contributions"],
  revenue: ["income", "other_income"],
  expense: ["cogs", "operating_expense", "payroll_expense", "tax_expense", "other_expense"],
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: accounts }, { data: balances }, taxCats] = await Promise.all([
    supabase.from("accounts").select("*").order("code"),
    supabase.rpc("f_account_balances", { p_as_of: today }),
    getTaxCategories(),
  ]);

  const balById = new Map((balances ?? []).map((b) => [b.account_id, Number(b.balance)]));
  const order = ["asset", "liability", "equity", "revenue", "expense"];
  const grouped = order.map((t) => ({
    type: t,
    rows: (accounts ?? []).filter((a) => a.type === t),
  }));

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Every transaction posts to one of these accounts. Pre-loaded for an S-Corp; add your own as needed."
      />

      {error && <div className="mb-4"><FormError message={error} /></div>}

      <details className="mb-6 group">
        <summary className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-slate-700 list-none">
          + New account
        </summary>
        <Card className="mt-3 p-5">
          <form action={createAccount} className="grid sm:grid-cols-2 gap-4">
            <Field label="Code"><Input name="code" placeholder="6600" required /></Field>
            <Field label="Name"><Input name="name" placeholder="Marketing Software" required /></Field>
            <Field label="Type">
              <Select name="type" required defaultValue="expense">
                {order.map((t) => (
                  <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Subtype" hint="Determines grouping on reports.">
              <Select name="subtype" required>
                {Object.entries(SUBTYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tax category (expenses)" hint="Drives the write-off report." className="sm:col-span-1">
              <Select name="tax_category_id" defaultValue="">
                <option value="">— None —</option>
                {taxCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Deductible %" hint="e.g. 50 for meals."><Input name="deductible_pct" type="number" min={0} max={100} defaultValue={100} /></Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="is_tax_deductible" defaultChecked /> Tax-deductible expense
            </label>
            <Field label="Description" className="sm:col-span-2"><Textarea name="description" rows={2} /></Field>
            <div className="sm:col-span-2"><SubmitButton>Create account</SubmitButton></div>
          </form>
        </Card>
      </details>

      <div className="space-y-6">
        {grouped.map((g) => (
          <Card key={g.type}>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-medium text-slate-800">{ACCOUNT_TYPE_LABEL[g.type]}</h2>
              <span className="text-xs text-slate-400">{g.rows.length} accounts</span>
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th className="w-20">Code</th>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Tax</th>
                  <th className="num">Balance</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((a) => (
                  <tr key={a.id} className={a.is_active ? "" : "opacity-40"}>
                    <td className="font-mono text-xs text-slate-500">{a.code}</td>
                    <td className="font-medium text-slate-800">
                      {a.name}
                      {a.is_system && <span className="ml-2 text-[0.65rem] text-slate-400">system</span>}
                    </td>
                    <td className="text-slate-500">{SUBTYPE_LABEL[a.subtype]}</td>
                    <td>
                      {a.is_tax_deductible ? (
                        <Badge tone="green">Deductible{a.deductible_pct < 100 ? ` ${a.deductible_pct}%` : ""}</Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="num tabular-nums">{money(balById.get(a.id) ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}
