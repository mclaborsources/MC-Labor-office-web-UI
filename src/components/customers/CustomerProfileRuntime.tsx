"use client";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CUSTOMER_PROFILE_FIELDS, VERIFY_FIELDS, PROFILE_RELATED, type CustomerProfileData, type ProfileRecord } from "@/lib/customerProfileFields";

type Mutation={entity:string;id?:string;action?:string;changes?:Record<string,unknown>};
type Runtime={data:CustomerProfileData;stage:(entity:string,mutations:Mutation[])=>void;save:()=>Promise<void>};
const Context=createContext<Runtime|null>(null);
export function useCustomerProfile() { const context=useContext(Context); if(!context) throw new Error("Customer profile provider is missing."); return context; }
export function useProfileRows<T>(entity:keyof typeof PROFILE_RELATED,decode:(row:ProfileRecord)=>T,encode:(row:T)=>{id:string;changes:Record<string,unknown>},empty:T[]=[]):[T[],React.Dispatch<React.SetStateAction<T[]>>] {
  const {data,stage}=useCustomerProfile();
  const initial=useRef((data.related[entity]??[]).map(decode));
  const startingRows=useRef(initial.current.length ? initial.current : empty);
  const [rows,setRows]=useState<T[]>(startingRows.current);
  const original=useRef(new Map(initial.current.map(row=>{const record=encode(row);return [record.id,record.changes];})));
  const encodeRef=useRef(encode); encodeRef.current=encode;
  useEffect(()=> {
    if(rows===startingRows.current) return;
    const records=rows.map(encodeRef.current);
    const mutations:Mutation[]=records.filter(row=>JSON.stringify(row.changes)!==JSON.stringify(original.current.get(row.id))).map(row=>({entity,id:/^\d+$/.test(row.id)?row.id:undefined,changes:row.changes}));
    for(const id of original.current.keys()) if(!records.some(row=>row.id===id)) mutations.push({entity,id,action:"delete"});
    stage(entity,mutations);
  },[rows,entity,stage,empty]);
  return [rows,setRows];
}
function identifyField(control:HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement):string|undefined {
  const aria=control.getAttribute("aria-label")??"";
  const label=control.closest("label");
  const caption=aria || label?.querySelector(":scope > span:first-child")?.textContent?.trim() || Array.from(label?.childNodes??[]).filter(node=>node.nodeType===3).map(node=>node.textContent).join("").trim();
  if(control.closest("table")) return;
  const verify=aria.startsWith("Verify ") ? VERIFY_FIELDS[aria.slice(7)] : undefined;
  if(verify) return verify;
  const audit=aria.match(/^(?:Verification (user|date) for (.+)|(.+) verification (user|date))$/);
  if(audit) {const key=VERIFY_FIELDS[audit[2]??audit[3]]; if(key)return key+((audit[1]??audit[4])==="user"?"UserName":"Timestamp");}
  if(control.closest(".ac-customer-sales-mailing")) {
    if(caption==="Street")return "MailStreet";
    if(caption==="City, St.")return "MailCity";
    if(caption==="Zip")return "MailZip";
  }
  if(control.closest(".ac-customer-profile-col:first-child") && label) {
    const labels=Array.from(label.parentElement?.children??[]); if(labels.indexOf(label)>4 && ["Street","City, State","Zip"].includes(caption??"")) return {Street:"MailStreet","City, State":"MailCity",Zip:"MailZip"}[caption as "Street"];
  }
  if(control.closest(".ac-customer-sales-history-status")) {
    const parent=control.closest(".ac-customer-sales-history-status")!;
    const index=Array.from(parent.children).indexOf(label!);
    if(index===2 || index===8) return (index===2?"InternetSalesReady":"FutureCall")+(Array.from(label!.querySelectorAll("input")).indexOf(control as HTMLInputElement)===0?"UserName":"Timestamp");
  }
  const insurance=aria.match(/^(\S+) (WC|GL) expiration date$/);
  if(insurance)return `${insurance[2]}xDate${insurance[1]==="GS"?"":insurance[1]}`;
  const hyperlink=aria.match(/^(\S+) Open (Contract|W-9|WC|GL) file$/);
  if(hyperlink)return `HLink${{Contract:"SalesContract","W-9":"W9",WC:"WCxDate",GL:"GLxDate"}[hyperlink[2]]}${hyperlink[1]==="GS"?"":hyperlink[1]}`;
  return CUSTOMER_PROFILE_FIELDS[caption??""] ?? {"Invoice Email":"CustEmail","Customer Web Site":"CustWebSiteHLink","LinkedIn Profile":"CustomerLinkedInProfile","Entry User":"CustEntryUserName","Entry Date":"CustEntryTimestamp","No Communication":"CustomerNoCommunication","Return to Sender":"CustomerReturnToSender","Customer Note Shown in Tracking":"CustomerNote","Invoice Note Shown in Tracking":"InvoiceNote"}[caption??""];
}
export function CustomerProfileRuntime({customerId,tab,children}:{customerId:string;tab:string;children:ReactNode}) {
  const [data,setData]=useState<CustomerProfileData|null>(null);
  const [message,setMessage]=useState("Loading customer profile…");
  const [busy,setBusy]=useState(false);
  const [revision,setRevision]=useState(0);
  const ref=useRef<HTMLDivElement>(null);
  const changes=useRef<Record<string,unknown>>({});
  const staged=useRef<Record<string,Mutation[]>>({});
  useEffect(()=>{const controller=new AbortController(); fetch(`/api/customers/${customerId}/profile`,{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok||!body.ok)throw new Error(body.error);setData(body.data);setMessage(body.data.errors.join(" "));}).catch(error=>{if(error.name!=="AbortError")setMessage(error.message);});return()=>controller.abort();},[customerId]);
  const stage=useCallback((entity:string,mutations:Mutation[])=>{staged.current[entity]=mutations;},[]);
  const save=useCallback(async()=>{
    if(busy)return; setBusy(true);
    try {
      const mutations=[...(Object.keys(changes.current).length?[{entity:"customer",changes:{...changes.current}}]:[]),...Object.values(staged.current).flat()];
      if(!mutations.length){setMessage("No changes to save.");return;}
      const response=await fetch(`/api/customers/${customerId}/profile`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({mutations})});
      const body=await response.json();if(!response.ok||!body.ok)throw new Error(body.error);
      changes.current={};staged.current={};setData(body.data);setRevision(value=>value+1);setMessage("Customer changes saved.");
    }catch(error){setMessage(error instanceof Error?error.message:"Save failed.");}finally{setBusy(false);}
  },[busy,customerId,data]);
  useLayoutEffect(()=>{
    if(!data||!ref.current)return;
    for(const control of ref.current.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("input,select,textarea")) {
      const field=identifyField(control);if(!field || !(field in data.fields))continue;
      control.dataset.customerField=field;
      const raw=changes.current[field]??data.fields[field];
      const options=data.lookups[field];
      if(control instanceof HTMLSelectElement && options?.length) { control.replaceChildren(new Option("",""),...options.map(option=>new Option(option.label,option.value))); if(raw && !options.some(option=>option.value===String(raw)))control.add(new Option(String(raw),String(raw))); }
      if(control instanceof HTMLInputElement && control.type==="checkbox")control.checked=["true","1"].includes(String(raw).toLowerCase());
      else if(control instanceof HTMLInputElement && options?.length) {control.value=options.find(option=>option.value===String(raw))?.label??String(raw??"");control.readOnly=true;delete control.dataset.customerField;}
      else { if(control instanceof HTMLInputElement && /date|expiration/i.test(control.getAttribute("aria-label")??"") && !/UserName/.test(field))control.type="date";control.value=control instanceof HTMLInputElement && control.type==="date" ? String(raw??"").slice(0,10) : String(raw??""); }
      if(/Timestamp$|UserName$|^CustEntry/.test(field) && !(control instanceof HTMLSelectElement))control.readOnly=true;
    }
  },[data,tab,revision]);
  return <div className="ac-customer-profile-runtime" ref={ref} style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}} onChangeCapture={event=>{
    const control=event.target as HTMLInputElement;const field=control.dataset.customerField;if(!field||!data)return;
    changes.current[field]=control.type==="checkbox"?control.checked:control.value;
  }} onClickCapture={event=>{const button=(event.target as HTMLElement).closest("button");if(button?.classList.contains("ac-customer-profile-save-btn")){event.preventDefault();event.stopPropagation();void save();}}}>
    {message && <div role="status" className="ac-profile-save-status">{message}</div>}
    {data ? <Context.Provider value={{data,stage,save}}><div key={revision} style={{display:"contents"}}>{children}</div></Context.Provider> : null}
    {busy && <span role="status">Saving customer changes…</span>}
  </div>;
}
