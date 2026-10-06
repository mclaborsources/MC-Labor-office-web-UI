import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CustomerContactEmailKickbacksScreen } from "@/components/customer-contact-email-kickbacks/CustomerContactEmailKickbacksScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmployeeContactEmailKickbacksPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  return <AppShell userDisplayName={session.user.displayName} fillViewport fullWidth><CustomerContactEmailKickbacksScreen kind="employee" /></AppShell>;
}
