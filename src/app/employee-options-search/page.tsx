import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {EmployeeOptionsSearchScreen} from "@/components/reports/EmployeeOptionsSearchScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const params=await searchParams;const session=await getSessionOrDefault();return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><EmployeeOptionsSearchScreen loadOnOpen excludedOnly={params.excludedOnly==="1"}/></AppShell>;}
