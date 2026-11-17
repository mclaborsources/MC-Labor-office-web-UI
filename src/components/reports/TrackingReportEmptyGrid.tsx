"use client";
import {AccountingReportTable} from "@/components/tables/AccountingReportTable";
import { useState } from "react";
import { CustomerNameColumnHeader } from "@/components/customers/CustomerNameColumnHeader";

const defaultColumns: [string, number, number][] = [
  ["Week Ending",0,72],["Customer Trade",1,76],["Customer",2,159],["Job",3,184],
  ["Job City",4,96],["WCC",5,49],["First",6,92],["Last",7,62],["Cell #",8,96],
  ["Grade Code",9,69],["WCC",10,86],["%",11,73],["RH",12,66],["OT",13,60],["Pay Rate",14,60],
  ["Bill Rate",15,79],["Assignment User",16,80],["Assignment Timestamp",17,153],
  ["Assignment Date",18,134],["Assignment Time",19,136],
  ["Total Referral Cost Paid To Agent",20,220],["Total Payroll Wcc Tracking",21,214],
  ["Calc Profit Margin",22,96],["Total Labor Billed",23,135],["Snapshot",24,85],
  ["Weeks Away",25,103],["PH Job Is Filled",26,94],
];
// The Access P & L preset shows the compact weekly labor and billing fields.
const profitAndLossColumns: [string, number, number][] = [
  ["Week Ending",0,94],["Customer",2,148],["Site State",27,54],
  ["First",6,62],["Last",7,76],["Grade",9,48],["OH",28,48],
  ["Wcc Code",29,72],["RH",12,54],["OT",13,54],["Pay Rate",14,68],
  ["Bill Rate",15,68],["PH Job Is Fill",26,94],
];

