import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getEmployeeExclusionRows} from "@/lib/employeeExclusions";
import {EmployeeExclusionsScreen} from "@/components/reports/EmployeeExclusionsScreen";
export const dynamic="force-dynamic";
export default async function Page(){const session=await getSessionOrDefault();let rows:Awaited<ReturnType<typeof getEmployeeExclusionRows>>=[];let error="";try{rows=await getEmployeeExclusionRows();}catch{error="Employee exclusions could not be loaded. Check the database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><EmployeeExclusionsScreen rows={rows} error={error}/></AppShell>;}