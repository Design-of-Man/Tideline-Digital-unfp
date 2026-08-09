"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createManualEntry } from "./actions";

type Account = { id: string; code: string; name: string };
type Line = { key: number; account_id: string; debit: string; credit: string };

export function JournalEntryForm({ accounts }: { accounts: Account[] }) {
  const [lines, setLines] = useState<Line[]>([
    { key: 1, account_id: "", debit: "", credit: "" },
    { key: 2, account_id: "", debit: "", credit: "" },
  ]);
  const [nextKey, setNextKey] = useState(3);

  const totalD = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalC = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalD - totalC) < 0.005 && totalD > 0;

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const addLine = () => {
    setLines((ls) => [...ls, { key: nextKey, account_id: "", debit: "", credit: "" }]);
    setNextKey((k) => k + 1);
  };
  const removeLine = (key: number) =>
    setLines((ls) => (ls.length > 2 ? ls.filter((l) => l.key !== key) : ls));

  return (
    <form action={createManualEntry} className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Date">
          <Input name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Memo" className="sm:col-span-2">
          <Input name="memo" placeholder="What is this entry for?" required />
        </Field>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Account</th>
              <th className="text-right px-3 py-2 font-medium w-32">Debit</th>
              <th className="text-right px-3 py-2 font-medium w-32">Credit</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} className="border-t border-border">
                <td className="px-3 py-2">
                  <Select
                    name="account_id"
                    value={l.account_id}
                    onChange={(e) => update(l.key, { account_id: e.target.value })}
                  >
                    <option value="">Select account…</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    name="debit"
                    type="number"
                    step="0.01"
                    min="0"
                    className="text-right"
                    value={l.debit}
                    onChange={(e) => update(l.key, { debit: e.target.value, credit: e.target.value ? "" : l.credit })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    name="credit"
                    type="number"
                    step="0.01"
                    min="0"
                    className="text-right"
                    value={l.credit}
                    onChange={(e) => update(l.key, { credit: e.target.value, debit: e.target.value ? "" : l.debit })}
                  />
                </td>
                <td className="px-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeLine(l.key)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove line"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted border-t border-border text-sm">
            <tr>
              <td className="px-3 py-2 text-muted-foreground">
                <button type="button" onClick={addLine} className="text-muted-foreground hover:text-foreground font-medium">
                  + Add line
                </button>
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">{totalD.toFixed(2)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">{totalC.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className={`text-sm ${balanced ? "text-success" : "text-warning"}`}>
          {balanced
            ? "✓ Balanced"
            : totalD === 0
            ? "Enter debit and credit amounts"
            : `Out of balance by ${Math.abs(totalD - totalC).toFixed(2)}`}
        </div>
        <SubmitButton>Post entry</SubmitButton>
      </div>
    </form>
  );
}
