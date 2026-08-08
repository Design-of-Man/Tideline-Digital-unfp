"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents, type Db } from "@/lib/ledger";
import { num, str } from "@/lib/format";

const REIMB_LIABILITY_CODE = "2200"; // Employee Reimbursements Payable

async function accountByCode(supabase: Db, code: string) {
  const { data } = await supabase.from("accounts").select("id").eq("code", code).maybeSingle();
  return data?.id ?? null;
}

export async function createEmployeeExpense(formData: FormData) {
  const supabase = await createClient();
  const employee_id = str(formData.get("employee_id"));
  const amount = cents(num(formData.get("amount")));
  const category_account_id = str(formData.get("category_account_id"));
  const expense_date = str(formData.get("expense_date")) ?? new Date().toISOString().slice(0, 10);

  if (!employee_id || !amount || amount <= 0 || !category_account_id) {
    redirect("/reimbursements?error=" + encodeURIComponent("Employee, amount and category are required."));
  }

  const { data: acct } = await supabase.from("accounts").select("tax_category_id, deductible_pct").eq("id", category_account_id!).maybeSingle();

  const { error } = await supabase.from("employee_expenses").insert({
    employee_id,
    expense_date,
    amount,
    category_account_id: category_account_id!,
    description: str(formData.get("description")),
    tax_category_id: acct?.tax_category_id ?? null,
    deductible_pct: acct?.deductible_pct ?? 100,
    reimbursable: formData.get("reimbursable") !== "off",
    status: "submitted",
  });
  if (error) redirect("/reimbursements?error=" + encodeURIComponent(error.message));
  revalidatePath("/reimbursements");
  redirect("/reimbursements");
}

// Post the accrual (expense incurred, owed to the employee).
export async function approveEmployeeExpense(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/reimbursements");
  const { data: ee } = await supabase.from("employee_expenses").select("*").eq("id", id).maybeSingle();
  if (!ee || ee.status !== "submitted") redirect("/reimbursements");

  const liability = await accountByCode(supabase, REIMB_LIABILITY_CODE);
  if (!liability) redirect("/reimbursements?error=" + encodeURIComponent("Missing Employee Reimbursements Payable (2200)."));

  const je = await postEntry(supabase, {
    date: ee.expense_date,
    memo: ee.description || "Employee expense",
    lines: [
      { account_id: ee.category_account_id, debit: Number(ee.amount) },
      { account_id: liability, credit: Number(ee.amount) },
    ],
    source: "employee_expense",
    sourceId: ee.id,
  });
  await supabase
    .from("employee_expenses")
    .update({ status: "approved", liability_account_id: liability, journal_entry_accrual_id: je })
    .eq("id", id);
  revalidatePath("/reimbursements");
  redirect("/reimbursements");
}

// Pay the employee back. Auto-accrues first if still only submitted.
export async function reimburseEmployeeExpense(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  const pay_from_account_id = str(formData.get("pay_from_account_id"));
  if (!id || !pay_from_account_id) {
    redirect("/reimbursements?error=" + encodeURIComponent("Choose the bank account to reimburse from."));
  }
  const { data: ee } = await supabase.from("employee_expenses").select("*").eq("id", id).maybeSingle();
  if (!ee || ee.status === "reimbursed" || ee.status === "rejected") redirect("/reimbursements");

  const liability = ee.liability_account_id ?? (await accountByCode(supabase, REIMB_LIABILITY_CODE));
  if (!liability) redirect("/reimbursements?error=" + encodeURIComponent("Missing Employee Reimbursements Payable (2200)."));

  let accrualJe = ee.journal_entry_accrual_id;
  if (ee.status === "submitted") {
    accrualJe = await postEntry(supabase, {
      date: ee.expense_date,
      memo: ee.description || "Employee expense",
      lines: [
        { account_id: ee.category_account_id, debit: Number(ee.amount) },
        { account_id: liability, credit: Number(ee.amount) },
      ],
      source: "employee_expense",
      sourceId: ee.id,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const paymentJe = await postEntry(supabase, {
    date: today,
    memo: (ee.description || "Employee expense") + " — reimbursed",
    lines: [
      { account_id: liability, debit: Number(ee.amount) },
      { account_id: pay_from_account_id, credit: Number(ee.amount) },
    ],
    source: "employee_expense",
    sourceId: ee.id,
  });

  await supabase
    .from("employee_expenses")
    .update({
      status: "reimbursed",
      liability_account_id: liability,
      journal_entry_accrual_id: accrualJe,
      journal_entry_payment_id: paymentJe,
      pay_from_account_id,
      reimbursed_on: today,
    })
    .eq("id", id);
  revalidatePath("/reimbursements");
  revalidatePath("/");
  redirect("/reimbursements");
}

export async function rejectEmployeeExpense(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (id) {
    await supabase.from("employee_expenses").update({ status: "rejected" }).eq("id", id).eq("status", "submitted");
    revalidatePath("/reimbursements");
  }
  redirect("/reimbursements");
}

export async function deleteEmployeeExpense(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/reimbursements");
  const { data: ee } = await supabase.from("employee_expenses").select("journal_entry_accrual_id, journal_entry_payment_id").eq("id", id).maybeSingle();
  for (const je of [ee?.journal_entry_accrual_id, ee?.journal_entry_payment_id]) {
    if (je) await supabase.from("journal_entries").delete().eq("id", je);
  }
  await supabase.from("employee_expenses").delete().eq("id", id);
  revalidatePath("/reimbursements");
  redirect("/reimbursements");
}
