"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/format";

// Finalize a draft: assign its systematic number, post the A/R journal entry,
// and flip it to "open". Idempotent — a posted invoice just returns.
export async function postInvoice(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/income");
  const { error } = await supabase.rpc("post_invoice", { p_invoice: id });
  if (error) redirect(`/invoices/${id}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/income");
  revalidatePath("/recurring-invoices");
  redirect(`/invoices/${id}?posted=1`);
}

// Record that the invoice was handed off to the customer (emailed / printed).
export async function markSent(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/income");

  const to = str(formData.get("to_email"));
  const { data: inv } = await supabase
    .from("invoices")
    .select("number")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("invoices").update({ sent_at: new Date().toISOString() }).eq("id", id);
  if (to) {
    await supabase.from("invoice_sends").insert({
      invoice_id: id,
      to_email: to,
      subject: `Invoice ${inv?.number ?? ""} from Design of Man`,
      provider: "manual",
      status: "sent",
    });
  }
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/income");
  redirect(`/invoices/${id}?sent=1`);
}
