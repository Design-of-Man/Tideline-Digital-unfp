"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents } from "@/lib/ledger";
import { num, str } from "@/lib/format";
import type { Enums } from "@/types/database";

export async function createTaxPayment(formData: FormData) {
  const supabase = await createClient();
  const amount = cents(num(formData.get("amount")));
  const pay_from_account_id = str(formData.get("pay_from_account_id"));
  const tax_account_id = str(formData.get("tax_account_id"));
  const date = str(formData.get("payment_date")) ?? new Date().toISOString().slice(0, 10);

  if (!amount || amount <= 0 || !pay_from_account_id || !tax_account_id) {
    redirect("/taxes?error=" + encodeURIComponent("Amount, bank account and tax account are required."));
  }

  const { data: tp, error } = await supabase
    .from("tax_payments")
    .insert({
      tax_type: (str(formData.get("tax_type")) ?? "other") as Enums<"tax_payment_type">,
      period_label: str(formData.get("period_label")),
      payment_date: date,
      amount,
      pay_from_account_id,
      tax_account_id,
      reference: str(formData.get("reference")),
      memo: str(formData.get("memo")),
    })
    .select("id")
    .single();
  if (error || !tp) redirect("/taxes?error=" + encodeURIComponent(error?.message ?? "Failed."));

  try {
    // Debit the chosen tax account (a liability being settled, or a tax expense);
    // credit the bank it was paid from.
    const je = await postEntry(supabase, {
      date,
      memo: str(formData.get("memo")) || "Tax payment",
      lines: [
        { account_id: tax_account_id, debit: amount },
        { account_id: pay_from_account_id, credit: amount },
      ],
      source: "tax_payment",
      sourceId: tp.id,
      reference: str(formData.get("reference")),
    });
    await supabase.from("tax_payments").update({ journal_entry_id: je }).eq("id", tp.id);
  } catch (e) {
    await supabase.from("tax_payments").delete().eq("id", tp.id);
    redirect("/taxes?error=" + encodeURIComponent((e as Error).message));
  }
  revalidatePath("/taxes");
  redirect("/taxes");
}

export async function deleteTaxPayment(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/taxes");
  const { data: tp } = await supabase.from("tax_payments").select("journal_entry_id").eq("id", id).maybeSingle();
  if (tp?.journal_entry_id) await supabase.from("journal_entries").delete().eq("id", tp.journal_entry_id);
  await supabase.from("tax_payments").delete().eq("id", id);
  revalidatePath("/taxes");
  redirect("/taxes");
}
