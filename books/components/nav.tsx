"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: { heading: string; items: { href: string; label: string }[] }[] =
  [
    {
      heading: "Overview",
      items: [{ href: "/", label: "Dashboard" }],
    },
    {
      heading: "Money in",
      items: [{ href: "/income", label: "Income & Invoices" }],
    },
    {
      heading: "Money out",
      items: [
        { href: "/expenses", label: "Expenses" },
        { href: "/recurring", label: "Recurring" },
        { href: "/reimbursements", label: "Employee Expenses" },
      ],
    },
    {
      heading: "People",
      items: [
        { href: "/payroll", label: "Payroll" },
        { href: "/distributions", label: "Distributions" },
        { href: "/employees", label: "Employees" },
      ],
    },
    {
      heading: "Tax",
      items: [
        { href: "/taxes", label: "Tax Payments" },
        { href: "/reports/deductions", label: "Write-offs" },
      ],
    },
    {
      heading: "Ledger",
      items: [
        { href: "/transactions", label: "Transactions" },
        { href: "/accounts", label: "Chart of Accounts" },
      ],
    },
    {
      heading: "Reports",
      items: [
        { href: "/reports/pnl", label: "Profit & Loss" },
        { href: "/reports/balance-sheet", label: "Balance Sheet" },
        { href: "/reports/trial-balance", label: "Trial Balance" },
      ],
    },
  ];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {SECTIONS.map((section) => (
        <div key={section.heading}>
          <div className="px-3 mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
            {section.heading}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
