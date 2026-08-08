"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postEntry, cents } from "@/lib/ledger";
import { num, str } from "@/lib/format";

export async function createDistribution(formData: FormData) {
  const supabase = await createClient();
  const employee_id = str(formData.get("employee_id"));
  const amount = cents(num(formData.get("amount")));
  const pay_from_account_id = str(formData.get("pay_from_account_id"));
  const date = str(formData.get("distribution_date")) ?? new Date().toISOString().slice(0, 10);

  if (!employee_id || !amount || amount <= 0 || !pay_from_account_id) {
    redirect("/distributions?error=" + encodeURIComponent("Shareholder, amount and bank account are required."));
  }

  // Default the equity account to this shareholder's distributions account.
  let equity_account_id = str(formData.get("equity_account_id"));
  if (!equity_account_id) {
    const { data: emp } = await supabase.from("employees").select("equity_account_id, first_name, last_name").eq("id", employee_id).maybeSingle();
    equity_account_id = emp?.equity_account_id ?? null;
  }
  if (!equity_account_id) {
    redirect("/distributions?error=" + encodeURIComponent("This shareholder has no distributions equity account set (edit them under Employees)."));
  }

  const { data: dist, error } = await supabase
    .from("distributions")
    .insert({
      employee_id,
      distribution_date: date,
      amount,
      pay_from_account_id,
      equity_account_id,
      memo: str(formData.get("memo")),
      reference: str(formData.get("reference")),
    })
    .select("id")
    .single();
  if (error || !dist) redirect("/distributions?error=" + encodeURIComponent(error?.message ?? "Failed."));

  try {
    const je = await postEntry(supabase, {
      date,
      memo: str(formData.get("memo")) || "Shareholder distribution",
      lines: [
        { account_id: equity_account_id, debit: amount },
        { account_id: pay_from_account_id, credit: amount },
      ],
      source: "distribution",
      sourceId: dist.id,
      reference: str(formData.get("reference")),
    });
    await supabase.from("distributions").update({ journal_entry_id: je }).eq("id", dist.id);
  } catch (e) {
    await supabase.from("distributions").delete().eq("id", dist.id);
    redirect("/distributions?error=" + encodeURIComponent((e as Error).message));
  }
  revalidatePath("/distributions");
  revalidatePath("/");
  redirect("/distributions");
}

export async function deleteDistribution(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData.get("id"));
  if (!id) redirect("/distributions");
  const { data: d } = await supabase.from("distributions").select("journal_entry_id").eq("id", id).maybeSingle();
  if (d?.journal_entry_id) await supabase.from("journal_entries").delete().eq("id", d.journal_entry_id);
  await supabase.from("distributions").delete().eq("id", id);
  revalidatePath("/distributions");
  redirect("/distributions");
}
