"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function CustomerCellNavigation(){
 const router=useRouter();const [message,setMessage]=useState("");
 useEffect(()=>{
  const navigate=async(event:MouseEvent)=>{
   const target=event.target instanceof Element?event.target:null;
   const cell=target?.closest('td');if(!cell)return;
   const table=cell.closest('table');if(!table)return;
   const header=table.querySelector('thead tr')?.children[cell.cellIndex];
   const label=(header?.textContent??'').replace(/[▾▼▲?]/g,'').trim().toLowerCase();
   const customerColumn=/^(customer|customer name|company|company name|custbusname|cust bus name|customer business name)$/.test(label)||((label==='last week'||label==='this week')&&!!table.closest('.company-comparison'))||(label==='name'&&!!table.closest('.ac-tracking-search'));
   const jobColumn=/^(job|job name|site|site name)$/.test(label);
   if(!jobColumn && !customerColumn && !(label==='name' && !!table.closest('[class*="customer-search"]')))return;
   const name=(cell.getAttribute('data-customer-name')||cell.textContent||'').trim();if(!name||name==='-')return;
   event.preventDefault();event.stopPropagation();
   const entity=jobColumn?'jobs':'customers';
   const customerIndex=Array.from(table.querySelector('thead tr')?.children??[]).findIndex(header=>/^(customer|customer name|company|custbusname)$/i.test((header.textContent??'').replace(/[▾▼▲?]/g,'').trim()));
   const customer=jobColumn&&customerIndex>=0?(cell.parentElement?.children[customerIndex]?.textContent??'').trim():'';
   const id=cell.getAttribute(jobColumn?'data-job-id':'data-customer-id');if(id){router.push(`/${entity}/${encodeURIComponent(id)}`);return;}
   setMessage(jobColumn?'Opening job details...':'Opening customer details...');
   try{const response=await fetch(`/api/${entity}/resolve?name=${encodeURIComponent(name)}&customer=${encodeURIComponent(customer)}`);const result=await response.json();if(!response.ok)throw Error(result.error);if(result.matches.length===1){setMessage('');router.push(`/${entity}/${result.matches[0].id}`);}else if(result.matches.length>1){setMessage('');router.push(`/${entity}?search=${encodeURIComponent(name)}`);}else{setMessage('No matching record was found.');}}
   catch{setMessage('Details could not be opened. Please try again.');}
  };
  document.addEventListener('dblclick',navigate,true);return()=>document.removeEventListener('dblclick',navigate,true);
 },[router]);
 return message?<div role="status" style={{position:'fixed',bottom:16,right:16,zIndex:1000,background:'white',border:'1px solid #aaa',padding:'10px 16px',boxShadow:'0 2px 8px #0003'}} onClick={()=>setMessage('')}>{message}</div>:null;
}
