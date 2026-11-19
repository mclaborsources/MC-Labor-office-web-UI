import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getWccPayrollRows,type WccPayrollRow} from "@/lib/wccPayrollReport";
import {WccPayrollScreen} from "@/components/wcc-payroll/WccPayrollScreen";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {redirect} from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const params=await searchParams;if(!params.state)redirect('/accounting-reports');const [session,options]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions()]);applyReportStartDefault(params);return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><WccPayrollScreen options={options} criteria={params} loadOnOpen/></AppShell>;}
