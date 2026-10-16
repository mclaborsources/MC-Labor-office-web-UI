import {AppShell} from "@/components/layout/AppShell";
import {XcelHrPayrollReportScreen} from "@/components/reports/XcelHrPayrollReportScreen";
import {getSessionOrDefault} from "@/lib/auth/session";
import {getRegularPayrollCompanies,getXcelHrPayrollRows,type XcelHrPayrollRow} from "@/lib/regularPayrollReport";
import {thisWeekDayDate} from "@/lib/week";

export default async function XcelHrPayrollReportPage(){const session=await getSessionOrDefault();const friday=thisWeekDayDate(new Date(),7);const weekEnding=`${friday.getFullYear()}-${String(friday.getMonth()+1).padStart(2,"0")}-${String(friday.getDate()).padStart(2,"0")}`;let companies:Awaited<ReturnType<typeof getRegularPayrollCompanies>>=[];let rows:XcelHrPayrollRow[]=[];let error="";try{companies=await getRegularPayrollCompanies();rows=await getXcelHrPayrollRows(weekEnding,companies.find(company=>company.name==="IPG")?.name??companies[0]?.name??"");}catch{error="XcelHR payroll data could not be loaded from the office database.";}return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><XcelHrPayrollReportScreen initialWeekEnding={weekEnding} initialRows={rows} companies={companies.map(company=>company.name)} initialError={error}/></AppShell>;}