const placeholderColumns: [string,number,number][] = [
 ["Week Ending",0,90],["Salesman",30,50],["Customer Type",1,108],["Customer",2,174],
 ["Job",3,158],["Job City",4,122],["Site State",27,50],["First",6,50],["Grade",9,42],
 ["WCC",10,58],["%",11,42],["Pay Rate",14,70],["Bill Rate",15,66],
 ["Assignment User",16,44],["Assignment Date",18,90],["Assignment Time",19,90],
 ["PH History",31,58],["PH",32,42],["PH Last Action",33,226],["PH",34,42],["PH Date",35,80],["PH Job Is Fill",26,94],
];
const detailedColumns: [string,number,number][] = [...profitAndLossColumns.slice(0,1),...profitAndLossColumns.slice(2,12),["Sick Time",36,140],["Health In",37,140],["Co Exp Holidays Per Hr",38,140],["Vac/Hr",39,140],["Parking",40,140],["Schooling",41,140],["Tools Per Hr",42,140],["Travel/Hr",43,140],["Total Travel",44,140],["Per Diem Per Hr",45,140],["Spare 2 Per Hr",46,140],["Referrer Employee",47,140],["Em Referral/Hr",48,140],["Total To Referrer Em",49,140],["Bonus Exp Start Date",50,140],["Bonus Exp to Employee",51,140],["Bonus Exp Rate",52,140],["Referral Agency",53,140],["Agency Referral Rate Per Hr",54,140],["Total Per Diem Billed",55,140],["Total Labor Billed",23,135],["Grand Total Billed",56,140],["Total Ben Per Hr",57,140],["Total Ben And Referral Per Hr",58,140],["Total Ben Costs Per Week",59,140],["Total Referral And Ben Cost Per Week",60,140],["Gross Payroll",61,140],["Total Payroll Wcc Code",62,140],["Wcc Tracking Profit",63,140],["Wcc Code Profit",64,140],["Per Diem",65,140],["Commission",66,140],["Mileage",67,140],["Wcc Code/Wcc Tracking",68,140],["Calc Profit Margin",22,140],["Snapshot",24,85],["Weeks Away",25,100],["PH User",34,76],["PH Date",35,80],["PH Job Is Fill",26,94]];
const agencyColumns: [string,number,number][] = [
 ["Week Ending",0,96],["Salesman",30,50],["Customer",2,188],["Job",3,188],["Job City",4,124],
 ["Site State",27,50],["First",6,92],["Last",7,80],["Grade",9,44],["Referral Agency",53,280],
 ["Bill Rate",15,80],["Agency Referral Rate Per Hr",54,84],["Assignment User",16,44],
 ["Assignment Date",18,90],["Assignment Time",19,100],["Snapshot",69,85],
];
const assignmentColumns: [string,number,number][] = [
 ["Week Ending",0,90],["Salesman",30,44],["Customer",2,154],["Job",3,170],["Job City",4,106],
 ["Site State",27,50],["First",6,92],["Last",7,80],["Grade",9,54],["%",11,42],
 ["Assignment User",16,44],["Assignment Date",18,90],["Assignment Time",19,90],
 ["Snapshot",69,66],["Weeks Away",25,90],["Prev User Av Man P",70,150],
 ["Prev Date Av Man P",71,150],["Prev Time Av Man P",72,150],["History Av Man P",73,130],
 ["Prev Customer",74,144],["Prev Customer ID",75,44],["Prev Job",76,84],
 ["Prev Site State",77,66],["Prev Project ID",78,42],["Prev Assignment Date",79,114],
 ["Prev Assignment Time",80,90],["PH Job Is Fill",26,96],
];
const view07Columns: [string,number,number][] = [
 ["Week Ending",0,96],["Assign",81,62],["Customer",2,144],["Payroll Co",82,32],
 ["First",6,62],["",83,22],["Last",7,62],["Grade",9,30],["Em State",84,82],["%",11,44],
 ["Pay Rate",14,68],["OT Pay Rate",85,102],["",86,10],["Bill Rate",15,78],["",88,10],
 ["Bill Rate OT",87,100],["",89,10],["Assignment User",16,32],["Assignment Timestamp",17,154],
 ["TH",90,60],["RH",12,66],["OT",13,60],["Wcc Code Profit",64,120],["Gross Payroll",61,96],
 ["Total Labor Billed",23,135],["Customer Type",1,104],["Contract Sales",91,100],["Salesman (Active)",30,100],
 ["Snapshot",69,85],["Weeks Away",25,104],["Prev Customer",74,144],["Prev Site State",77,66],
 ["Prev Customer ID",75,42],["Prev Assignment Date",79,114],["Prev Assignment Time",80,90],
 ["PH User",34,76],["PH Date",35,80],["Prev Job",76,84],["Prev Project ID",78,42],["PH Job Is Fill",26,96],
];
const view08Columns: [string,number,number][] = [
 ["Week Ending",0,96],["Assign",81,62],["Customer",2,144],["Payroll Co",82,32],
 ["First",6,50],["Last",7,62],["",83,10],["Assignment User",16,32],
 ["Assignment Timestamp",17,154],["Snapshot",69,85],["Weeks Away",25,102],
 ["Prev Customer",74,144],["Prev Job",76,84],["Prev Customer ID",75,42],
 ["Prev Assignment Date",79,112],["Prev Assignment Time",80,90],
 ["PH User",34,76],["PH Date",35,80],["PH Job Is Filled",26,120],
 ["Prev Site State",77,66],["Prev Project ID",78,42],
];
const view09Columns: [string,number,number][] = [
 ["Week Ending",0,96],["Assign",81,62],["Customer",2,144],["Payroll Co",82,32],
 ["First",6,50],["Last",7,62],["",83,10],["Assignment User",16,32],
 ["Assignment Timestamp",17,154],["Snapshot",69,85],["Weeks Away",25,102],
 ["Prev Customer",74,144],["Prev Customer ID",75,42],
 ["Prev Assignment Date",79,112],["Prev Assignment Time",80,90],
 ["PH User",34,76],["PH Date",35,80],["PH Job Is Filled",26,120],
 ["Prev Project ID",78,42],["Prev Site State",77,66],["Prev Job",76,84],
];
const view10Columns: [string,number,number][] = [
 ["Week Ending",0,96],["Customer",2,256],["Customer Type",1,186],["Salesman (Admin)",30,142],
 ["First",6,134],["Last",7,62],["Grade",9,66],["Em State",84,82],["Site State",27,66],
 ["",83,10],["",86,10],["Sat",92,44],["Sun",93,34],["Mon",94,34],["Tue",95,34],
 ["Wed",96,34],["Thu",97,34],["Fri",98,34],["",89,10],["Pay Rate",14,60],
 ["Assignment User",16,32],["Assignment Timestamp",17,186],["Snapshot",69,85],["Weeks Away",25,102],
 ["Prev Customer",74,144],["Prev Site State",77,66],["Prev Customer ID",75,42],
 ["Prev Assignment Date",79,112],["Prev Assignment Time",80,90],
 ["PH User",34,76],["PH Date",35,80],["Prev Job",76,84],["Prev Project ID",78,42],
 ["",87,22],["PH Job Is Filled",26,120],
];
const emailColumns: [string,number,number][] = [
 ["Week Ending",0,96],["Salesman",30,42],["",83,10],["Referral Agency",53,254],
 ["Customer",2,178],["",86,10],["Job",3,178],["",89,10],
 ["Job City",4,122],["",88,10],["First",6,116],["Last",7,124],
];
const avHistoryColumns: [string,number,number][] = [
 ["Week Ending",0,78],["Salesman",30,42],["",83,10],["Customer",2,94],["",86,10],
 ["Job",3,98],["",89,10],["Job City",4,96],["",88,10],["Site State",27,50],
 ["First",6,92],["Last",7,80],["Grade",9,54],["%",11,42],["Assignment User",16,44],
 ["Assignment Date",18,90],["Assignment Time",19,90],["Snapshot",69,32],["Weeks Away",25,44],
 ["Prev User Av Man P",70,42],["Prev Date Av Man P",71,90],["Prev Time Av Man P",72,90],
 ["Prev Customer",74,144],["Prev Customer ID",75,42],["Prev Job",76,84],
 ["Prev Site State",77,38],["Prev Project ID",78,42],["Prev Assignment Date",79,90],
 ["Prev Assignment Time",80,90],["History Av Man P",73,48],
];
export function TrackingReportEmptyGrid({rows=[],view="default"}:{rows?:import("@/lib/trackingReport").TrackingReportRow[];view?:"default"|"pnl"|"placeholder"|"detailed"|"agency"|"assignments"|"view07"|"view08"|"view09"|"view10"|"email"|"avHistory"}) {
  const [selectedRow,setSelectedRow]=useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<{key:string;direction:"asc"|"desc"}|null>(null);
  const [spacers,setSpacers]=useState(false);
  const columns = view === "avHistory" ? avHistoryColumns : view === "email" ? emailColumns : view === "view10" ? view10Columns : view === "view09" ? view09Columns : view === "view08" ? view08Columns : view === "view07" ? view07Columns : view === "assignments" ? assignmentColumns : view === "agency" ? agencyColumns : view === "detailed" ? detailedColumns : view === "placeholder" ? placeholderColumns : view === "pnl" ? profitAndLossColumns : defaultColumns;
  const visible=rows.filter(r=>(view!=="agency"||Boolean(String(r.values[53]??"").trim()))&&(view!=="placeholder"||r.values[24]==="Yes")&&Object.entries(filters).every(([i,v])=>v.includes(String(r.values[Number(i)]??"")))).sort((a,b)=>{if(!sort)return 0;const x=a.values[Number(sort.key)],y=b.values[Number(sort.key)];const c=typeof x==="number"&&typeof y==="number"?x-y:String(x??"").localeCompare(String(y??""));return sort.direction==="asc"?c:-c;});
  const width = 20 + columns.reduce((sum, [, , size]) => sum + size, 0);
  return <><div hidden={view!=="placeholder"} style={{display:view==="placeholder"?"flex":"none",gap:12,alignItems:"center",padding:"3px 10px"}}><button onClick={()=>setSpacers(true)}>Add Spacers</button><button onClick={()=>setSpacers(false)}>Clear Spacers</button><span>Customers: {new Set(visible.map(r=>r.values[2])).size}</span><span>Jobs: {new Set(visible.map(r=>`${r.values[2]}|${r.values[3]}`)).size}</span><span>Placeholders: {visible.length}</span></div><div className="prs-grid-wrap tprs-reference-grid tracking-access-grid" style={{flex:1,minHeight:0,overflow:"auto",background:"#fff",border:"1px solid #aaa",marginLeft:10}}>
    <AccountingReportTable columnLayoutKey={view === "avHistory" ? "tracking-report-av-history-v1" : view === "email" ? "tracking-report-email-v1" : view === "view10" ? "tracking-report-view10-v1" : view === "view09" ? "tracking-report-view09-v1" : view === "view08" ? "tracking-report-view08-v1" : view === "view07" ? "tracking-report-view07-v1" : view === "assignments" ? "tracking-report-assignments-v1" : view === "agency" ? "tracking-report-agency-v1" : view === "detailed" ? "tracking-report-detailed-v1" : view === "placeholder" ? "tracking-report-placeholder-v1" : view === "pnl" ? "tracking-report-pnl-v1" : "tracking-report-access-v2"} style={{width,minWidth:width,tableLayout:"fixed",borderCollapse:"collapse"}}>
      <colgroup><col style={{width:20}}/>{columns.map(([label,index,size])=><col key={`${label}-${index}`} style={{width:size}}/>)}</colgroup>
      <thead><tr><th style={{background:"#e3e6e9",border:"1px solid #aab3bd"}}/>{columns.map(([label,index])=><th key={`${label}-${index}`} style={{height:20,padding:"0 3px",background:"#e3e8ee",border:"1px solid #aab3bd",fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",position:"sticky",top:0}}><CustomerNameColumnHeader label={label} columnKey={`report-${index}`} kind={label.includes("Date")||label==="Week Ending"?"date":[11,12,13,14,15,20,21,22,23,25].includes(index)?"number":"text"} getValues={()=>rows.map(r=>String(r.values[index]??""))} selected={filters[String(index)]} sort={sort?.key===String(index)?sort.direction:undefined} onSort={direction=>setSort({key:String(index),direction})} onFilter={values=>{setFilters(current=>{const next={...current};if(values===undefined)delete next[String(index)];else next[String(index)]=values;return next;});if(values===undefined&&sort?.key===String(index))setSort(null);}}/></th>)}</tr></thead>
      <tbody>{visible.map((r,rowIndex)=><tr key={r.id} className={selectedRow===r.id||(!selectedRow&&rowIndex===0)?"tracking-selected-row":""} onClick={()=>setSelectedRow(r.id)}><td className="tracking-row-selector"/>{columns.map(([label,index],columnIndex)=>{const v=r.values[index];return <td key={`${index}-${columnIndex}`} data-tracking-column={index} style={view==="detailed"?{background:({36:"#fac090",37:"#ffff00",39:"#99e6f4",43:"#a6d94e",52:"#bfb1d0",66:"#bfbfbf",67:"#bfbfbf"} as Record<number,string>)[index]}:undefined} className={index===26||(index>=31&&index<=35)?"tracking-job-filled":""}>{typeof v==="number"?[14,15,20,21,23,54,61,64,85,87].includes(index)?v.toLocaleString("en-US",{style:"currency",currency:"USD"}):[11,28,29].includes(index)?v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):v.toLocaleString("en-US",{maximumFractionDigits:2}):v}</td>})}</tr>)}{spacers&&view==="placeholder"&&visible.length>0&&<tr style={{height:44}}><td colSpan={columns.length+1}/></tr>}{Array.from({length:Math.max(0,32-visible.length)},(_,row)=><tr key={row} className="prs-blank"><td style={{height:22,background:"#e3e6e9",border:"1px solid #b5bdc7"}}/>{columns.map(([label,index],columnIndex)=><td key={`${index}-${columnIndex}`} style={{height:22,padding:0,border:"1px solid #cbd5e9",background:index===26||(index>=31&&index<=35)?"#fff500":"#fff"}}/>)}</tr>)}<tr className="tracking-totals-row"><td/>{columns.map(([label,index],columnIndex)=><td key={`${index}-${columnIndex}`}>{index===0?"Total":[12,13,20,21,23].includes(index)?visible.reduce((sum,r)=>sum+Number(r.values[index]||0),0).toLocaleString("en-US",{maximumFractionDigits:2}):""}</td>)}</tr></tbody>
    </AccountingReportTable>
  </div></>;
}
