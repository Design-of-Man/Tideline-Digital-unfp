"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents, type Db } from "@/lib/ledger";
import { num, str } from "@/lib/format";

async function accountByCode(supabase: Db, code: string) {
  const { data } = await supabase.from("accounts").select("id").eq("code", code).maybeSingle();
  return data?.id ?? null;
}

export async function runPayroll(formData: FormData) {
  const supabase = await createClient();
  const employee_id = str(formData.get("employee_id"));
  const gross = cents(num(formData.get("gross_pay")));
  const pay_date = str(formData.get("pay_date")) ?? new Date().toISOString().slice(0, 10);
  const pay_from_account_id = str(formData.get("pay_from_account_id"));

  if (!employee_id || !gross || gross <= 0 || !pay_from_account_id) {
    redirect("/payroll?error=" + encodeURIComponent("Employee, gross pay and pay-from account are required."));
  }

  // FICA defaults to 7.65% each side when left blank.
  const fica = cents(gross * 0.0765);
  const employee_fica = formData.get("employee_fica") ? cents(num(formData.get("employee_fica"))) : fica;
  const employer_fica = formData.get("employer_fica") ? cents(num(formData.get("employer_fica"))) : fica;
  const federal_withholding = cents(num(formData.get("federal_withholding")));
  const state_withholding = cents(num(formData.get("state_withholding")));
  const other_withholding = cents(num(formData.get("other_withholding")));
  const futa = cents(num(formData.get("futa")));
  const suta = cents(num(formData.get("suta")));

  const employeeWithholdings = cents(employee_fica + federal_withholding + state_withholding + other_withholding);
  const employerTaxes = cents(employer_fica + futa + suta);
  const net_pay = cents(gross - employeeWithholdings);
  if (net_pay < 0) {
    redirect("/payroll?error=" + encodeURIComponent("Withholdings exceed gross pay."));
  }

  const salaryAcct = await accountByCode(supabase, "6300"); // Officer Compensation
  const taxExpAcct = await accountByCode(supabase, "6310"); // Payroll Tax Expense
  const liabAcct = await accountByCode(supabase, "2100"); // Payroll Liabilities
  if (!salaryAcct || !taxExpAcct || !liabAcct) {
    redirect("/payroll?error=" + encodeURIComponent("Missing payroll accounts (6300/6310/2100)."));
  }

  const { data: run, error } = await supabase
    .from("payroll_runs")
    .insert({
      employee_id,
      pay_date,
      period_start: str(formData.get("period_start")),
      period_end: str(formData.get("period_end")),
      gross_pay: gross,
      employee_fica, federal_withholding, state_withholding, other_withholding,
      employer_fica, futa, suta, net_pay,
      pay_from_account_id,
      salary_expense_account_id: salaryAcct,
      payroll_tax_expense_account_id: taxExpAcct,
      payroll_liability_account_id: liabAcct,
      memo: str(formData.get("memo")),
    })
    .select("id")
    .single();
  if (error || !run) redirect("/payroll?error=" + encodeURIComponent(error?.message ?? "Failed."));

  // Debits: gross salary + employer taxes. Credits: net to bank + all liabilities.
  const lines = [
    { account_id: salaryAcct, debit: gross, memo: "Gross wages" },
    ...(employerTaxes > 0 ? [{ account_id: taxExpAcct, debit: employerTaxes, memo: "Employer payroll taxes" }] : []),
    { account_id: pay_from_account_id, credit: net_pay, memo: "Net pay" },
    { account_id: liabAcct, credit: cents(employeeWithholdings + employerTaxes), memo: "Payroll taxes payable" },
  ];

  try {
    const je = await postEntry(supabase, {
      date: pay_date,
      memo: str(formData.get("memo")) || "Payroll",
      lines,
      source: "payroll",
      sourceId: run.id,
    });
    await supabase.from("payroll_runs").update({ journal_entry_id: je }).eq("id", run.id);
  } catch (e) {
    await supabase.from("payroll_runs").delete().eq("id", run.id);
    redirect("/payroll?error=" + encodeURIComponent((e as Error).message));
  }
  revalidatePath("/payroll");
  revalidatePath("/");
  redirect("/payroll");
}

export async function deletePayroll(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/payroll");
  const { data: r } = await supabase.from("payroll_runs").select("journal_entry_id").eq("id", id).maybeSingle();
  if (r?.journal_entry_id) await supabase.from("journal_entries").delete().eq("id", r.journal_entry_id);
  await supabase.from("payroll_runs").delete().eq("id", id);
  revalidatePath("/payroll");
  redirect("/payroll");
}
