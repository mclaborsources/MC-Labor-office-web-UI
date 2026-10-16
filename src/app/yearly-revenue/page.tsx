import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { YearlyRevenueScreen } from "@/components/yearly-revenue/YearlyRevenueScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getYearlyRevenueReport } from "@/lib/yearlyRevenueReport";

export const dynamic = "force-dynamic";
export default async function YearlyRevenuePage({ searchParams }: { searchParams: Promise<{ search?: string; inactiveYears?: string; page?: string; sort?: string; direction?: string }> }) {
  const [session, params] = await Promise.all([getSessionOrDefault(), searchParams]);
  if (!session.isLoggedIn || !session.user?.active) redirect("/login");
  const search = (params.search ?? "").slice(0,200);
  const candidate = Number(params.inactiveYears);
  const inactiveYears = Number.isInteger(candidate) && candidate>=2 && candidate<=10 ? candidate : 0;
  const sort = params.sort ?? "Customer";
  const direction = params.direction === "desc" ? "desc" : "asc";
  let report: Awaited<ReturnType<typeof getYearlyRevenueReport>> = {rows:[],years:[],total:0,page:1};
  let error = "";
  try { report = await getYearlyRevenueReport({search,inactiveYears,page:Number(params.page),sort,direction}); }
  catch { error = "Revenue records could not be loaded from SQL Server."; }
  return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><YearlyRevenueScreen report={report} search={search} inactiveYears={inactiveYears} sort={sort} direction={direction} error={error} /></AppShell>;
}
