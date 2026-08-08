"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents } from "@/lib/ledger";
import { num, str } from "@/lib/format";

export async function createManualEntry(formData: FormData) {
  const supabase = await createClient();
  const date = str(formData.get("entry_date")) ?? new Date().toISOString().slice(0, 10);
  const memo = str(formData.get("memo")) ?? "Journal entry";
  const reference = str(formData.get("reference"));

  const accountIds = formData.getAll("account_id").map(String);
  const debits = formData.getAll("debit").map((v) => num(v));
  const credits = formData.getAll("credit").map((v) => num(v));

  const lines = accountIds
    .map((account_id, i) => ({
      account_id,
      debit: cents(debits[i] || 0),
      credit: cents(credits[i] || 0),
    }))
    .filter((l) => l.account_id && (l.debit > 0 || l.credit > 0));

  if (lines.length < 2) {
    redirect("/transactions/new?error=" + encodeURIComponent("Add at least two lines with amounts."));
  }
  const totalD = cents(lines.reduce((s, l) => s + l.debit, 0));
  const totalC = cents(lines.reduce((s, l) => s + l.credit, 0));
  if (totalD !== totalC) {
    redirect("/transactions/new?error=" + encodeURIComponent(`Not balanced: debits ${totalD} ≠ credits ${totalC}.`));
  }

  try {
    await postEntry(supabase, { date, memo, lines, source: "manual", reference });
  } catch (e) {
    redirect("/transactions/new?error=" + encodeURIComponent((e as Error).message));
  }
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function deleteEntry(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (id) {
    await supabase.from("journal_entries").delete().eq("id", id);
    revalidatePath("/transactions");
  }
  redirect("/transactions");
}
