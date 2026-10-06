import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EditSalesmanReportScreen } from "@/components/edit-salesman-report/EditSalesmanReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EditSalesmanReportPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><EditSalesmanReportScreen /></AppShell>;
}
