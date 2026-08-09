"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/format";

export async function saveCompany(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      legal_name: str(formData.get("legal_name")) ?? "Design of Man LLC",
      dba_name: str(formData.get("dba_name")),
      ein: str(formData.get("ein")),
      contact_name: str(formData.get("contact_name")),
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      website: str(formData.get("website")),
      address: str(formData.get("address")),
      payment_instructions: str(formData.get("payment_instructions")),
      invoice_footer: str(formData.get("invoice_footer")),
    })
    .eq("id", 1);
  if (error) redirect("/settings?error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function saveCustomer(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/settings");
  const { error } = await supabase
    .from("contacts")
    .update({
      code: str(formData.get("code"))?.toUpperCase() ?? null,
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
    })
    .eq("id", id);
  if (error) redirect("/settings?error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
