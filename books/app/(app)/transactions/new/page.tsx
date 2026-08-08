import { getAccounts } from "@/lib/data";
import { PageHeader, Card, FormError, Button } from "@/components/ui";
import { JournalEntryForm } from "../journal-entry-form";

export const dynamic = "force-dynamic";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const accounts = await getAccounts();
  return (
    <div>
      <PageHeader
        title="New journal entry"
        description="Manually post a balanced debit/credit entry to the ledger."
        action={<Button href="/transactions" variant="secondary">Back</Button>}
      />
      {error && <div className="mb-4"><FormError message={error} /></div>}
      <Card className="p-5 max-w-3xl">
        <JournalEntryForm accounts={accounts} />
      </Card>
    </div>
  );
}
