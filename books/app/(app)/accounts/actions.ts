"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/format";

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const type = str(formData.get("type"));
  const subtype = str(formData.get("subtype"));
  const code = str(formData.get("code"));
  const name = str(formData.get("name"));
  if (!type || !subtype || !code || !name) {
    redirect("/accounts?error=" + encodeURIComponent("Code, name, type and subtype are required."));
  }
  const isExpense = type === "expense";
  const { error } = await supabase.from("accounts").insert({
    code: code!,
    name: name!,
    type: type as any,
    subtype: subtype as any,
    description: str(formData.get("description")),
    is_tax_deductible: isExpense ? formData.get("is_tax_deductible") === "on" : false,
    deductible_pct: Number(formData.get("deductible_pct") ?? 100) || 100,
    tax_category_id: str(formData.get("tax_category_id")),
  });
  if (error) {
    redirect("/accounts?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function toggleAccountActive(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id) {
    await supabase.from("accounts").update({ is_active: !active }).eq("id", id).eq("is_system", false);
    revalidatePath("/accounts");
  }
}
