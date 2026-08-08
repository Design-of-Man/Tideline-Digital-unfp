"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents } from "@/lib/ledger";
import { num, str } from "@/lib/format";
import type { Enums } from "@/types/database";

export async function createRecurring(formData: FormData) {
  const supabase = await createClient();
  const name = str(formData.get("name"));
  const amount = cents(num(formData.get("amount")));
  const category_account_id = str(formData.get("category_account_id"));
  const paid_from_account_id = str(formData.get("paid_from_account_id"));
  const start_date = str(formData.get("start_date")) ?? new Date().toISOString().slice(0, 10);

  if (!name || !amount || !category_account_id || !paid_from_account_id) {
    redirect("/recurring?error=" + encodeURIComponent("Name, amount, category and payment account are required."));
  }

  // Inherit tax metadata from the chosen expense account.
  const { data: acct } = await supabase
    .from("accounts")
    .select("tax_category_id, deductible_pct")
    .eq("id", category_account_id!)
    .maybeSingle();

  const { error } = await supabase.from("recurring_expenses").insert({
    name: name!,
    amount,
    category_account_id: category_account_id!,
    paid_from_account_id: paid_from_account_id!,
    vendor_id: str(formData.get("vendor_id")),
    frequency: (str(formData.get("frequency")) ?? "monthly") as Enums<"recurrence_frequency">,
    interval_count: Math.max(1, num(formData.get("interval_count"), 1)),
    start_date,
    next_run_date: start_date,
    end_date: str(formData.get("end_date")),
    auto_post: formData.get("auto_post") === "on",
    tax_category_id: acct?.tax_category_id ?? null,
    deductible_pct: acct?.deductible_pct ?? 100,
    memo: str(formData.get("memo")),
  });
  if (error) redirect("/recurring?error=" + encodeURIComponent(error.message));
  revalidatePath("/recurring");
  redirect("/recurring");
}

// Post a single occurrence of a template right now and advance its schedule.
export async function postRecurringNow(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/recurring");
  const { data: r } = await supabase.from("recurring_expenses").select("*").eq("id", id).maybeSingle();
  if (!r) redirect("/recurring");

  const date = new Date().toISOString().slice(0, 10);
  const { data: exp } = await supabase
    .from("expenses")
    .insert({
      vendor_id: r.vendor_id,
      expense_date: date,
      amount: r.amount,
      category_account_id: r.category_account_id,
      paid_from_account_id: r.paid_from_account_id,
      status: "paid",
      memo: r.memo ?? r.name,
      tax_category_id: r.tax_category_id,
      deductible_pct: r.deductible_pct,
      recurring_id: r.id,
    })
    .select("id")
    .single();

  if (exp) {
    const je = await postEntry(supabase, {
      date,
      memo: r.memo ?? r.name,
      lines: [
        { account_id: r.category_account_id, debit: Number(r.amount) },
        { account_id: r.paid_from_account_id, credit: Number(r.amount) },
      ],
      source: "recurring_expense",
      sourceId: exp.id,
      reference: r.name,
    });
    await supabase.from("expenses").update({ journal_entry_id: je }).eq("id", exp.id);
    await supabase
      .from("recurring_expenses")
      .update({ last_run_date: date })
      .eq("id", r.id);
  }
  revalidatePath("/recurring");
  revalidatePath("/expenses");
  redirect("/expenses");
}

// Generate everything due for auto-post templates (what a daily cron would run).
export async function generateDue() {
  const supabase = await createClient();
  await supabase.rpc("generate_due_recurring_expenses", {
    p_through: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/recurring");
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function toggleRecurring(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id) {
    await supabase.from("recurring_expenses").update({ is_active: !active }).eq("id", id);
    revalidatePath("/recurring");
  }
}

export async function deleteRecurring(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (id) {
    await supabase.from("recurring_expenses").delete().eq("id", id);
    revalidatePath("/recurring");
  }
  redirect("/recurring");
}
