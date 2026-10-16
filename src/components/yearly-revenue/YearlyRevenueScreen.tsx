"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { YearlyRevenueReport } from "@/lib/yearlyRevenueReport";

const metadata = ["Customer", "Street", "City", "State", "Cu Since", "Cust Type", "S Admin", "Entry Date", "First Week E", "Last Week E"];
const viewNames = Array.from({length:6}, (_,index) => "View 0"+(index+1));
const storageKey = "mc-yearly-revenue-views";

export function YearlyRevenueScreen({ report, search: initialSearch, inactiveYears, sort, direction, error = "" }: {
  report: YearlyRevenueReport; search: string; inactiveYears: number; sort: string; direction: "asc" | "desc"; error?: string;
}) {
  const router = useRouter();
  const [search,setSearch] = useState(initialSearch);
  const [useButton,setUseButton] = useState(true);
  const [view,setView] = useState("View 01");
  const latestYear = report.years[report.years.length-1] ?? new Date().getFullYear();
  const [firstYear,setFirstYear] = useState(latestYear-15);
  const [goTo,setGoTo] = useState("");
  const [selectedId,setSelectedId] = useState("");
  const [message,setMessage] = useState("");
  const years = report.years.filter(year => year>=firstYear);
  const columns = [...metadata,...years.map(String)];

  function navigate(options: {search?: string; inactiveYears?: number; page?: number; sort?: string; direction?: "asc" | "desc"} = {}) {
    const params = new URLSearchParams({search:options.search ?? initialSearch,
      inactiveYears:String(options.inactiveYears ?? inactiveYears),page:String(options.page ?? 1),
      sort:options.sort ?? sort,direction:options.direction ?? direction});
    router.push("/yearly-revenue?"+params);
  }

  useEffect(() => {
    if (useButton || search === initialSearch) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({search,inactiveYears:String(inactiveYears),page:"1",sort,direction});
      router.push("/yearly-revenue?"+params);
    },300);
    return () => clearTimeout(timer);
  },[useButton,search,initialSearch,inactiveYears,sort,direction,router]);

  function reset() {
    setSearch("");setFirstYear(latestYear-15);setGoTo("");setSelectedId("");setMessage("");
    navigate({search:"",inactiveYears:0,sort:"Customer",direction:"asc"});
  }
  function saveView() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(storageKey,JSON.stringify({...saved,[view]:{search,inactiveYears,sort,direction,firstYear,useButton}}));
      setMessage(view+" saved.");
    } catch { setMessage("The view could not be saved."); }
  }
  function chooseView(name: string) {
    setView(name);setMessage("");
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}")[name];
      if (!saved) return;
      const query = typeof saved.search === "string" ? saved.search.slice(0,200) : "";
      const inactive = Number.isInteger(saved.inactiveYears) && saved.inactiveYears>=2 && saved.inactiveYears<=10 ? saved.inactiveYears : 0;
      const year = report.years.includes(saved.firstYear) ? saved.firstYear : latestYear-15;
      const column = [...metadata,...report.years.map(String)].includes(saved.sort) ? saved.sort : "Customer";
      setSearch(query);setFirstYear(year);setGoTo("");setUseButton(saved.useButton !== false);
      navigate({search:query,inactiveYears:inactive,sort:column,direction:saved.direction === "desc" ? "desc" : "asc"});
    } catch { setMessage("The saved view could not be loaded."); }
  }
  function deleteView() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      delete saved[view];localStorage.setItem(storageKey,JSON.stringify(saved));setMessage(view+" deleted.");
    } catch { setMessage("The saved view could not be deleted."); }
  }
  function exportView() {
    const quote = (value: unknown) => '"'+String(value ?? "").replaceAll('"','""')+'"';
    const csv = [columns.map(column => quote(column === "Customer" ? "CustBusName" : column)).join(","),
      ...report.rows.map(row => columns.map(column => quote(row[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");link.href=url;link.download="yearly-revenue-page-"+report.page+".csv";link.click();URL.revokeObjectURL(url);
    setMessage("Exported "+report.rows.length+" displayed records.");
  }
  function display(value: unknown, column: string) {
    if (value == null || value === "") return "";
    if (/^\d{4}$/.test(column)) return Number(value).toLocaleString("en-US",{style:"currency",currency:"USD"});
    return String(value);
  }

  return <section className="ac-yearly ac-yearly-access">
    <header className="yearly-header"><h1>Yearly Revenue</h1>
      <div className="yearly-toolbar"><label>View: <select aria-label="Revenue view" value={view} onChange={event=>chooseView(event.target.value)}>{viewNames.map(name=><option key={name}>{name}</option>)}</select></label>
        <AccessButton onClick={saveView}>Save View</AccessButton><AccessButton onClick={deleteView}>Delete View</AccessButton>
        <label>Go To: <select aria-label="Go to revenue year" value={goTo} onChange={event=>{setGoTo(event.target.value);setFirstYear(event.target.value?Number(event.target.value):latestYear-15)}}><option value=""/>{report.years.map(year=><option key={year}>{year}</option>)}</select></label>
        <AccessButton onClick={()=>router.refresh()}>Refresh</AccessButton><AccessButton onClick={reset}>Zero</AccessButton><AccessButton onClick={exportView}>Export View</AccessButton>
      </div><aside><AccessButton onClick={()=>router.push("/tracking")}>Cancel</AccessButton><button type="button" className="yearly-help" aria-label="Help" onClick={()=>setMessage("Search by customer name. Years of No Business includes customers with no invoices or whose last recorded week is older than the selected number of years. Go To selects the first year column shown.")}>?</button></aside>
    </header>
    <div className="yearly-tools">
      <form className="yearly-search" onSubmit={event=>{event.preventDefault();navigate({search})}}>
        <div className="search"><strong>SEARCH</strong><label>Name:<input aria-label="Customer name" value={search} onChange={event=>setSearch(event.target.value)}/></label></div>
        <AccessButton type="submit">Search</AccessButton>
        <fieldset className="yearly-use"><legend>Use<br/>Button</legend><label><input type="radio" name="yearly-use" checked={useButton} onChange={()=>setUseButton(true)}/>Yes</label><label><input type="radio" name="yearly-use" checked={!useButton} onChange={()=>setUseButton(false)}/>No</label></fieldset>
      </form>
      <div className="presets"><div className="yearly-view-buttons">{viewNames.map((name,index)=><AccessButton key={name} onClick={()=>{if(index===0){setView("View 01");reset()}else chooseView(name)}}>{index===0?"Default":name}</AccessButton>)}</div>
        <fieldset className="yearly-inactive"><legend>Years of No Business:</legend><label><input type="radio" name="yearly-inactive" checked={inactiveYears===0} onChange={()=>navigate({inactiveYears:0})}/>No Filter</label>{Array.from({length:9},(_,i)=>i+2).map(value=><label key={value}><input type="radio" name="yearly-inactive" checked={inactiveYears===value} onChange={()=>navigate({inactiveYears:value})}/>{value}</label>)}</fieldset>
      </div>
      <AccessButton className="clear" onClick={reset}>Clear Filters</AccessButton>
    </div>
    {error && <p role="alert" className="report-data-error">{error}</p>}{message && <p role="status" className="yearly-message">{message}</p>}
    <div className="yearly-grid-wrap"><table className="legacy-report-grid yearly-grid" style={{width:1411+years.length*111}}>
      <colgroup><col style={{width:20}}/>{[350,203,101,60,95,198,96,96,96,96].map((width,index)=><col key={index} style={{width}}/>)}{years.map(year=><col key={year} style={{width:111}}/>)}</colgroup>
      <thead><tr><th aria-label="Record selector"/>{columns.map(column=><th key={column} aria-sort={sort===column?(direction==="asc"?"ascending":"descending"):"none"}><button onClick={()=>navigate({sort:column,direction:sort===column&&direction==="asc"?"desc":"asc"})}>{column==="Customer"?"CustBusName":column}<span aria-hidden="true">{sort===column?(direction==="asc"?"▴":"▾"):"▾"}</span></button></th>)}</tr></thead>
      <tbody>{report.rows.map((row,index)=><tr key={String(row.id)} className={(selectedId?selectedId===String(row.id):index===0)?"is-current":undefined} onClick={()=>setSelectedId(String(row.id))}><td className="yearly-row-selector"/>{columns.map(column=><td key={column} className={/^\d{4}$/.test(column)?"yearly-revenue-value":undefined} title={display(row[column],column)}>{display(row[column],column)}</td>)}</tr>)}
        {!report.rows.length && <tr><td colSpan={columns.length+1}>{error?"Revenue data is unavailable.":"No customers match these filters."}</td></tr>}
      </tbody></table></div>
    <footer className="yearly-record"><AccessButton disabled={report.page<=1} onClick={()=>navigate({page:report.page-1})}>Previous</AccessButton><span>Page {report.page} · {report.rows.length} of {report.total.toLocaleString("en-US")} customers</span><AccessButton disabled={report.page*200>=report.total} onClick={()=>navigate({page:report.page+1})}>Next</AccessButton></footer>
  </section>;
}
