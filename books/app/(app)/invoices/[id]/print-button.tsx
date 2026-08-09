"use client";

export function PrintButton({
  className = "",
  children = "Print / Save PDF",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ||
        "inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90"
      }
    >
      {children}
    </button>
  );
}
