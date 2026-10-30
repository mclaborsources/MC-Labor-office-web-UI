"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, Copy } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { CustomerNameColumnHeader } from "@/components/customers/CustomerNameColumnHeader";
import { EmployeeSearchColumnHeader } from "@/components/employees/EmployeeSearchColumnHeader";
import { Icon } from "@/components/ui/Icon";

const ALL_COLUMNS = [
  ["customer", "Customer", 155], ["customerCity", "Customer City", 86], ["customerState", "Customer State", 72],
  ["customerType", "Customer Type", 130], ["permitStreet", "Permit Street", 165],
  ["permitCity", "Permit City", 90], ["permitState", "Permit State", 55], ["permitDate", "Permit Date", 82],
  ["permitFee", "Permit Fee", 78], ["permitValue", "Permit Value", 82], ["siteVisit", "Site Visit", 78],
  ["siteVisitUser", "Site Visit User", 92], ["siteVisitDate", "Site Visit Updated", 105],
  ["futureVisit", "Future Visit", 88], ["futureVisitUser", "Future Visit User", 98], ["futureVisitDate", "Future Visit Updated", 110],
  ["jobStatus", "Job Status", 108], ["statusUser", "Status User", 82], ["statusDate", "Status Updated", 100], ["history", "History", 72],
  ["link", "Link", 48], ["contactLast", "Contact Last", 92], ["contactFirst", "Contact First", 92],
  ["contactCell", "Contact Cell", 112], ["contactTitle", "Contact Title", 108], ["contactEmail", "Contact Email", 165],
  ["permitSearchLink", "Permit Search Link", 142], ["entryDate", "Entry Date", 90], ["profileType", "Profile Type", 100],
] as const;

type PermitKey = (typeof ALL_COLUMNS)[number][0];
type PermitRow = Record<PermitKey, string>;
type ViewName = "01" | "02" | "03" | "04" | "05";

const VIEW_COLUMNS: Record<ViewName, readonly PermitKey[]> = {
  "01": ["customer", "customerCity", "customerState", "customerType", "permitStreet", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "siteVisit", "futureVisit", "jobStatus", "history", "link", "contactFirst", "contactLast", "contactCell", "contactTitle", "contactEmail", "entryDate", "profileType"],
  "02": ["customerCity", "customerState", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "siteVisit", "siteVisitUser", "siteVisitDate", "futureVisit", "futureVisitUser", "futureVisitDate", "jobStatus", "statusUser", "statusDate", "history", "permitSearchLink", "link", "customer"],
  "03": ["customerCity", "customerState", "customerType", "permitStreet", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "siteVisit", "siteVisitUser", "siteVisitDate", "futureVisit", "futureVisitUser", "futureVisitDate", "jobStatus", "statusUser", "statusDate", "history", "permitSearchLink", "link", "contactFirst", "contactLast", "contactTitle", "contactEmail", "contactCell", "customer"],
  "04": ["customerCity", "customerState", "customerType", "permitStreet", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "siteVisit", "siteVisitUser", "siteVisitDate", "futureVisit", "futureVisitUser", "futureVisitDate", "jobStatus", "statusUser", "statusDate", "history", "permitSearchLink", "link", "contactFirst", "contactLast", "contactTitle", "contactEmail", "contactCell", "customer"],
  "05": ["customerCity", "customerState", "customerType", "permitStreet", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "siteVisit", "siteVisitUser", "siteVisitDate", "futureVisit", "futureVisitUser", "futureVisitDate", "jobStatus", "statusUser", "statusDate", "history", "permitSearchLink", "link", "contactFirst", "contactLast", "contactTitle", "contactEmail", "contactCell", "customer"],
};

const SITE_VISIT_WIDTHS: Partial<Record<PermitKey,number>> = {
  customerCity:115, customerState:54, permitCity:108, permitState:105,
  permitDate:103, permitFee:96, permitValue:109,
  siteVisit:37, siteVisitUser:79, siteVisitDate:92,
  futureVisit:37, futureVisitUser:79, futureVisitDate:93,
  jobStatus:37, statusUser:79, statusDate:110,
  history:72, permitSearchLink:142, link:53, customer:206,
};
const VIEW_LABELS: Record<ViewName, string> = { "01": "View 01", "02": "View 02", "03": "View 03", "04": "View 04", "05": "View 05" };

