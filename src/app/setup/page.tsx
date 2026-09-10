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
  return <main className="min-h-screen bg-slate-100 px-4 py-12">
    <section className="mx-auto max-w-xl rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Connect to SQL Server</h1>
      <p className="my-3 text-sm text-slate-600">Enter the office SQL Server computer’s IP address or name. These settings apply to this app installation and are saved on the computer running it.</p>
      {unreadable && <p role="alert" className="mb-3 text-red-700">Saved settings could not be read. Re-enter the connection details to replace them.</p>}
      <ConnectionForm initial={settings ? { ...settings, database: "McLabor", user: "mclabor", password: "" } : null} />
    </section>
  </main>;
}
