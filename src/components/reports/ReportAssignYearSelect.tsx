"use client";
import {useEffect,useRef,useState,type SelectHTMLAttributes,type ChangeEvent} from "react";
import {createPortal} from "react-dom";
type Year={year:string;min:string;max:string};
let request:Promise<Year[]>|undefined;
function load(){return request??=(fetch('/api/reports/assign-years').then(async r=>{if(!r.ok)throw Error();return (await r.json()).years as Year[];}).catch(e=>{request=undefined;throw e;}));}
export function ReportAssignYearSelect({children,onChange,...props}:SelectHTMLAttributes<HTMLSelectElement>){
 const control=useRef<HTMLSelectElement>(null),panel=useRef<HTMLDivElement>(null);
 const [rows,setRows]=useState<Year[]>([]),[open,setOpen]=useState(false),[error,setError]=useState(false),[position,setPosition]=useState({left:0,top:0});
 const fetchYears=()=>{setError(false);load().then(setRows).catch(()=>setError(true));};
 useEffect(()=>{fetchYears();},[]);
 useEffect(()=>{if(!open)return;const close=(e:MouseEvent)=>{if(!panel.current?.contains(e.target as Node)&&e.target!==control.current)setOpen(false);};const hide=()=>setOpen(false);document.addEventListener('mousedown',close);window.addEventListener('resize',hide);window.addEventListener('scroll',hide,true);return()=>{document.removeEventListener('mousedown',close);window.removeEventListener('resize',hide);window.removeEventListener('scroll',hide,true);};},[open]);
 const show=()=>{const rect=control.current?.getBoundingClientRect();if(!rect)return;setPosition({left:Math.max(0,Math.min(rect.left,window.innerWidth-360)),top:rect.bottom});setOpen(x=>!x);if(error)fetchYears();};
 const choose=(value:string)=>{onChange?.({target:{value},currentTarget:{value}} as ChangeEvent<HTMLSelectElement>);setOpen(false);control.current?.focus();};
 const date=(s:string)=>s.replace(/\b0(\d)/g,'$1');
 return <><select {...props} ref={control} aria-label={props['aria-label']||'Assign Year'} aria-expanded={open} onChange={onChange} onMouseDown={e=>{if(!props.disabled){e.preventDefault();control.current?.focus();show();}}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);else if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();show();}}}>{children}</select>{open&&createPortal(<div ref={panel} className="report-assign-year-list" style={position} role="listbox" aria-label="Assign Year"><div className="report-assign-year-heading"><span>Assign Year</span><span>Min Week End</span><span>Max Week End</span></div><div className="report-assign-year-rows">{rows.map(row=><div key={row.year} role="option" aria-selected={String(props.value)===row.year} tabIndex={0} onClick={()=>choose(row.year)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(row.year);}if(e.key==='Escape'){setOpen(false);control.current?.focus();}if(e.key==='ArrowDown'){e.preventDefault();(e.currentTarget.nextElementSibling as HTMLElement)?.focus();}if(e.key==='ArrowUp'){e.preventDefault();(e.currentTarget.previousElementSibling as HTMLElement)?.focus();}}}><span>{row.year}</span><span>{date(row.min||'')}</span><span>{date(row.max||'')}</span></div>)}{!rows.length&&<div role="status">{error?<button onClick={fetchYears}>Retry loading years</button>:'Loading years…'}</div>}</div></div>,document.body)}</>;
}
