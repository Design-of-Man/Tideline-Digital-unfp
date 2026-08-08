import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums, Json } from "@/types/database";

export type Db = SupabaseClient<Database>;

export type LedgerLine = {
  account_id: string;
  debit?: number;
  credit?: number;
  memo?: string | null;
};

// Post a balanced entry through the trusted DB function. Returns entry id.
export async function postEntry(
  supabase: Db,
  params: {
    date: string;
    memo: string;
    lines: LedgerLine[];
    source?: Enums<"entry_source">;
    sourceId?: string | null;
    reference?: string | null;
  }
): Promise<string> {
  const lines = params.lines.map((l) => ({
    account_id: l.account_id,
    debit: Number(l.debit ?? 0),
    credit: Number(l.credit ?? 0),
    memo: l.memo ?? null,
  }));
  const { data, error } = await supabase.rpc("create_journal_entry", {
    p_date: params.date,
    p_memo: params.memo,
    p_lines: lines as unknown as Json,
    p_source: params.source ?? "manual",
    p_source_id: params.sourceId ?? undefined,
    p_reference: params.reference ?? undefined,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

// Round to cents to avoid floating point drift breaking the balance check.
export function cents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
