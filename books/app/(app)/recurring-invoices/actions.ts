"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { num, str } from "@/lib/format";
import { cents } from "@/lib/ledger";
import type { Enums } from "@/types/database";

const ERR = (m: string) => redirect("/recurring-invoices?error=" + encodeURIComponent(m));

export async function createRecurringInvoice(formData: FormData) {
  const supabase = await createClient();
  const contact_id = str(formData.get("contact_id"));
  const name = str(formData.get("name"));
  const amount = cents(num(formData.get("amount")));
  const income_account_id = str(formData.get("income_account_id"));
  const start_date = str(formData.get("start_date")) ?? new Date().toISOString().slice(0, 10);

  if (!contact_id || !name || !amount || amount <= 0 || !income_account_id) {
    ERR("Customer, name, amount and income account are required.");
  }

  const { error } = await supabase.from("recurring_invoices").insert({
    contact_id: contact_id!,
    name: name!,
    description: str(formData.get("description")),
    amount,
    income_account_id: income_account_id!,
    invoice_type: (str(formData.get("invoice_type")) ?? "monthly") as Enums<"invoice_kind">,
    frequency: (str(formData.get("frequency")) ?? "monthly") as Enums<"recurrence_frequency">,
    interval_count: Math.max(1, num(formData.get("interval_count"), 1)),
    net_days: Math.max(0, num(formData.get("net_days"), 15)),
    start_date,
    next_run_date: start_date,
    end_date: str(formData.get("end_date")),
    terms: str(formData.get("terms")),
    memo: str(formData.get("memo")),
  });
  if (error) ERR(error.message);
  revalidatePath("/recurring-invoices");
  redirect("/recurring-invoices");
}

// Generate draft invoices for everything due (all templates, or one).
export async function generateDueInvoices(formData: FormData) {
  const supabase = await createClient();
  const one = str(formData.get("id"));
  const { error } = await supabase.rpc("generate_due_recurring_invoices", {
    p_through: new Date().toISOString().slice(0, 10),
    p_recurring_id: one ?? undefined,
  });
  if (error) ERR(error.message);
  revalidatePath("/recurring-invoices");
  redirect("/recurring-invoices");
}

export async function toggleRecurringInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id) {
    await supabase.from("recurring_invoices").update({ is_active: !active }).eq("id", id);
    revalidatePath("/recurring-invoices");
  }
  redirect("/recurring-invoices");
}

export async function deleteRecurringInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (id) {
    await supabase.from("recurring_invoices").delete().eq("id", id);
    revalidatePath("/recurring-invoices");
  }
  redirect("/recurring-invoices");
}

// Finalize a generated draft: number it, post the journal entry, open it.
export async function postDraft(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/recurring-invoices");
  const { error } = await supabase.rpc("post_invoice", { p_invoice: id });
  if (error) ERR(error.message);
  revalidatePath("/recurring-invoices");
  revalidatePath("/income");
  redirect(`/invoices/${id}?posted=1`);
}

export async function deleteDraft(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/recurring-invoices");
  // Only unposted drafts are safe to remove here.
  const { data: inv } = await supabase
    .from("invoices")
    .select("status, journal_entry_id")
    .eq("id", id)
    .maybeSingle();
  if (inv && inv.status === "draft" && !inv.journal_entry_id) {
    await supabase.from("invoice_lines").delete().eq("invoice_id", id);
    await supabase.from("invoices").delete().eq("id", id);
  }
  revalidatePath("/recurring-invoices");
  redirect("/recurring-invoices");
}
