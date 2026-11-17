"use client";

import {AccountingSavedViews} from "./AccountingSavedViews";
import {useLayoutEffect,useState} from "react";
import {CustomerRecordsLoading} from "@/components/customers/CustomerRecordsLoading";
import {createPortal} from "react-dom";
import {usePathname} from "next/navigation";
const routes=new Set(["accounting-reports","accounting-job-orders-report","accounts-receivable","all-jobs","check-weekly-rates","cluster-commissions","cluster-commissions-for-salesman","clusters","commissions","commissions-for-salesman","commissions-report","company-contacts","current-jobs","customer-history-report","deleted-employees","detailed-payroll-report","employee-options-search","employee-referral-report","employees-in-tracking","employees-on-site-per-week-report","gross-payroll-by-week","invoice-report","job-employees","mileage-log","new-assignments-returned-employees","new-report-search","ocip-jobs","office-staff-hours","office-staff-login-raw-data-search","office-staff-login-summary-search","open-invoices","payroll-adjustments","payroll-check-notes-report","payroll-crosschecks","payroll-export-report","payroll-report-search","rate-jobs","rates-invoice-total","regular-payroll-report","sales-by-customer","sales-by-customer-by-state","sales-by-salesman-weekly-breakdown","sales-report-breakdown","salesman-report","shift-differential-jobs","state-cities","t-sheets-linked","total-payroll-by-job-search","total-payroll-report-search","tracking-report","twenty-percent-rule-report","ui-unemployment-report-search","wcc-payroll","wcc-payroll-by-customer","wcc-rates-report","website-application","weekly-certified-payroll","weekly-sales-report","xcelhr-payroll-report","yearly-sales-report"]);
export function AccountingReportAppearance(){
 const pathname=usePathname();const enabled=routes.has(pathname.split("/")[1]);const reportOpen=enabled&&pathname.split("/")[1]!=="accounting-reports";
 const [pending,setPending]=useState(0);
 const [tableArea,setTableArea]=useState<HTMLElement|null>(null);
 useLayoutEffect(()=>{if(!pending){setTableArea(null);return;}const table=document.querySelector("main table");const area=table?.parentElement;if(!area)return;const previous=area.style.position;area.style.position="relative";setTableArea(area);return()=>{area.style.position=previous;};},[pending]);
 useLayoutEffect(()=>{
  setPending(0);if(!reportOpen)return;
  let mounted=true;const original=window.fetch;
  const wrapped:typeof fetch=async(input,init)=>{
   const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url,window.location.origin);
   if(url.origin!==window.location.origin||!url.pathname.startsWith("/api/")||url.pathname.endsWith("/saved-views"))return original(input,init);
   setPending(n=>n+1);let released=false;
   const release=()=>{if(!released){released=true;if(mounted)setPending(n=>Math.max(0,n-1));}};
   try{
    const response=await original(input,init);
    // Follow the response body too, so the loader stays until table data is ready.
    void response.clone().arrayBuffer().then(release,release);
    return response;
   }catch(error){release();throw error;}
  };
  window.fetch=wrapped;
  return()=>{mounted=false;if(window.fetch===wrapped)window.fetch=original;};
 },[reportOpen,pathname]);
 return enabled?<><span hidden data-accounting-report-appearance/>{reportOpen&&<AccountingSavedViews key={pathname} report={pathname.split("/")[1]}/>}{reportOpen&&pending>0&&(tableArea?createPortal(<div style={{position:"absolute",inset:0,zIndex:20,display:"flex",minHeight:290}}><CustomerRecordsLoading recordType="report" progress={{stage:"fetching",bytes:0}}/></div>,tableArea):<CustomerRecordsLoading recordType="report" progress={{stage:"fetching",bytes:0}}/>)}</>:null;
}