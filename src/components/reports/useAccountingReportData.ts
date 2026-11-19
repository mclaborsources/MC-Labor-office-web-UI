"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
export const EMPTY_REPORT_ROWS:never[]=[];
const EMPTY_CRITERIA:Record<string,string|undefined>={};
export function useAccountingReportData<T>(initialRows:T[],initialError="",initialCriteria:Record<string,string|undefined>=EMPTY_CRITERIA){
 const pathname=usePathname(),controller=useRef<AbortController|null>(null);
 const [rows,setRows]=useState(initialRows),[error,setError]=useState(initialError),[loading,setLoading]=useState(false);
 const [criteria,setCriteria]=useState(initialCriteria);
 useEffect(()=>{setRows(initialRows);setError(initialError);},[initialRows,initialError]);
 useEffect(()=>{setCriteria(initialCriteria);},[initialCriteria]);
 useEffect(()=>()=>{
  controller.current?.abort();
  // React can replay mount effects. Let the next setup start a fresh request.
  controller.current=null;
 },[pathname]);
 const refetch=useCallback(async(target?:string)=>{
  const url=new URL(target||window.location.href,window.location.origin);
  const endpoint="/api/reports/"+url.pathname.split("/").filter(Boolean)[0]+"/data?"+url.searchParams;
  controller.current?.abort();const current=new AbortController();controller.current=current;setLoading(true);setError("");
  try{const response=await fetch(endpoint,{cache:"no-store",signal:current.signal});const result=await response.json();
   if(!response.ok||!result.ok)throw new Error(result.error||"Report data could not be fetched.");
   if(current.signal.aborted)return;setRows(result.rows);setCriteria(result.criteria||Object.fromEntries(url.searchParams));
   window.history.replaceState(window.history.state,"",url.pathname+url.search);
  }catch(cause){if(current.signal.aborted)return;setError(cause instanceof Error?cause.message:"Report data could not be fetched.");}
  finally{if(controller.current===current)setLoading(false);}
 },[pathname]);
 useEffect(()=>{
  if(initialRows.length||initialError||controller.current)return;
  const routes=new Set(["total-payroll-report-search","office-staff-login-raw-data-search","office-staff-login-summary-search","tracking-report","sales-by-customer","sales-by-customer-by-state","sales-by-salesman-weekly-breakdown","customer-history-report","gross-payroll-by-week","employees-on-site-per-week-report","invoice-report","weekly-sales-report","yearly-sales-report","employee-referral-report","accounting-job-orders-report","ui-unemployment-report-search","wcc-payroll-by-customer","salesman-report","total-payroll-by-job-search"]);
  if(routes.has(pathname.split("/")[1]))void refetch();
 },[pathname,refetch]);
 return {rows,error,loading,refetch,criteria};
}
