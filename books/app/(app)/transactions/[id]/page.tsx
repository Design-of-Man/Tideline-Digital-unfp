import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { money, shortDate, titleize } from "@/lib/format";
import { deleteEntry } from "../actions";

export const dynamic = "force-dynamic";

export default async function EntryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("*, journal_lines(id, debit, credit, memo, line_no, accounts(code, name))")
    .eq("id", id)
    .maybeSingle();

  if (!entry) notFound();

  const lines = (entry.journal_lines ?? []).sort(
    (a: { line_no: number }, b: { line_no: number }) => a.line_no - b.line_no
  );
  const totalD = lines.reduce((s: number, l: { debit: number }) => s + Number(l.debit), 0);
  const totalC = lines.reduce((s: number, l: { credit: number }) => s + Number(l.credit), 0);

  return (
    <div>
      <PageHeader
        title={entry.memo || "Journal entry"}
        description={`${shortDate(entry.entry_date)} · ${titleize(entry.source)}${entry.reference ? ` · Ref ${entry.reference}` : ""}`}
        action={<Button href="/transactions" variant="secondary">Back</Button>}
      />

      <Card className="max-w-3xl">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Badge>{titleize(entry.source)}</Badge>
          <span className="text-xs text-muted-foreground">Entry {entry.id.slice(0, 8)}</span>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Account</th>
              <th>Memo</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l: any) => (
              <tr key={l.id}>
                <td className="font-medium text-foreground">
                  <span className="font-mono text-xs text-muted-foreground mr-2">{l.accounts?.code}</span>
                  {l.accounts?.name}
                </td>
                <td className="text-muted-foreground">{l.memo || "—"}</td>
                <td className="num tabular-nums">{Number(l.debit) ? money(l.debit) : ""}</td>
                <td className="num tabular-nums">{Number(l.credit) ? money(l.credit) : ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted font-medium">
              <td colSpan={2} className="px-5 py-2.5 text-muted-foreground">Totals</td>
              <td className="num tabular-nums px-5 py-2.5">{money(totalD)}</td>
              <td className="num tabular-nums px-5 py-2.5">{money(totalC)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="mt-4">
        <form action={deleteEntry}>
          <input type="hidden" name="id" value={entry.id} />
          <SubmitButton variant="danger">Delete entry</SubmitButton>
        </form>
        <p className="text-xs text-muted-foreground mt-1">
          Deleting reverses this entry from the ledger. If it came from an invoice, expense, etc.,
          delete it from that record instead to keep things consistent.
        </p>
      </div>
    </div>
  );
}
