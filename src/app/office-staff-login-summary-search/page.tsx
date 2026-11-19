import {getStaffLoginRawReport,summarizeStaffLogins,type StaffLoginRawRow} from "@/lib/officeStaffLoginRaw";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {OfficeStaffLoginReportScreen} from "@/components/reports/OfficeStaffLoginReportScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,criteria]=await Promise.all([getSessionOrDefault(),searchParams]);let rows:StaffLoginRawRow[]=[];let error="";try{rows=[];}catch{error="Office staff login summary could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><OfficeStaffLoginReportScreen summary={true} criteria={criteria} rows={rows} error={error}/></AppShell>;}
