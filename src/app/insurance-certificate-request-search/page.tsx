import { AppShell } from "@/components/layout/AppShell";
import { OperationalReportScreen } from "@/components/reports/OperationalReportScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getInsuranceCertificateRows, type OperationalReportRow } from "@/lib/operationalReports";
export default async function Page(){const session=await getSessionOrDefault();let rows:OperationalReportRow[]=[];let error="";try{rows=await getInsuranceCertificateRows()}catch{error="Insurance certificate records could not be loaded from SQL Server."}return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><OperationalReportScreen title="Insurance Certificate Request Report" variant="insurance" rows={rows} error={error}/></AppShell>}
