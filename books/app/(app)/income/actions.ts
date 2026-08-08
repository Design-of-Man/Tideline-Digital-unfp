"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents } from "@/lib/ledger";
import { num, str } from "@/lib/format";
import type { Enums } from "@/types/database";

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const name = str(formData.get("name"));
  if (!name) redirect("/income?error=" + encodeURIComponent("Customer name is required."));
  const { error } = await supabase.from("contacts").insert({
    name: name!,
    type: "customer",
    email: str(formData.get("email")),
    is_1099: false,
  });
  if (error) redirect("/income?error=" + encodeURIComponent(error.message));
  revalidatePath("/income");
  redirect("/income");
}

async function arAccountId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .eq("subtype", "accounts_receivable")
    .order("code")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const contact_id = str(formData.get("contact_id"));
  const income_account_id = str(formData.get("income_account_id"));
  const amount = cents(num(formData.get("amount")));
  const issue_date = str(formData.get("issue_date")) ?? new Date().toISOString().slice(0, 10);
  const description = str(formData.get("description"));

  if (!contact_id || !income_account_id || !amount || amount <= 0) {
    redirect("/income?error=" + encodeURIComponent("Customer, income account and amount are required."));
  }
  const ar = await arAccountId(supabase);
  if (!ar) redirect("/income?error=" + encodeURIComponent("No Accounts Receivable account found."));

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      contact_id,
      number: str(formData.get("number")),
      issue_date,
      due_date: str(formData.get("due_date")),
      status: "open",
      memo: description,
      subtotal: amount,
      total: amount,
      ar_account_id: ar,
    })
    .select("id")
    .single();
  if (error || !invoice) redirect("/income?error=" + encodeURIComponent(error?.message ?? "Failed."));

  await supabase.from("invoice_lines").insert({
    invoice_id: invoice.id,
    description,
    quantity: 1,
    unit_price: amount,
    amount,
    income_account_id,
  });

  try {
    const je = await postEntry(supabase, {
      date: issue_date,
      memo: description || "Invoice",
      lines: [
        { account_id: ar, debit: amount },
        { account_id: income_account_id, credit: amount },
      ],
      source: "invoice",
      sourceId: invoice.id,
      reference: str(formData.get("number")),
    });
    await supabase.from("invoices").update({ journal_entry_id: je }).eq("id", invoice.id);
  } catch (e) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    redirect("/income?error=" + encodeURIComponent((e as Error).message));
  }
  revalidatePath("/income");
  revalidatePath("/");
  redirect("/income");
}

export async function recordPayment(formData: FormData) {
  const supabase = await createClient();
  const amount = cents(num(formData.get("amount")));
  const deposit_account_id = str(formData.get("deposit_account_id"));
  const invoice_id = str(formData.get("invoice_id"));
  const income_account_id = str(formData.get("income_account_id"));
  const date = str(formData.get("payment_date")) ?? new Date().toISOString().slice(0, 10);

  if (!amount || amount <= 0 || !deposit_account_id) {
    redirect("/income?error=" + encodeURIComponent("Amount and deposit account are required."));
  }
  // Must credit AR (if paying an invoice) or an income account (direct sale).
  let creditAccount = income_account_id;
  let contact_id = str(formData.get("contact_id"));
  if (invoice_id) {
    const ar = await arAccountId(supabase);
    creditAccount = ar;
    const { data: inv } = await supabase.from("invoices").select("contact_id").eq("id", invoice_id).maybeSingle();
    if (inv?.contact_id) contact_id = inv.contact_id;
  }
  if (!creditAccount) {
    redirect("/income?error=" + encodeURIComponent("Choose an invoice or an income account."));
  }

  const { data: payment, error } = await supabase
    .from("payments_received")
    .insert({
      contact_id,
      invoice_id,
      payment_date: date,
      amount,
      method: (str(formData.get("method")) ?? "bank_transfer") as Enums<"payment_method">,
      reference: str(formData.get("reference")),
      memo: str(formData.get("memo")),
      deposit_account_id,
      income_account_id: invoice_id ? null : income_account_id,
    })
    .select("id")
    .single();
  if (error || !payment) redirect("/income?error=" + encodeURIComponent(error?.message ?? "Failed."));

  try {
    const je = await postEntry(supabase, {
      date,
      memo: str(formData.get("memo")) || "Payment received",
      lines: [
        { account_id: deposit_account_id, debit: amount },
        { account_id: creditAccount!, credit: amount },
      ],
      source: "payment_received",
      sourceId: payment.id,
      reference: str(formData.get("reference")),
    });
    await supabase.from("payments_received").update({ journal_entry_id: je }).eq("id", payment.id);
  } catch (e) {
    await supabase.from("payments_received").delete().eq("id", payment.id);
    redirect("/income?error=" + encodeURIComponent((e as Error).message));
  }

  // Update the invoice's paid amount / status.
  if (invoice_id) {
    const { data: inv } = await supabase.from("invoices").select("total, amount_paid").eq("id", invoice_id).maybeSingle();
    if (inv) {
      const paid = cents(Number(inv.amount_paid) + amount);
      const status = paid >= Number(inv.total) ? "paid" : paid > 0 ? "partial" : "open";
      await supabase.from("invoices").update({ amount_paid: paid, status }).eq("id", invoice_id);
    }
  }
  revalidatePath("/income");
  revalidatePath("/");
  redirect("/income");
}

export async function deletePayment(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/income");
  const { data: p } = await supabase.from("payments_received").select("journal_entry_id, invoice_id, amount").eq("id", id).maybeSingle();
  if (p?.journal_entry_id) await supabase.from("journal_entries").delete().eq("id", p.journal_entry_id);
  if (p?.invoice_id) {
    const { data: inv } = await supabase.from("invoices").select("total, amount_paid").eq("id", p.invoice_id).maybeSingle();
    if (inv) {
      const paid = cents(Number(inv.amount_paid) - Number(p.amount));
      const status = paid >= Number(inv.total) ? "paid" : paid > 0 ? "partial" : "open";
      await supabase.from("invoices").update({ amount_paid: Math.max(0, paid), status }).eq("id", p.invoice_id);
    }
  }
  await supabase.from("payments_received").delete().eq("id", id);
  revalidatePath("/income");
  redirect("/income");
}

export async function deleteInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/income");
  const { data: inv } = await supabase.from("invoices").select("journal_entry_id").eq("id", id).maybeSingle();
  if (inv?.journal_entry_id) await supabase.from("journal_entries").delete().eq("id", inv.journal_entry_id);
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/income");
  redirect("/income");
}
