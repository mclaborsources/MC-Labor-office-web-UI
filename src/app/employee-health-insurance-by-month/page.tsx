import { AppShell } from "@/components/layout/AppShell";
import { HealthInsuranceMonthScreen } from "@/components/health-insurance-report/HealthInsuranceMonthScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getHealthInsuranceReportYears } from "@/lib/healthInsuranceMonthReport";
export default async function Page(){const session=await getSessionOrDefault();let years:number[]=[];let error="";try{years=await getHealthInsuranceReportYears()}catch{error="Report years could not be loaded from SQL Server."}return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><HealthInsuranceMonthScreen years={years} initialError={error}/></AppShell>}
