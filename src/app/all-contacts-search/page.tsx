import { AppShell } from "@/components/layout/AppShell";
import { AllContactsSearchScreen } from "@/components/all-contacts/AllContactsSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getAllContacts } from "@/lib/allContacts";

interface Props { searchParams: Promise<Record<string, string | undefined>> }

export default async function AllContactsSearchPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  let rows = [] as Awaited<ReturnType<typeof getAllContacts>>;
  let error = "";
  try {
    rows = await getAllContacts({
      search: params.search, name: params.name, cell: params.cell, email: params.email,
      includeCompanies: params.companies !== "0", includeEmployees: params.employees !== "0",
      includeNoCommunication: params.noCommunication === "1",
    });
  } catch {
    error = "Contacts could not be loaded from SQL Server. Check the database connection and refresh.";
  }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><AllContactsSearchScreen rows={rows} error={error} initialFilters={{ search: params.search ?? "", name: params.name ?? "", cell: params.cell ?? "", email: params.email ?? "", includeCompanies: params.companies !== "0", includeEmployees: params.employees !== "0", includeNoCommunication: params.noCommunication === "1" }} /></AppShell>;
}
