import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo, Wordmark } from "@/components/logo";
import { money, shortDate } from "@/lib/format";
import { PrintButton } from "./print-button";
import { postInvoice, markSent } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  implementation: "Implementation",
  monthly: "Monthly Service",
  standard: "Invoice",
};

export default async function InvoiceDocument({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; posted?: string; sent?: string }>;
}) {
  const { id } = await params;
  const { error, posted, sent } = await searchParams;
  const supabase = await createClient();

  const [{ data: inv }, { data: company }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, contact:contacts(*), lines:invoice_lines(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("company_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (!inv) notFound();

  const contact = (inv as any).contact as {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  const lines = (((inv as any).lines ?? []) as any[]).sort(
    (a, b) => (a.line_no ?? 0) - (b.line_no ?? 0)
  );

  const subtotal = Number(inv.subtotal);
  const tax = Number(inv.tax_total);
  const total = Number(inv.total);
  const paid = Number(inv.amount_paid);
  const balance = total - paid;
  const isDraft = inv.status === "draft";
  const isImplementation = inv.invoice_type === "implementation";
  const typeLabel = TYPE_LABEL[inv.invoice_type] ?? "Invoice";

  const dispName = (company?.dba_name || company?.legal_name || "Design of Man") as string;
  const mailSubject = `Invoice ${inv.number ?? ""} from ${dispName}`;
  const mailBody = `Hi ${contact?.name ?? ""},\n\nPlease find invoice ${inv.number ?? ""} for ${money(
    balance
  )} attached.\n\n${company?.payment_instructions ?? ""}\n\nThank you,\n${company?.contact_name ?? dispName}`;
  const mailto = contact?.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(
        mailSubject
      )}&body=${encodeURIComponent(mailBody)}`
    : null;

  return (
    <div className="mx-auto max-w-[850px]">
      {/* Toolbar — never printed */}
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/income"
          className="text-sm text-muted-foreground hover:text-foreground mr-auto"
        >
          ← Back to invoices
        </Link>
        {isDraft && (
          <form action={postInvoice}>
            <input type="hidden" name="id" value={inv.id} />
            <button className="inline-flex items-center gap-1.5 rounded-md bg-accent text-accent-foreground px-3.5 py-2 text-sm font-medium hover:opacity-90">
              Finalize &amp; post
            </button>
          </form>
        )}
        {mailto && (
          <a
            href={mailto}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Email to {contact?.name}
          </a>
        )}
        {!isDraft && (
          <form action={markSent}>
            <input type="hidden" name="id" value={inv.id} />
            <input type="hidden" name="to_email" value={contact?.email ?? ""} />
            <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {inv.sent_at ? "Mark sent again" : "Mark as sent"}
            </button>
          </form>
        )}
        <PrintButton />
      </div>

      {(error || posted || sent) && (
        <div className="no-print mb-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {posted && (
            <div className="rounded-md bg-success/10 border border-success/30 px-3 py-2 text-sm text-success">
              Invoice finalized and posted to the ledger as {inv.number}.
            </div>
          )}
          {sent && (
            <div className="rounded-md bg-success/10 border border-success/30 px-3 py-2 text-sm text-success">
              Marked as sent{contact?.email ? ` to ${contact.email}` : ""}.
            </div>
          )}
        </div>
      )}

      {/* ============================ PAGE 1 ============================ */}
      <div className="invoice-sheet invoice-page border border-border rounded-lg overflow-hidden shadow-sm">
        {/* Masthead */}
        <div className="dom-masthead px-9 py-8 flex items-start justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <Logo className="w-11 h-11 shrink-0" />
            <div>
              <Wordmark className="block text-[22px] text-parchment-100 leading-none" />
              <div className="mt-1.5 font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-400">
                {company?.legal_name ?? "Design of Man LLC"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[30px] font-semibold text-parchment-100 leading-none">
              Invoice
            </div>
            <div className="mt-2 font-mono text-[11px] tracking-[0.14em] text-brass-400">
              {inv.number ?? "DRAFT"}
            </div>
            <div className="mt-1 font-mono text-[9.5px] tracking-[0.16em] uppercase text-parchment-200/60">
              {typeLabel}
              {isDraft ? " · Draft" : ""}
            </div>
          </div>
        </div>

        <div className="px-9 py-8">
          {/* From / Bill To / Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-7 mb-8">
            <div>
              <div className="dom-label mb-2">From</div>
              <div className="text-sm text-foreground font-medium">
                {company?.legal_name ?? "Design of Man LLC"}
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {company?.contact_name && <div>{company.contact_name}</div>}
                {company?.address && <div>{company.address}</div>}
                {company?.phone && <div>{company.phone}</div>}
                {company?.email && <div>{company.email}</div>}
              </div>
            </div>
            <div>
              <div className="dom-label mb-2">Bill to</div>
              <div className="text-sm text-foreground font-medium">
                {contact?.name ?? "—"}
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {contact?.address && <div>{contact.address}</div>}
                {contact?.email && <div>{contact.email}</div>}
                {contact?.phone && <div>{contact.phone}</div>}
              </div>
            </div>
            <div className="space-y-2.5">
              <MetaRow label="Issue date" value={shortDate(inv.issue_date)} />
              <MetaRow label="Due date" value={shortDate(inv.due_date)} />
              {inv.service_period_start && (
                <MetaRow
                  label="Service period"
                  value={`${shortDate(inv.service_period_start)} – ${shortDate(
                    inv.service_period_end
                  )}`}
                />
              )}
              {inv.terms && <MetaRow label="Terms" value={inv.terms} />}
            </div>
          </div>

          {/* Line items */}
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Description</th>
                <th className="text-right w-20">Qty</th>
                <th className="text-right w-32">Rate</th>
                <th className="text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground text-sm">
                    No line items.
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.id}>
                    <td className="text-sm text-foreground">
                      {l.description || "Services"}
                    </td>
                    <td className="text-right text-sm tabular-nums text-muted-foreground">
                      {Number(l.quantity)}
                    </td>
                    <td className="text-right text-sm tabular-nums text-muted-foreground">
                      {money(l.unit_price)}
                    </td>
                    <td className="text-right text-sm tabular-nums text-foreground">
                      {money(l.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-72">
              <TotalRow label="Subtotal" value={money(subtotal)} />
              {tax > 0 && <TotalRow label="Sales tax (FL)" value={money(tax)} />}
              {paid > 0 && (
                <TotalRow label="Amount paid" value={`(${money(paid)})`} muted />
              )}
              <div className="dom-total-block rounded-md mt-2 px-4 py-3 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-brass-400">
                  {paid > 0 ? "Balance due" : "Total due"}
                </span>
                <span className="font-display text-[20px] font-semibold tabular-nums text-parchment-100">
                  {money(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment / footer */}
          <div className="mt-8 pt-6 border-t border-border grid sm:grid-cols-2 gap-5">
            <div>
              <div className="dom-label mb-2">Payment</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {company?.payment_instructions ?? "Payable by check."}
                {company?.contact_name && (
                  <>
                    {" "}
                    Make checks payable to {company.legal_name ?? "Design of Man LLC"}.
                  </>
                )}
              </p>
            </div>
            {inv.memo && (
              <div>
                <div className="dom-label mb-2">Notes</div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {inv.memo}
                </p>
              </div>
            )}
          </div>

          <hr className="dom-rule mt-8 mx-auto" />
          <p className="text-center text-xs text-muted-foreground mt-3">
            {company?.invoice_footer ?? "Thank you for your business."}
          </p>
        </div>
      </div>

      {/* ==================== PAGE 2 — ACCEPTANCE ==================== */}
      {isImplementation && (
        <div className="invoice-sheet invoice-page border border-border rounded-lg overflow-hidden shadow-sm mt-8 print:mt-0">
          <div className="dom-masthead px-9 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8 shrink-0" />
              <Wordmark className="text-[17px] text-parchment-100" />
            </div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-brass-400">
              Acceptance · {inv.number ?? "DRAFT"}
            </div>
          </div>
          <div className="px-9 py-9">
            <h2 className="font-display text-[20px] font-semibold text-foreground mb-2">
              Statement of work &amp; acceptance
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
              This implementation engagement covers the scope itemized on the
              preceding page. By signing below, {contact?.name ?? "the client"}{" "}
              authorizes {dispName} to proceed and agrees to the total of{" "}
              <span className="font-medium text-foreground">{money(total)}</span>,
              payable per the terms stated on the invoice.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 gap-x-10 gap-y-12">
              <SignatureBlock role={`For ${contact?.name ?? "Client"}`} />
              <SignatureBlock role={`For ${company?.legal_name ?? "Design of Man LLC"}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="dom-label">{label}</span>
      <span className="text-sm text-foreground tabular-nums text-right">{value}</span>
    </div>
  );
}

function TotalRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SignatureBlock({ role }: { role: string }) {
  return (
    <div>
      <div className="h-10 border-b border-foreground/40" />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Signature</span>
        <span className="text-xs text-muted-foreground">Date</span>
      </div>
      <div className="mt-4 font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
        {role}
      </div>
    </div>
  );
}
