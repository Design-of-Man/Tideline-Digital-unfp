"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents } from "@/lib/ledger";
import { num, str } from "@/lib/format";

export async function createExpense(formData: FormData) {
  const supabase = await createClient();
  const amount = cents(num(formData.get("amount")));
  const category_account_id = str(formData.get("category_account_id"));
  const paid_from_account_id = str(formData.get("paid_from_account_id"));
  const date = str(formData.get("expense_date")) ?? new Date().toISOString().slice(0, 10);

  if (!amount || amount <= 0 || !category_account_id || !paid_from_account_id) {
    redirect("/expenses?error=" + encodeURIComponent("Amount, category and payment account are required."));
  }

  // Inherit tax metadata from the expense account when not explicitly set.
  let tax_category_id = str(formData.get("tax_category_id"));
  let deductible_pct = formData.get("deductible_pct") ? num(formData.get("deductible_pct")) : null;
  if (tax_category_id === null || deductible_pct === null) {
    const { data: acct } = await supabase
      .from("accounts")
      .select("tax_category_id, deductible_pct")
      .eq("id", category_account_id!)
      .maybeSingle();
    if (tax_category_id === null) tax_category_id = acct?.tax_category_id ?? null;
    if (deductible_pct === null) deductible_pct = acct?.deductible_pct ?? 100;
  }

  const status = (str(formData.get("status")) as "paid" | "unpaid") ?? "paid";
  const memo = str(formData.get("memo"));
  const reference = str(formData.get("reference"));
  const vendor_id = str(formData.get("vendor_id"));

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      vendor_id,
      expense_date: date,
      amount,
      category_account_id: category_account_id!,
      paid_from_account_id: paid_from_account_id!,
      status,
      memo,
      reference,
      tax_category_id,
      deductible_pct: deductible_pct ?? 100,
    })
    .select("id")
    .single();

  if (error || !expense) {
    redirect("/expenses?error=" + encodeURIComponent(error?.message ?? "Could not save expense."));
  }

  try {
    const je = await postEntry(supabase, {
      date,
      memo: memo || "Expense",
      lines: [
        { account_id: category_account_id!, debit: amount },
        { account_id: paid_from_account_id!, credit: amount },
      ],
      source: "expense",
      sourceId: expense.id,
      reference,
    });
    await supabase.from("expenses").update({ journal_entry_id: je }).eq("id", expense.id);
  } catch (e) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    redirect("/expenses?error=" + encodeURIComponent((e as Error).message));
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  redirect("/expenses");
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (id) {
    const { data: exp } = await supabase.from("expenses").select("journal_entry_id").eq("id", id).maybeSingle();
    if (exp?.journal_entry_id) {
      await supabase.from("journal_entries").delete().eq("id", exp.journal_entry_id);
    }
    await supabase.from("expenses").delete().eq("id", id);
    revalidatePath("/expenses");
  }
  redirect("/expenses");
}
