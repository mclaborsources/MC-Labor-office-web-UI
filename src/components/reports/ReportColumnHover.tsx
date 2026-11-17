"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {createPortal} from "react-dom";
const routes=new Set(["total-payroll-report-search","total-payroll-by-job-search","wcc-payroll","wcc-payroll-by-customer","ui-unemployment-report-search"]);
/** One delegated listener covers data, total, empty and dynamically loaded table cells. */
export function ReportColumnHover(){
 const pathname=usePathname();const enabled=routes.has(pathname.split("/")[1]);
 const marker=useRef<HTMLSpanElement>(null);const [label,setLabel]=useState("");const [target,setTarget]=useState<HTMLElement|null>(null);
 useEffect(()=>{
  const main=marker.current?.parentElement;if(!enabled||!main)return;
  const findTarget=()=>setTarget(main.querySelector<HTMLElement>("[data-report-column-status]"));
  findTarget();const observer=new MutationObserver(findTarget);observer.observe(main,{childList:true,subtree:true});
  const hover=(event:Event)=>{
   const element=event.target instanceof Element?event.target:null;
   const cell=element?.closest<HTMLTableCellElement>("td,th");
   const table=cell?.closest("table");if(!cell||!table||!main.contains(table)){setLabel("");return;}
   let index=0;for(const sibling of Array.from(cell.parentElement?.children||[])){if(sibling===cell)break;index+=(sibling as HTMLTableCellElement).colSpan||1;}
   if(cell.colSpan>1){setLabel("");return;}
   const headerRow=Array.from(table.tHead?.rows||[]).at(-1);
   let offset=0;let header:HTMLTableCellElement|undefined;
   for(const candidate of Array.from(headerRow?.cells||[])){if(index>=offset&&index<offset+candidate.colSpan){header=candidate;break;}offset+=candidate.colSpan;}
   const named=header?.querySelector<HTMLElement>("[data-column-label]");
   const text=named?.dataset.columnLabel||header?.dataset.columnLabel||header?.textContent||"";
   setLabel(text.replace(/[⌄▾▼]/g,"").trim());
  };
  const leave=()=>setLabel("");
  main.addEventListener("mouseover",hover);main.addEventListener("focusin",hover);main.addEventListener("mouseleave",leave);
  return()=>{observer.disconnect();main.removeEventListener("mouseover",hover);main.removeEventListener("focusin",hover);main.removeEventListener("mouseleave",leave);};
 },[pathname,enabled]);
 if(!enabled)return null;
 const style={background:"#ffffa8",color:"#000",font:"13px Arial",whiteSpace:"nowrap" as const,padding:"4px 6px",boxSizing:"border-box" as const};
 return <><span ref={marker} hidden/>{target?(label&&createPortal(<span title={label} aria-live="polite" style={{...style,position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:1}}>{label}</span>,target)):<div className="report-column-hover-bar" role="status" style={{...style,flex:"0 0 25px",minHeight:25,margin:"3px 10px",maxWidth:740}}>{label}</div>}</>;
}
