import { AppShell } from "@/components/layout/AppShell";
import { HealthInsuranceMonthScreen } from "@/components/health-insurance-report/HealthInsuranceMonthScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
export default async function Page(){const session=await getSessionOrDefault();return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><HealthInsuranceMonthScreen/></AppShell>}
