import { redirect } from "next/navigation";
import { needsAccountSetup } from "@/lib/config/env";
import { AccountSetupForm } from "@/components/admin/AccountSetupForm";

export const dynamic = "force-dynamic";
export default function WelcomePage() {
  if (!needsAccountSetup()) redirect("/login");
  return <main className="flex min-h-screen items-center justify-center bg-slate-900/60 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="setup-title" className="w-full max-w-lg rounded-xl bg-white p-7 shadow-xl">
      <h1 id="setup-title" className="text-2xl font-semibold">Welcome to MC Labor</h1>
      <p className="my-3 text-sm text-slate-600">Create your administrator login for this installation. Next, connect to the office database.</p>
      <AccountSetupForm />
    </section>
  </main>;
}
