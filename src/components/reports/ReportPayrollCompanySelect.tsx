"use client";
import {Children,isValidElement,useEffect,useState,type ReactNode,type SelectHTMLAttributes,type ChangeEvent} from "react";
import {PayrollCompanySelect} from "./PayrollCompanySelect";
let request:Promise<{code:string;name:string}[]>|undefined;
function optionsOf(children:ReactNode):{code:string;name:string}[]{return Children.toArray(children).flatMap(child=>{if(!isValidElement(child))return [];const props=child.props as {value?:string;children?:ReactNode};if(child.type==='option'){const name=Children.toArray(props.children).join('');return [{code:props.value??name,name}];}return optionsOf(props.children);});}
export function ReportPayrollCompanySelect({children,value,onChange,...props}:SelectHTMLAttributes<HTMLSelectElement>){
 const [companies,setCompanies]=useState<{code:string;name:string}[]>([]);
 useEffect(()=>{let active=true;request??=fetch('/api/reports/payroll-companies').then(async r=>{if(!r.ok)throw Error('Could not load companies');return (await r.json()).companies;});request.then(rows=>{if(active)setCompanies(rows);}).catch(()=>{request=undefined;});return()=>{active=false;};},[]);
 const original=optionsOf(children);const choices=[...original.filter(o=>!companies.some(c=>c.code===o.code)),...companies];
 return <PayrollCompanySelect value={String(value??'')} onChange={next=>onChange?.({target:{value:next},currentTarget:{value:next}} as ChangeEvent<HTMLSelectElement>)} companies={choices.filter(c=>c.code!=='')} placeholder={original.find(c=>!c.code)?.name??'<Payroll Co>'} className={props.className} style={props.style} disabled={props.disabled} ariaLabel={props['aria-label']??'Payroll company'}/>;
}