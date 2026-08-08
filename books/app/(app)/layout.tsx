import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("company_settings")
    .select("legal_name, dba_name")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white hidden md:flex md:flex-col">
        <div className="px-5 py-4 border-b border-slate-100">
          <Link href="/" className="block">
            <div className="font-semibold text-slate-900 leading-tight">
              {company?.dba_name || company?.legal_name || "Design of Man"}
            </div>
            <div className="text-xs text-slate-400">Books</div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="border-t border-slate-100 px-5 py-3">
          <div className="text-xs text-slate-400 truncate mb-2" title={user.email ?? ""}>
            {user.email}
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-slate-500 hover:text-slate-800">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <Link href="/" className="font-semibold text-slate-900">
            {company?.dba_name || "Design of Man"}
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-slate-500">Sign out</button>
          </form>
        </div>
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
