import { createClient } from "@/lib/supabase/server";
import {
  PageHeader,
  Card,
  CardHeader,
  Field,
  Input,
  Textarea,
  FormError,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveCompany, saveCustomer } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const [{ data: company }, { data: customers }] = await Promise.all([
    supabase.from("company_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("contacts")
      .select("id, name, code, email, phone, address")
      .in("type", ["customer", "both"])
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your company details fill the “From” block and payment terms on every invoice. Customer codes drive systematic invoice numbers."
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}
      {saved && (
        <div className="mb-4 rounded-md bg-success/10 border border-success/30 px-3 py-2 text-sm text-success">
          Saved.
        </div>
      )}

      <Card className="mb-6">
        <CardHeader title="Company" />
        <form action={saveCompany} className="grid sm:grid-cols-2 gap-4 p-5">
          <Field label="Legal name"><Input name="legal_name" defaultValue={company?.legal_name ?? ""} required /></Field>
          <Field label="DBA / display name"><Input name="dba_name" defaultValue={company?.dba_name ?? ""} /></Field>
          <Field label="Primary contact"><Input name="contact_name" defaultValue={company?.contact_name ?? ""} /></Field>
          <Field label="EIN"><Input name="ein" defaultValue={company?.ein ?? ""} /></Field>
          <Field label="Phone"><Input name="phone" defaultValue={company?.phone ?? ""} /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={company?.email ?? ""} /></Field>
          <Field label="Website"><Input name="website" defaultValue={company?.website ?? ""} /></Field>
          <Field label="Address" className="sm:col-span-2"><Textarea name="address" rows={2} defaultValue={company?.address ?? ""} /></Field>
          <Field label="Payment instructions" className="sm:col-span-2" hint="Shown under “Payment” on the invoice.">
            <Input name="payment_instructions" defaultValue={company?.payment_instructions ?? ""} placeholder="Payable by check." />
          </Field>
          <Field label="Invoice footer" className="sm:col-span-2">
            <Input name="invoice_footer" defaultValue={company?.invoice_footer ?? ""} placeholder="Thank you for your business." />
          </Field>
          <div className="sm:col-span-2"><SubmitButton>Save company</SubmitButton></div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Customers" />
        <div className="p-5 space-y-5">
          {(customers ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No customers yet.</p>
          )}
          {(customers ?? []).map((c) => (
            <form key={c.id} action={saveCustomer} className="grid sm:grid-cols-4 gap-3 items-end border-b border-border pb-5 last:border-0 last:pb-0">
              <input type="hidden" name="id" value={c.id} />
              <div className="sm:col-span-4 text-sm font-medium text-foreground">{c.name}</div>
              <Field label="Code" hint="e.g. HCFL"><Input name="code" defaultValue={c.code ?? ""} placeholder="HCFL" /></Field>
              <Field label="Email"><Input name="email" type="email" defaultValue={c.email ?? ""} /></Field>
              <Field label="Phone"><Input name="phone" defaultValue={c.phone ?? ""} /></Field>
              <Field label="Address"><Input name="address" defaultValue={c.address ?? ""} /></Field>
              <div className="sm:col-span-4"><SubmitButton variant="secondary">Save {c.name}</SubmitButton></div>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}
