"use client";
import type {AccountingReportOptions} from "@/lib/accountingReportOptions";
import type {TrackingReportRow} from "@/lib/trackingReport";
import {PayrollReportSearchScreen} from "@/components/reports/PayrollReportSearchScreen";
export function TrackingReportScreen({options,criteria,rows=[],error=""}:{options:AccountingReportOptions;criteria:Record<string,string|undefined>;rows?:TrackingReportRow[];error?:string}){
 return <PayrollReportSearchScreen initialWeekEnding={criteria.weekEnding||""} initialRows={[]} trackingData={rows} criteria={criteria} employeeExclusionsAvailable={options.employeeExclusionsAvailable} companies={options.companies} initialError={error} routeBase="/tracking-report"/>;
}
