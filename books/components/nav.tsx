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
    <nav className="flex flex-col gap-5 px-2.5 py-5">
      {SECTIONS.map((section) => (
        <div key={section.heading}>
          <div className="px-3.5 mb-1.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-brass-400">
            {section.heading}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative block rounded px-3.5 py-1.5 text-[13.5px] transition-colors ${
                      active
                        ? "text-parchment-200 bg-parchment-200/10 font-medium before:content-[''] before:absolute before:-left-2.5 before:top-1 before:bottom-1 before:w-0.5 before:rounded-r before:bg-brass-400"
                        : "text-parchment-200/65 hover:text-parchment-200 hover:bg-parchment-200/[0.07]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
