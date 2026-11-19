import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getSalesByCustomerRows,type SalesByCustomerRow} from "@/lib/salesByCustomer";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getAccountingReportOptions} from "@/lib/accountingReportOptions";
import {SalesByCustomerScreen} from "@/components/reports/SalesByCustomerScreen";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,options,criteria]=await Promise.all([getSessionOrDefault(),getAccountingReportOptions(),searchParams]);let rows:SalesByCustomerRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=[];}catch{error="Customer sales by state could not be loaded. Check the dates and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><SalesByCustomerScreen options={options} criteria={criteria} rows={rows} error={error} byState/></AppShell>;}
