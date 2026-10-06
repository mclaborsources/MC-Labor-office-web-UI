import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CustomerImportScreen } from "@/components/customer-import/CustomerImportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function CustomerImportPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CustomerImportScreen /></AppShell>;
}
