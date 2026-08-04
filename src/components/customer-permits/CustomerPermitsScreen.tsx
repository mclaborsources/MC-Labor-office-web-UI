"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Copy } from "lucide-react";
import { AccessButton } from "@/components/access/AccessButton";
import { EmployeeSearchColumnHeader } from "@/components/employees/EmployeeSearchColumnHeader";
import { Icon } from "@/components/ui/Icon";

const ALL_COLUMNS = [
  ["customer", "Customer", 155], ["customerCity", "Customer City", 86], ["customerState", "Customer State", 72],
  ["customerType", "Customer Type", 130], ["permitStreet", "Permit Street", 165],
  ["permitCity", "Permit City", 90], ["permitState", "Permit", 55], ["permitDate", "Permit Date", 82],
  ["permitFee", "Permit Fee", 78], ["permitValue", "Permit Value", 82], ["siteVisit", "Site Visit", 78],
  ["siteVisitUser", "Site Visit User", 92], ["siteVisitDate", "Site Visit Updated", 105],
  ["futureVisit", "Future Visit", 88], ["futureVisitUser", "Future Visit User", 98], ["futureVisitDate", "Future Visit Updated", 110],
  ["jobStatus", "Job Status", 108], ["statusUser", "Status User", 82], ["statusDate", "Status Updated", 100], ["history", "History", 72],
  ["link", "Link", 48], ["contactLast", "Contact Last", 92], ["contactFirst", "Contact", 92],
  ["contactCell", "Contact Cell", 112], ["contactTitle", "Contact Title", 108], ["contactEmail", "Contact Email", 165],
] as const;

type PermitKey = (typeof ALL_COLUMNS)[number][0];
type PermitRow = Record<PermitKey, string>;
type ViewName = "01" | "02" | "03" | "04" | "05";

const VIEW_COLUMNS: Record<ViewName, readonly PermitKey[]> = {
  "01": ["customer", "customerCity", "customerState", "customerType", "permitStreet", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "siteVisit", "futureVisit", "jobStatus", "history", "link", "contactFirst", "contactLast", "contactCell", "contactTitle", "contactEmail"],
  "02": ["customer", "permitStreet", "permitCity", "permitState", "siteVisit", "siteVisitUser", "siteVisitDate", "futureVisit", "futureVisitUser", "futureVisitDate", "jobStatus", "statusUser", "statusDate", "history", "link"],
  "03": ["customer", "customerCity", "customerState", "customerType", "permitStreet", "permitCity", "permitState", "permitDate", "permitFee", "permitValue", "jobStatus", "link"],
  "04": ["customer", "permitStreet", "permitCity", "permitState", "contactFirst", "contactLast", "contactCell", "contactTitle", "contactEmail", "history", "link"],
  "05": ALL_COLUMNS.map(([key]) => key),
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
  contactTitle: "Manpower", contactEmail: "david03@gmail.com",
}));

export function CustomerPermitsScreen() {
  const [search, setSearch] = useState("");
  const [viewName, setViewName] = useState<ViewName>("01");
  const columns = useMemo(() => {
    const visible = new Set(VIEW_COLUMNS[viewName]);
    return ALL_COLUMNS.filter(([key]) => visible.has(key));
  }, [viewName]);
  const rows = useMemo(() => ROWS.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(search.toLowerCase()))), [search]);
  const fillerRows = Array.from({ length: Math.max(0, 42 - rows.length) });
  return (
    <section className="ac-permits-page">
      <header className="ac-permits-titlebar">
        <h1>Customer Permits Search</h1>
        <div className="ac-permits-view-controls">
          <label htmlFor="permit-view">View:</label><select id="permit-view" className="ac-select" value={viewName} onChange={(event) => setViewName(event.target.value as ViewName)}>{(Object.keys(VIEW_LABELS) as ViewName[]).map((key) => <option key={key} value={key}>{VIEW_LABELS[key]}</option>)}</select>
          <AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><AccessButton>Refresh</AccessButton><AccessButton>Zero</AccessButton><AccessButton>Export View</AccessButton>
        </div>
        <AccessButton className="ac-permits-cancel">Cancel</AccessButton>
        <button type="button" className="ac-permits-help" aria-label="Help"><Icon icon={HelpCircle} size="sm" /></button>
      </header>

      <div className="ac-permits-tools">
        <div className="ac-permits-search-panel">
          <strong>SEARCH</strong>
          <label>Customer:</label><input className="ac-input" value={search} onChange={(event) => setSearch(event.target.value)} />
          <AccessButton>Search</AccessButton>
          <fieldset><legend>Use<br />Button</legend><label><input type="radio" name="permit-use" defaultChecked /> Yes</label><label><input type="radio" name="permit-use" /> No</label></fieldset>
          <span>Select:</span><AccessButton>Clear</AccessButton><AccessButton>All</AccessButton>
        </div>
        <div className="ac-permits-main-tools">
          <div className="ac-permits-view-buttons">{(["Default", "Site Visit Info", "View 03", "View 04", "View 05"] as const).map((label, index) => { const key = `0${index + 1}` as ViewName; return <AccessButton key={key} onClick={() => setViewName(key)} aria-pressed={viewName === key}>{label}</AccessButton>; })}</div>
          <div className="ac-permits-actions"><input readOnly className="ac-input" /><AccessButton icon={Copy}>Copy Street</AccessButton><AccessButton className="ac-permits-delete">Delete Permits</AccessButton><AccessButton>Clear Filters</AccessButton></div>
        </div>
      </div>

      <div className="ac-permits-grid ac-grid">
        <table><colgroup><col className="ac-permits-selector-col" /><col className="ac-permits-action-col" />{columns.map(([key,,width]) => <col key={key} style={{ width }} />)}</colgroup>
          <thead><tr><th className="ac-permits-selector" /><th className="ac-permits-action"><EmployeeSearchColumnHeader label="" values={[]} /></th>{columns.map(([key,label]) => <th key={key}><EmployeeSearchColumnHeader label={label} values={rows.map((row) => row[key])} /></th>)}</tr></thead>
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
      <footer className="ac-permits-recordbar"><span>Record:</span><button>◀</button><span>1 of 33474</span><button>▶</button><span>Unfiltered</span><span>Search</span><span className="ml-auto">Max 300 per page</span></footer>
    </section>
  );
}
