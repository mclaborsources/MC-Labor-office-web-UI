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
  return <main className="flex min-h-screen items-center justify-center bg-slate-900/60 px-4 py-8">
    <section role="dialog" aria-modal="true" aria-labelledby="connection-title" className="mx-auto w-full max-w-xl rounded-xl border border-slate-300 bg-white p-6 shadow-xl">
      <h1 id="connection-title" className="text-2xl font-semibold">Connect to SQL Server</h1>
      <p className="my-3 text-sm text-slate-600">Enter the office SQL Server computer’s IP address or name. These settings apply to this app installation and are saved on the computer running it.</p>
      {unreadable && <p role="alert" className="mb-3 text-red-700">Saved settings could not be read. Re-enter the connection details to replace them.</p>}
      <ConnectionForm initial={settings ? { ...settings, database: "McLabor", user: "mclabor", password: "" } : null} />
    </section>
  </main>;
}
