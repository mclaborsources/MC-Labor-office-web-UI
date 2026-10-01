import { AppShell } from "@/components/layout/AppShell";
import { NewsletterSearchScreen } from "@/components/newsletter-search/NewsletterSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getAllContacts } from "@/lib/allContacts";

export default async function NewsletterSearchPage() {
  const session = await getSessionOrDefault();
  let rows: Awaited<ReturnType<typeof getAllContacts>> = [];
  let error = "";
  try { rows = await getAllContacts({ includeCompanies: true, includeEmployees: true, includeNoCommunication: true }); }
  catch { error = "Contact records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><NewsletterSearchScreen rows={rows} error={error} /></AppShell>;
}
