import { createClient } from "@/lib/supabase/server";

// Common lookups reused across pages/forms.

export async function getAccounts(filter?: {
  types?: string[];
  subtypes?: string[];
}) {
  const supabase = await createClient();
  let q = supabase
    .from("accounts")
    .select("id, code, name, type, subtype, is_tax_deductible, deductible_pct, tax_category_id")
    .eq("is_active", true)
    .order("code");
  if (filter?.types) q = q.in("type", filter.types as any);
  if (filter?.subtypes) q = q.in("subtype", filter.subtypes as any);
  const { data } = await q;
  return data ?? [];
}

export async function getContacts(type?: "customer" | "vendor") {
  const supabase = await createClient();
  let q = supabase
    .from("contacts")
    .select("id, name, type, is_1099")
    .eq("is_active", true)
    .order("name");
  if (type) q = q.in("type", [type, "both"]);
  const { data } = await q;
  return data ?? [];
}

export async function getEmployees() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("first_name");
  return data ?? [];
}

export async function getTaxCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tax_categories")
    .select("id, code, name, form_line, default_deductible_pct")
    .order("sort_order");
  return data ?? [];
}

// The bank/credit-card/AP accounts you pay money out of.
export async function getPaymentAccounts() {
  return getAccounts({
    subtypes: ["bank", "credit_card", "accounts_payable"],
  });
}

export async function getBankAccounts() {
  return getAccounts({ subtypes: ["bank"] });
}
