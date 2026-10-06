import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeContactTextKickbacksScreen } from "@/components/employee-contact-text-kickbacks/EmployeeContactTextKickbacksScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmployeeContactTextKickbacksPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  return <AppShell userDisplayName={session.user.displayName} fillViewport fullWidth><EmployeeContactTextKickbacksScreen /></AppShell>;
}