const STREETS = [
  ["1 ARBUTUS AV", "", ""], ["664 MAIN STREET", "", ""], ["78 GREY NECK RD", "", ""],
  ["240 NEWBURY ST", "DANVERS", "MA"], ["85 OXFORD AVE", "DUDLEY", "MA"],
  ["114 SEAGATE LANE", "Hyannis", "MA"], ["97 BASSETT LANE", "Hyannis", "MA"],
  ["42 LOCUST ST", "Marblehead", "MA"], ["61 LEGGS HILL RD", "Marblehead", "MA"],
  ["397 WILLIAMS ST", "MARLBOROUGH", "MA"], ["24 MAPLE STREET", "MENDON", "MA"],
  ["80 MILLVILLE STREET", "MENDON", "MA"], ["34 EAST HILL RD", "MONSON", "MA"],
  ["0 Turnpike Street", "North Andover", "MA"], ["99 SUTTON AVE", "OXFORD", "MA"],
  ["19 TOWN SQ", "Plymouth", "MA"], ["42 SAVARY AVE", "", ""], ["471 MAIN ST", "Amesbury", "MA"],
] as const;

const VALUES = ["", "", "", "", "", "$10,000.00", "", "$16,500.00", "$350.00", "", "", "$5,000.00", "$47,392.00", "", "", "", "$1,700.00", ""];

const ROWS: PermitRow[] = STREETS.map(([street, city, state], index) => ({
  customer: index === 0 ? "" : "-", customerCity: city, customerState: state, customerType: "16 Construction",
  permitStreet: street, permitCity: city, permitState: state, permitDate: index < 16 ? "5/22/2026" : "5/21/2026",
  permitFee: "", permitValue: VALUES[index] ?? "", siteVisit: "", siteVisitUser: "", siteVisitDate: "",
  futureVisit: "", futureVisitUser: "", futureVisitDate: "", jobStatus: "", statusUser: "", statusDate: "",
  history: "History", link: "Open", contactLast: "-", contactFirst: "-", contactCell: "-",
  contactTitle: "Manpower", contactEmail: "david03@gmail.com", entryDate: "", profileType: "", permitSearchLink: "",
}));

