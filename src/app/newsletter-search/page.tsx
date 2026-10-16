import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NewsletterSearchScreen } from "@/components/newsletter-search/NewsletterSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getNewsletterContactRows, getNewsletterTemplates } from "@/lib/adminReportQueries";

export const dynamic = "force-dynamic";

export default async function NewsletterSearchPage() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  let rows: Awaited<ReturnType<typeof getNewsletterContactRows>> = [];
  let error = "";
  let templates: Awaited<ReturnType<typeof getNewsletterTemplates>> = [];
  let templateError = "";
  try { rows = await getNewsletterContactRows(); }
  catch { error = "Contact records could not be loaded from SQL Server."; }
  try { templates = await getNewsletterTemplates(); }
  catch { templateError = "Newsletter templates could not be loaded."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><NewsletterSearchScreen rows={rows} templates={templates} error={error} templateError={templateError} /></AppShell>;
}
