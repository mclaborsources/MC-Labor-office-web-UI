"use client";
import type {AccountingReportOptions} from "@/lib/accountingReportOptions";
import {WccPayrollScreen} from "./WccPayrollScreen";
export function WccPayrollCustomerScreen({options,criteria,rows=[],error=""}:{rows?:import("@/lib/wccPayrollReport").WccCustomerRow[];error?:string;options:AccountingReportOptions;criteria:Record<string,string|undefined>}){
 return <WccPayrollScreen options={options} customerRows={rows} error={error} criteria={{...criteria,groupBy:"customer"}}/>;
}
