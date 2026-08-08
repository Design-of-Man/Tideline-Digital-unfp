"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { num, str } from "@/lib/format";
import type { Enums } from "@/types/database";

function fields(formData: FormData) {
  return {
    first_name: str(formData.get("first_name")) ?? "",
    last_name: str(formData.get("last_name")) ?? "",
    email: str(formData.get("email")),
    title: str(formData.get("title")),
    is_owner: formData.get("is_owner") === "on",
    is_shareholder: formData.get("is_shareholder") === "on",
    ownership_pct: num(formData.get("ownership_pct")),
    annual_salary: num(formData.get("annual_salary")),
    pay_frequency: (str(formData.get("pay_frequency")) ?? "monthly") as Enums<"pay_frequency">,
    equity_account_id: str(formData.get("equity_account_id")),
  };
}

export async function createEmployee(formData: FormData) {
  const supabase = await createClient();
  const f = fields(formData);
  if (!f.first_name || !f.last_name) {
    redirect("/employees?error=" + encodeURIComponent("First and last name are required."));
  }
  const { error } = await supabase.from("employees").insert(f);
  if (error) redirect("/employees?error=" + encodeURIComponent(error.message));
  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/employees");
  const { error } = await supabase.from("employees").update(fields(formData)).eq("id", id);
  if (error) redirect("/employees?error=" + encodeURIComponent(error.message));
  revalidatePath("/employees");
  redirect("/employees");
}
