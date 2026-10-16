import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeDocumentReportScreen } from "@/components/employee-document-report/EmployeeDocumentReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getEmployeeDocumentRows } from "@/lib/adminReportQueries";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  const search = (params.search ?? "").slice(0, 200);
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage>0 && requestedPage<=100000 ? requestedPage : 1;
  let rows: Awaited<ReturnType<typeof getEmployeeDocumentRows>> = [];
  let error = "";
  try { rows = await getEmployeeDocumentRows("id", search, page); }
  catch { error = "Employee records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><EmployeeDocumentReportScreen mode="id" key={search+page} rows={rows} page={page} search={search} error={error} /></AppShell>;
}
