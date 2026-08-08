import { Input } from "@/components/ui";

// Simple GET form to pick a date range (or a single "as of" date).
export function PeriodForm({
  start,
  end,
  asOf,
  action,
}: {
  start?: string;
  end?: string;
  asOf?: string;
  action: string;
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3 mb-6">
      {asOf !== undefined ? (
        <label className="text-sm">
          <span className="block text-slate-500 mb-1">As of</span>
          <Input name="as_of" type="date" defaultValue={asOf} className="!w-auto" />
        </label>
      ) : (
        <>
          <label className="text-sm">
            <span className="block text-slate-500 mb-1">From</span>
            <Input name="start" type="date" defaultValue={start} className="!w-auto" />
          </label>
          <label className="text-sm">
            <span className="block text-slate-500 mb-1">To</span>
            <Input name="end" type="date" defaultValue={end} className="!w-auto" />
          </label>
        </>
      )}
      <button className="rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm font-medium hover:bg-slate-700">
        Update
      </button>
    </form>
  );
}
