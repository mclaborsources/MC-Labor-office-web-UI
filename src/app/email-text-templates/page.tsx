import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmailTextTemplatesScreen } from "@/components/email-text-templates/EmailTextTemplatesScreen";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function EmailTextTemplatesPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.roles.includes("admin")) redirect("/tracking");
  return <AppShell userDisplayName={session.user.displayName} fillViewport fullWidth><EmailTextTemplatesScreen /></AppShell>;
}