export function CustomerPermitsScreen() {
  const [search, setSearch] = useState("");
  const [viewName, setViewName] = useState<ViewName>("01");
  const [viewColumns,setViewColumns]=useState<Partial<Record<ViewName,PermitKey[]>>>({});
  const columnsDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    try {
      const stored=JSON.parse(localStorage.getItem("customer-permits-views") ?? "{}");
      const valid:Partial<Record<ViewName,PermitKey[]>>={};
      for(const key of Object.keys(VIEW_LABELS) as ViewName[])if(Array.isArray(stored[key]))valid[key]=stored[key].filter((column:unknown)=>ALL_COLUMNS.some(([id])=>id===column));
      setViewColumns(valid);
    } catch { /* Open with the reference presets. */ }
  },[]);
  const visibleColumns=viewColumns[viewName] ?? VIEW_COLUMNS[viewName];
  const [viewNames,setViewNames]=useState<Partial<Record<ViewName,string>>>({});
  const [widths,setWidths]=useState<Partial<Record<PermitKey,number>>>({});
  const [selectVisibility,setSelectVisibility]=useState<Partial<Record<ViewName,boolean>>>({});
  const [filters,setFilters]=useState<Partial<Record<PermitKey,string[]>>>({});
  const [sort,setSort]=useState<{key:PermitKey;direction:"asc"|"desc"}|null>(null);
  const [viewMessage,setViewMessage]=useState("");
  const showSelect=selectVisibility[viewName] ?? (viewName === "01" || viewName === "02");
  useEffect(()=>{
    try {
      const stored=JSON.parse(localStorage.getItem("customer-permits-view-settings") ?? "{}");
      setViewNames(stored.names ?? {}); setSelectVisibility(stored.select ?? {});
      const savedWidths=stored.widths ?? {};
      setWidths(Object.fromEntries(Object.entries(savedWidths).filter(([key,value])=>ALL_COLUMNS.some(([id])=>id===key)&&typeof value==="number"&&value>=48&&value<=1600)));
    } catch { /* Open with defaults. */ }
  },[]);
  const persistSettings=(names=viewNames,selection=selectVisibility,nextWidths=widths)=>{
    localStorage.setItem("customer-permits-view-settings",JSON.stringify({names,select:selection,widths:nextWidths}));
  };
  const saveView=()=>{
    try {
      localStorage.setItem("customer-permits-views",JSON.stringify({...viewColumns,[viewName]:visibleColumns}));
      persistSettings(); setViewMessage(`${viewNames[viewName] ?? VIEW_LABELS[viewName]} saved.`);
    } catch {setViewMessage("Could not save view settings in this browser.");}
  };
  const renameView=()=>{
    const name=window.prompt("View button name:",viewNames[viewName] ?? (["Default","Site Visit Info","View 03","View 04","View 05"][Number(viewName)-1]));
    if(!name?.trim())return;
    const next={...viewNames,[viewName]:name.trim().slice(0,80)};
    try {persistSettings(next);setViewNames(next);setViewMessage("View renamed.");} catch {setViewMessage("Could not rename this view in browser storage.");}
  };
  const deleteView=()=>{
    if(!window.confirm(`Delete saved settings for ${viewNames[viewName] ?? VIEW_LABELS[viewName]} and restore its preset?`))return;
    const next={...viewColumns},names={...viewNames},selection={...selectVisibility};
    delete next[viewName]; delete names[viewName]; delete selection[viewName];
    try {
      localStorage.setItem("customer-permits-views",JSON.stringify(next));persistSettings(names,selection);
      setViewColumns(next);setViewNames(names);setSelectVisibility(selection);setViewMessage("Saved view deleted; preset restored.");
    } catch {setViewMessage("Could not delete this saved view in browser storage.");}
  };
  const columnWidth=(key:PermitKey,defaultWidth:number)=>widths[key] ?? (viewName==="02" ? SITE_VISIT_WIDTHS[key] ?? defaultWidth : defaultWidth);
  const resizeColumn=(key:PermitKey,width:number)=>{
    const next={...widths,[key]:Math.max(48,Math.min(1600,Math.round(width)))};setWidths(next);
    try {persistSettings(viewNames,selectVisibility,next);} catch { /* Session resizing remains available. */ }
  };  const columns = useMemo(() => {
    return visibleColumns.map(key => ALL_COLUMNS.find(column => column[0] === key)!);
  }, [visibleColumns]);
  const rows = useMemo(() => {
    const result=ROWS.filter(row=>Object.values(row).some(value=>value.toLowerCase().includes(search.toLowerCase())) && ALL_COLUMNS.every(([key])=>!filters[key] || filters[key]!.includes(row[key])));
    if(sort)result.sort((a,b)=>(sort.direction==="asc"?1:-1)*a[sort.key].localeCompare(b[sort.key],undefined,{numeric:true}));
    return result;
  },[search,filters,sort]);
  const fillerRows = Array.from({ length: Math.max(0, 42 - rows.length) });
  return (
    <section className="ac-permits-page" data-view={viewName} data-show-select={showSelect}>
      <header className="ac-permits-titlebar">
        <h1>Customer Permits Search</h1>
        <div className="ac-permits-view-controls">
          <label htmlFor="permit-view">View:</label><select id="permit-view" className="ac-select" value={viewName} onChange={(event) => setViewName(event.target.value as ViewName)}>{(Object.keys(VIEW_LABELS) as ViewName[]).map((key) => <option key={key} value={key}>{viewNames[key] ?? VIEW_LABELS[key]}</option>)}</select>
          <AccessButton data-action-status="complete" onClick={saveView}>Save View</AccessButton><AccessButton data-action-status="complete" onClick={renameView}>Rename View</AccessButton><AccessButton data-action-status="complete" onClick={deleteView}>Delete View</AccessButton><AccessButton data-action-status="missing">Refresh</AccessButton><AccessButton data-action-status="missing">Zero</AccessButton><AccessButton data-action-status="missing">Export View</AccessButton>
        </div>
        <AccessButton data-action-status="missing" className="ac-permits-cancel">Cancel</AccessButton>
        <button data-action-status="missing" type="button" className="ac-permits-help" aria-label="Help"><Icon icon={HelpCircle} size="sm" /></button>
      </header>

      <div className="ac-permits-tools">
        <div className="ac-permits-search-panel">
          <strong>SEARCH</strong>
          <label>Customer:</label><input className="ac-input" value={search} onChange={(event) => setSearch(event.target.value)} />
          <AccessButton data-action-status="missing">Search</AccessButton>
          <fieldset><legend>Use<br />Button</legend><label><input type="radio" name="permit-use" defaultChecked /> Yes</label><label><input type="radio" name="permit-use" /> No</label></fieldset>
          <span>Select:</span><AccessButton data-action-status="missing">Clear</AccessButton><AccessButton data-action-status="missing">All</AccessButton>
        </div>
        <div className="ac-permits-main-tools">
          <div className="ac-permits-view-buttons">{(["Default", "Site Visit Info", "View 03", "View 04", "View 05"] as const).map((label, index) => { const key = `0${index + 1}` as ViewName; return <AccessButton data-action-status="complete" key={key} onClick={() => setViewName(key)} aria-pressed={viewName === key}>{viewNames[key] ?? label}</AccessButton>; })}</div>
          <div className="ac-permits-actions"><input key="permit-customer-type-label" readOnly className="ac-input" defaultValue="Customer Type" aria-label="Customer type" /><AccessButton data-action-status="missing" icon={Copy}>Copy Street</AccessButton><AccessButton data-action-status="missing" className="ac-permits-delete">Delete Permits</AccessButton><AccessButton data-action-status="complete" onClick={()=>{setFilters({});setSort(null);setSearch("");}}>Clear Filters</AccessButton></div>
        </div>
      </div>

      <div className="ac-permits-grid ac-grid" onContextMenu={event => { event.preventDefault(); columnsDialog.current?.showModal(); }} title="Right-click to show or hide columns">
        <table style={{width:7+(showSelect?22:0)+columns.reduce((sum,[key,,width])=>sum+columnWidth(key,width),0),minWidth:0}}><colgroup><col className="ac-permits-selector-col" /><col className="ac-permits-action-col" />{columns.map(([key,,width]) => <col key={key} style={{ width: columnWidth(key,width) }} />)}</colgroup>
          <thead><tr><th className="ac-permits-selector" /><th className="ac-permits-action"><EmployeeSearchColumnHeader label="" values={[]} /></th>{columns.map(([key,label,width]) => <th key={key}><CustomerNameColumnHeader label={label} columnKey={key}
              getValues={()=>ROWS.map(row=>row[key])} selected={filters[key]} sort={sort?.key===key ? sort.direction : undefined}
              onFilter={values=>setFilters(current=>({...current,[key]:values}))} onSort={direction=>setSort({key,direction})}
              width={columnWidth(key,width)} onResize={value=>resizeColumn(key,value)}
              onResetWidth={()=>{const next={...widths};delete next[key];setWidths(next);try{persistSettings(viewNames,selectVisibility,next);}catch{/* Keep session state. */}}}
              onHide={()=>setViewColumns(current=>({...current,[viewName]:visibleColumns.filter(id=>id!==key)}))}
              onUnhideColumns={()=>columnsDialog.current?.showModal()} /></th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => <tr key={`${row.permitStreet}-${index}`}><td className="ac-permits-selector" /><td className="ac-permits-action">{index === 0 ? "▶" : ""}</td>{columns.map(([key]) => <td key={key} className={`ac-permits-${key}`}>{row[key]}</td>)}</tr>)}
            {fillerRows.map((_, rowIndex) => (
              <tr key={`blank-${rowIndex}`} className="ac-permits-blank-row" aria-hidden="true">
                <td className="ac-permits-selector" /><td className="ac-permits-action" />
                {columns.map(([key]) => <td key={key} className={`ac-permits-${key}`} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog ref={columnsDialog} className="ac-permits-columns-dialog">
        <header>Unhide Columns</header><label>Column:</label>
        <div className="ac-permits-columns-list">
          <label><input type="checkbox" checked={showSelect} onChange={event=>setSelectVisibility(current=>({...current,[viewName]:event.target.checked}))} />Select</label>
          {ALL_COLUMNS.map(([key,label])=><label key={key}><input type="checkbox" checked={visibleColumns.includes(key)} onChange={event=>{
            const checked=event.target.checked;
            setViewColumns(current=>({...current,[viewName]:checked ? ALL_COLUMNS.map(([id])=>id).filter(id=>id===key || visibleColumns.includes(id)) : visibleColumns.filter(id=>id!==key)}));
          }} />{label}</label>)}
        </div>
        <footer><button type="button" className="ac-btn" onClick={()=>columnsDialog.current?.close()}>Close</button></footer>
      </dialog>
      {viewMessage && <span role="status" className="ac-permits-view-message">{viewMessage}</span>}
      <footer className="ac-permits-recordbar"><span>Record:</span><button data-action-status="missing">◀</button><span>1 of 33474</span><button data-action-status="missing">▶</button><span>Unfiltered</span><span>Search</span><span className="ml-auto">Max 300 per page</span></footer>
    </section>
  );
}
