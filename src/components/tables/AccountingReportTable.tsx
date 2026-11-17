"use client";
import React,{Children,Fragment,cloneElement,isValidElement,useEffect,useMemo,useRef,useState,type ReactNode,type ReactElement,type TableHTMLAttributes} from "react";
import {createPortal} from "react-dom";
import {CustomerNameColumnHeader} from "@/components/customers/CustomerNameColumnHeader";
type Node=ReactElement<Record<string,any>>;
export function tableElements(children:ReactNode):Node[]{
 return Children.toArray(children).flatMap(child=>isValidElement(child)?child.type===Fragment?tableElements((child.props as {children?:ReactNode}).children):[child as Node]:[]);
}
function text(node:ReactNode):string{
 return Children.toArray(node).map(child=>isValidElement(child)?String((child.props as any).label??text((child.props as any).children)):typeof child==="string"||typeof child==="number"?String(child):"").join("").replace(/[⌄▾▼]/g,"").trim();
}
/** Remap cells by their logical source column, retaining merged summary/header cells. */
export function remapReportCells(row:Node,shown:number[],decorate?:(cell:Node,index:number)=>Node):Node{
 const cells=tableElements(row.props.children);const source:{cell:Node;source:number}[]=[];
 let index=0;for(const cell of cells){for(let n=0;n<Number(cell.props.colSpan||1);n++)source[index++]={cell,source:index-1};}
 const runs:{cell:Node;index:number;count:number}[]=[];
 for(const i of shown){const entry=source[i];if(!entry)continue;const last=runs.at(-1);if(last?.cell===entry.cell)last.count++;else runs.push({cell:entry.cell,index:i,count:1});}
 return cloneElement(row,{},runs.map(({cell,index,count})=>{
  const next=cloneElement(cell,{key:String(index),colSpan:count});
  return decorate?decorate(next,index):next;
 }));
}
interface Layout {widths:Record<number,number>;hidden:number[];order:number[]}
export function AccountingReportTable({columnLayoutKey,defaultHiddenColumns=[],columnPreset,children,style,...props}:TableHTMLAttributes<HTMLTableElement>&{columnLayoutKey:string;defaultHiddenColumns?:number[];columnPreset?:{id:string;order:number[];hidden:number[];widths:Record<number,number>}|null}){
 const root=useRef<HTMLTableElement>(null);
 const [viewport,setViewport]=useState({top:0,height:900,rowHeight:20});
 useEffect(()=>{
  const container=root.current?.parentElement;
  if(!container)return;
  const update=()=>setViewport({top:container.scrollTop,height:container.clientHeight||900,rowHeight:root.current?.tBodies[0]?.rows[0]?.getBoundingClientRect().height||20});
  update();container.addEventListener("scroll",update,{passive:true});
  const observer=new ResizeObserver(update);observer.observe(container);
  return()=>{container.removeEventListener("scroll",update);observer.disconnect();};
 },[]);
 const sections=tableElements(children),head=sections.find(s=>s.type==="thead");
 const headerRows=tableElements(head?.props.children),lastHeader=headerRows.at(-1);
 const headers=tableElements(lastHeader?.props.children);
 const labels=headers.map((cell,i)=>text(cell.props.children)||String(cell.props["data-column-label"]||"")||(i===0?"":"Column "+(i+1)));
 const signature=JSON.stringify(labels);
 const count=headers.length,pinned=labels[0]===""?0:-1;
 const initialOrder=headers.map((_,i)=>i);
 const defaultHidden=defaultHiddenColumns.filter(i=>i>=0&&i<count&&i!==pinned);
 const [layout,setLayout]=useState<Layout>({widths:{},hidden:defaultHidden,order:initialOrder});
 const [defaults,setDefaults]=useState<Record<number,number>>({});
 const [loadedKey,setLoadedKey]=useState(""),[unhide,setUnhide]=useState(false);
 const [drag,setDrag]=useState<number|null>(null),[over,setOver]=useState<number|null>(null);
 const [localSort,setLocalSort]=useState<{index:number;direction:"asc"|"desc"}|null>(null);
 const [localFilters,setLocalFilters]=useState<Record<number,string[]>>({});
 const key="accounting-table-columns-v1:"+columnLayoutKey+":"+signature;
 const ready=loadedKey===key;
 useEffect(()=>{
  const measured:Record<number,number>={};
  tableElements(sections.find(s=>s.type==="colgroup")?.props.children).forEach((col,i)=>{if(typeof col.props.style?.width==="number")measured[i]=col.props.style.width;});
  const row=root.current?.tHead?.rows[root.current.tHead.rows.length-1];
  Array.from(row?.cells||[]).forEach((cell,i)=>{const sourceIndex=shown[i]??i;if(measured[sourceIndex]===undefined)measured[sourceIndex]=Math.max(sourceIndex===pinned?16:48,Math.round(cell.getBoundingClientRect().width)||100);});
  setDefaults(measured);
  let next:Layout={widths:{},hidden:defaultHidden,order:Array.from({length:count},(_,i)=>i)};
  try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(saved){
   const valid=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<count;
   const hidden=Array.isArray(saved.hidden)?saved.hidden.filter((i:unknown)=>valid(i)&&i!==pinned):[];
   const order=Array.isArray(saved.order)?saved.order.filter((i:unknown)=>valid(i)&&i!==pinned):[];
   next={hidden:hidden.length<count-(pinned>=0?1:0)?hidden:[],order:[...(pinned>=0?[pinned]:[]),...new Set<number>([...order,...Array.from({length:count},(_,i)=>i).filter(i=>i!==pinned)])],
    widths:Object.fromEntries(Object.entries(saved.widths||{}).filter(([i,w])=>valid(Number(i))&&typeof w==="number"&&w>=48&&w<=1600).map(([i,w])=>[Number(i),Number(w)]))};
  }}catch{}
  setLayout(columnPreset?{order:columnPreset.order,hidden:columnPreset.hidden,widths:columnPreset.widths}:next);setLoadedKey(key);
 },[key,count,pinned]);
 useEffect(()=>{if(ready)try{localStorage.setItem(key,JSON.stringify(layout));}catch{}},[key,ready,layout]);
 useEffect(()=>{if(columnPreset)setLayout({order:columnPreset.order,hidden:columnPreset.hidden,widths:columnPreset.widths});},[columnPreset]);
 const viewState=useRef({layout,localSort,localFilters,headers});viewState.current={layout,localSort,localFilters,headers};
 useEffect(()=>{
  if(!ready)return;
  const collect=(event:Event)=>{const result=(event as CustomEvent).detail;const filters:Record<number,string[]>={...viewState.current.localFilters};let sort=viewState.current.localSort;
   viewState.current.headers.forEach((cell,i)=>{const original=tableElements(cell.props.children).find(c=>c.type===CustomerNameColumnHeader)?.props;if(original?.selected)filters[i]=original.selected;if(original?.sort)sort={index:i,direction:original.sort};});
   result[columnLayoutKey]={signature,layout:viewState.current.layout,filters,sort};};
  const apply=(event:Event)=>{const saved=(event as CustomEvent).detail?.[columnLayoutKey];
   if(saved&&saved.signature!==signature)return;
   const next=saved?.layout;const order=next?.order;
   if(next&&Array.isArray(order)&&order.length===count&&new Set(order).size===count&&order.every((i:number)=>Number.isInteger(i)&&i>=0&&i<count))setLayout({order,hidden:Array.isArray(next.hidden)?next.hidden.filter((i:number)=>i!==pinned&&order.includes(i)):[],widths:next.widths??{}});
   else setLayout(columnPreset?{order:columnPreset.order,hidden:columnPreset.hidden,widths:columnPreset.widths}:{order:initialOrder,hidden:defaultHidden,widths:{}});
   const filters=saved?.filters??{};setLocalFilters(filters);setLocalSort(saved?.sort??null);
   viewState.current.headers.forEach((cell,i)=>{const original=tableElements(cell.props.children).find(c=>c.type===CustomerNameColumnHeader)?.props;original?.onFilter?.(filters[i]);if(saved?.sort?.index===i)original?.onSort?.(saved.sort.direction);});
  };
  window.addEventListener("accounting-view-collect",collect);window.addEventListener("accounting-view-apply",apply);
  window.dispatchEvent(new Event("accounting-view-ready"));
  return()=>{window.removeEventListener("accounting-view-collect",collect);window.removeEventListener("accounting-view-apply",apply);};
 },[ready,key]);
 const shown=layout.order.filter(i=>i<count&&!layout.hidden.includes(i));
 const width=(i:number)=>layout.widths[i]??defaults[i]??(i===pinned?20:100);
 const resize=(i:number,value?:number)=>setLayout(old=>{const widths={...old.widths};if(value===undefined)delete widths[i];else widths[i]=Math.max(48,Math.min(1600,value));return {...old,widths};});
 const body=sections.find(s=>s.type==="tbody");
 const bodyRows=useMemo(()=>tableElements(body?.props.children),[body]);
 const valueAt=(row:Node,index:number)=>{let n=0;for(const cell of tableElements(row.props.children)){const span=Number(cell.props.colSpan||1);if(index>=n&&index<n+span)return text(cell.props.children);n+=span;}return "";};
 const filteredRows=useMemo(()=>{
  if(!localSort&&Object.keys(localFilters).length===0)return bodyRows;
  const result=bodyRows.filter(row=>Object.entries(localFilters).every(([i,values])=>values.includes(valueAt(row,Number(i)))));
  if(localSort)result.sort((a,b)=>{const x=valueAt(a,localSort.index),y=valueAt(b,localSort.index);const compare=x.localeCompare(y,undefined,{numeric:true,sensitivity:"base"});return localSort.direction==="asc"?compare:-compare;});
  return result;
 // Source rows are React children and change with report filtering/refresh.
 },[body,localFilters,localSort]);
 const decorate=(cell:Node,i:number):Node=>{
  if(i===pinned)return cell;
  if(!text(cell.props.children))return cloneElement(cell,{},null);
  const label=labels[i];
  const existing=tableElements(cell.props.children).find(c=>c.type===CustomerNameColumnHeader);
  const original=existing?.props;
  const common={
   label,columnKey:columnLayoutKey+"-"+i,width:width(i),onResize:(v:number)=>resize(i,v),onResetWidth:()=>resize(i),
   onHide:shown.filter(x=>x!==pinned).length>1?()=>setLayout(old=>({...old,hidden:[...old.hidden,i]})):undefined,
   onUnhideColumns:()=>setUnhide(true),
   onDragStart:(event:React.DragEvent)=>{setDrag(i);event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",String(i));},
   onDragOver:(event:React.DragEvent)=>{event.preventDefault();setOver(i);},
   onDrop:(event:React.DragEvent)=>{event.preventDefault();if(drag!==null&&drag!==i)setLayout(old=>{const order=old.order.filter(x=>x!==drag);order.splice(order.indexOf(i),0,drag);return {...old,order};});setDrag(null);setOver(null);},
   onDragEnd:()=>{setDrag(null);setOver(null);},dragging:drag===i,dropTarget:over===i,
   getValues:original?.getValues||(()=>bodyRows.map(row=>valueAt(row,i))),
   selected:original?.selected??localFilters[i],sort:original?.sort??(localSort?.index===i?localSort.direction:undefined),
   onSort:original?.onSort||((direction:"asc"|"desc")=>setLocalSort({index:i,direction})),
   onFilter:original?.onFilter||((values:string[]|undefined)=>setLocalFilters(old=>{const next={...old};if(values===undefined)delete next[i];else next[i]=values;return next;}))
  };
  return cloneElement(cell,{"data-column-label":label,title:label,style:{...cell.props.style,overflow:"visible"}},<CustomerNameColumnHeader {...original} {...common}/>);
 };
 const virtualize=filteredRows.length>500;
 const first=virtualize?Math.max(0,Math.floor(viewport.top/viewport.rowHeight)-12):0;
 const last=virtualize?Math.min(filteredRows.length,first+Math.ceil(viewport.height/viewport.rowHeight)+24):filteredRows.length;
 const spacer=(height:number,key:string)=><tr key={key} aria-hidden="true"><td colSpan={shown.length} style={{height,padding:0,border:0,background:"transparent"}}/></tr>;
 const rendered=sections.filter(s=>s.type!=="colgroup").map(section=>{
  if(section.type==="thead")return cloneElement(section,{},headerRows.map((row,index)=>remapReportCells(row,shown,index===headerRows.length-1?decorate:undefined)));
  if(section.type==="tbody")return cloneElement(section,{},[first>0?spacer(first*viewport.rowHeight,"virtual-top"):null,...filteredRows.slice(first,last).map(row=>remapReportCells(row,shown)),last<filteredRows.length?spacer((filteredRows.length-last)*viewport.rowHeight,"virtual-bottom"):null]);
  if(section.type==="tfoot")return cloneElement(section,{},tableElements(section.props.children).map(row=>remapReportCells(row,shown)));
  return section;
 });
 return <><table {...props} className={["accounting-report-table",props.className].filter(Boolean).join(" ")} ref={root} style={{...style,...(ready?{width:shown.reduce((sum,i)=>sum+width(i),0),minWidth:shown.reduce((sum,i)=>sum+width(i),0)}:{}),tableLayout:"fixed"}}>
 {ready?<colgroup>{shown.map(i=><col key={i} style={{width:width(i)}}/>)}</colgroup>:<colgroup>{shown.map(i=>{const col=tableElements(sections.find(s=>s.type==="colgroup")?.props.children)[i];return col?cloneElement(col,{key:String(i)}):<col key={i}/>;})}</colgroup>}
 {rendered}</table>
 {unhide&&createPortal(<div style={{position:"fixed",inset:0,zIndex:10000,display:"grid",placeItems:"center",background:"rgba(0,0,0,.3)"}} onMouseDown={e=>{if(e.target===e.currentTarget)setUnhide(false);}}>
 <section role="dialog" aria-modal="true" aria-label="Unhide Columns" onKeyDown={e=>{if(e.key==="Escape")setUnhide(false);}} style={{width:480,maxWidth:"90vw",background:"#eee",border:"1px solid #888",padding:12}}>
 <h2 style={{margin:"0 0 10px",font:"bold 16px Arial"}}>Unhide Columns</h2><div style={{maxHeight:330,overflow:"auto",background:"white",padding:6,border:"1px solid #aaa"}}>
 {layout.order.filter(i=>i!==pinned).map(i=><label key={i} style={{display:"flex",gap:6,padding:"3px 0",font:"13px Arial"}}><input type="checkbox" checked={!layout.hidden.includes(i)} disabled={shown.filter(x=>x!==pinned).length===1&&!layout.hidden.includes(i)} onChange={e=>setLayout(old=>({...old,hidden:e.target.checked?old.hidden.filter(x=>x!==i):[...old.hidden,i]}))}/>{labels[i]}</label>)}</div>
 <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><button onClick={()=>setLayout({widths:{},hidden:defaultHidden,order:initialOrder})}>Reset Columns</button><button autoFocus onClick={()=>setUnhide(false)}>Close</button></div></section></div>,document.body)}</>;
}
