import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeImportScreen } from "@/components/employee-import/EmployeeImportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmployeeImportPage({ searchParams }: { searchParams: Promise<{ variant?: string }> }) {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  const { variant } = await searchParams;
  const importVariant = variant === "carriers" || variant === "addresses" ? variant : "employees";
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><EmployeeImportScreen variant={importVariant} /></AppShell>;
}
