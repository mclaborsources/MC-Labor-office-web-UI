import { redirect } from "next/navigation";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getDatabaseSettings } from "@/lib/config/database";
import { ConnectionForm } from "@/components/admin/ConnectionForm";

export const dynamic = "force-dynamic";
export default async function SetupPage() {
  const session = await getSessionOrDefault(false);
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  if (!session.user.roles.includes("admin")) return <p className="p-8">Ask an administrator to configure the SQL Server connection.</p>;
  let settings = null;
  let unreadable = false;
  try { settings = getDatabaseSettings(); } catch { unreadable = true; }
  return <main className="flex min-h-screen items-center justify-center bg-[#eeedf1] px-4 py-8">
    <section role="dialog" aria-modal="true" aria-labelledby="connection-title" className="mx-auto w-full max-w-3xl rounded-lg border border-[#b5b3ba] bg-[#e9e9eb] p-3 shadow-2xl">
      <div className="mb-3 border-b border-[#cccbd0] pb-2 text-xs text-[#333]">Relink to SQL Server</div>
      <h1 id="connection-title" className="mb-3 text-2xl font-normal text-black">Relink to SQL Server</h1>
      {unreadable && <p role="alert" className="mb-3 text-red-700">Saved settings could not be read. Re-enter the connection details to replace them.</p>}
      <ConnectionForm initial={settings ? { ...settings, password: "" } : null} />
    </section>
  </main>;
}
