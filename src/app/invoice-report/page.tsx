import {applyReportStartDefault} from "@/lib/accountingReportDates";
import {getInvoiceReportRows,type InvoiceReportRow} from "@/lib/invoiceReport";
import {getNewReportSearchWeeks} from "@/lib/newReportSearch";
import {AppShell} from "@/components/layout/AppShell";
import {getSessionOrDefault} from "@/lib/auth/session";
import {InvoiceReportPreview} from "@/components/reports/InvoiceReportPreview";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const [session,criteria]=await Promise.all([getSessionOrDefault(),searchParams]);let rows:InvoiceReportRow[]=[];let error="";applyReportStartDefault(criteria);try{if(!criteria.endDate&&!criteria.weekEnding)criteria.weekEnding=(await getNewReportSearchWeeks())[0]?.value;rows=[];}catch{error="Invoice records could not be loaded. Check the criteria and database connection.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport compactHeader><InvoiceReportPreview criteria={criteria} rows={rows} error={error}/></AppShell>;}
