import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav";
import { Logo, Wordmark } from "@/components/logo";

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
      {/* Sidebar — the Indigo field */}
      <aside className="dom-masthead w-[244px] shrink-0 hidden md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 py-[18px] border-b border-parchment-200/[0.13]">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-[30px] h-[30px] shrink-0" />
            <span>
              <Wordmark className="block text-[17px] text-parchment-100 leading-tight" />
              <span className="block font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-400">
                Books
              </span>
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="border-t border-parchment-200/[0.13] px-5 py-3.5">
          <div className="text-[11.5px] text-parchment-200/50 truncate mb-2" title={user.email ?? ""}>
            {user.email}
          </div>
          <form action="/auth/signout" method="post">
            <button className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-brass-400 hover:text-brass-300">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="dom-masthead md:hidden flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="w-6 h-6 shrink-0" />
            <Wordmark className="text-[15px] text-parchment-100" />
          </Link>
          <form action="/auth/signout" method="post">
            <button className="font-mono text-[10px] tracking-[0.1em] uppercase text-brass-400">
              Sign out
            </button>
          </form>
        </div>
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
