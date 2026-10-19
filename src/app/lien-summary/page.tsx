import { AppShell } from "@/components/layout/AppShell";
import { LienSummaryScreen } from "@/components/reports/LienSummaryScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getSeamusLienSummaryRows, type SeamusLienSummaryRow } from "@/lib/operationalReports";
export default async function LienSummaryPage(){const session=await getSessionOrDefault();let rows:SeamusLienSummaryRow[]=[];let error="";try{rows=await getSeamusLienSummaryRows();}catch{error="Seamus lien report data could not be loaded from the office database.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><LienSummaryScreen generatedAt={new Date().toISOString()} rows={rows} error={error}/></AppShell>;}
