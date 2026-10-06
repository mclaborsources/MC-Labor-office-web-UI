import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CustomerImportScreen } from "@/components/customer-import/CustomerImportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function CustomerImportPage({ searchParams }: { searchParams: Promise<{ variant?: string }> }) {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  const { variant } = await searchParams;
  const importVariant = variant === "2-contacts" || variant === "3-contacts" || variant === "3-contacts-nr" ? variant : "customers";
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CustomerImportScreen variant={importVariant} /></AppShell>;
}
