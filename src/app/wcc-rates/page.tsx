import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WccRatesScreen } from "@/components/wcc-rates/WccRatesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function WccRatesPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><WccRatesScreen /></AppShell>;
}
