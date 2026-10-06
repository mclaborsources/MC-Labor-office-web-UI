"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { AccessButton } from "@/components/access/AccessButton";

const FIELDS = [
  ["customerName", "Customer Name"], ["mailStreet", "M (Mailing Address) Street"], ["mailCity", "M City (Import)"],
  ["mailState", "M State (Import)"], ["mailZip", "M Zip"], ["contactEmail1", "Contact Email 1"],
  ["contactLastName1", "Contact Last Name 1"], ["contactFirstName1", "Contact First Name 1"], ["contactTitle1", "Contact Title 1"],
  ["contactCell1", "Contact Cell 1"], ["contactLastName2", "Contact Last Name 2"], ["contactFirstName2", "Contact First Name 2"],
  ["contactTitle2", "Contact Title 2"], ["contactEmail2", "Contact Email 2"], ["contactCell2", "Contact Cell 2"],
  ["contactLastName3", "Contact Last Name 3"], ["contactFirstName3", "Contact First Name 3"], ["contactTitle3", "Contact Title 3"],
  ["contactEmail3", "Contact Email 3"], ["contactCell3", "Contact Cell 3"], ["phone", "Phone"], ["fax", "Fax"], ["website", "Website"],
] as const;
type FieldKey = typeof FIELDS[number][0];
type ImportRow = Record<FieldKey, string>;
type Option = { value: string; label: string };
type ApiResult = { ok: boolean; statuses?: { row: number; status: string }[]; imported?: number; titles?: Option[]; states?: Option[]; cities?: Option[]; error?: string };
const headers = FIELDS.map(([, label]) => label);
const emptyRow = () => Object.fromEntries(FIELDS.map(([key]) => [key, ""])) as ImportRow;
const matchField = (name: string): FieldKey | "" => FIELDS.find(([, label]) => label.toLowerCase() === name.trim().toLowerCase())?.[0] ?? "";

export function CustomerImportScreen() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | "">>({});
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [lists, setLists] = useState<{ titles: Option[]; states: Option[]; cities: Option[] }>({ titles: [], states: [], cities: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ready = rows.length > 0 && statuses.length === rows.length && statuses.every(status => status === "OK to import");
  const mappedFields = useMemo(() => Object.values(mapping).filter(Boolean), [mapping]);

  async function loadLists() {
    const response = await fetch("/api/admin/import-customers", { cache: "no-store" });
    const result = await response.json() as ApiResult;
    if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load customer valid list values.");
    setLists({ titles: result.titles ?? [], states: result.states ?? [], cities: result.cities ?? [] });
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    setError(""); setMessage(""); setRows([]); setStatuses([]);
    if (!/\.xlsx$/i.test(file.name)) { setError("Select an .xlsx workbook. The first worksheet must contain a header row."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Import workbooks must be 10 MB or smaller."); return; }
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("The workbook has no worksheet.");
      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
      if (!parsed.length) throw new Error("The first worksheet contains no customer rows.");
      const fields = Object.keys(parsed[0] ?? {});
      if (!fields.length) throw new Error("The first worksheet needs a header row.");
      setFileName(file.name); setSourceFields(fields); setRawRows(parsed);
      setMapping(Object.fromEntries(fields.map(field => [field, matchField(field)])));
      await loadLists(); setMessage(`${parsed.length} row${parsed.length === 1 ? "" : "s"} loaded from the first worksheet.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to read this workbook."); }
  }

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([headers]); sheet["!cols"] = headers.map(header => ({ wch: Math.max(20, header.length + 3) }));
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Customers"); XLSX.writeFile(workbook, "customer-import-template.xlsx");
  }

  function analyze() {
    setError(""); setStatuses([]);
    if (!sourceFields.length) { setError("Select an import workbook first."); return; }
    const targets = Object.values(mapping).filter(Boolean);
    if (new Set(targets).size !== targets.length) { setError("Match each database field at most once."); return; }
    const mapped = rawRows.map(raw => {
      const row = emptyRow();
      for (const source of sourceFields) { const target = mapping[source]; if (target) row[target] = String(raw[source] ?? "").trim(); }
      return row;
    }).filter(row => FIELDS.some(([key]) => row[key]));
    if (!mapped.length) { setError("No customer data rows were found after ignoring blank rows."); return; }
    if (mapped.length > 500) { setError("This import supports up to 500 customer rows at a time."); return; }
    setRows(mapped); setMessage(`${mapped.length} customer rows analyzed. Review them, then run Analyze to check database matches.`);
  }

  function editRow(index: number, field: FieldKey, value: string) { setRows(old => old.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row)); setStatuses([]); }
  const findLabel = (options: Option[], value: string) => options.find(item => item.label.toLowerCase() === value.trim().toLowerCase())?.label ?? "";
  async function copyValues(options: Option[]) {
    try { await navigator.clipboard.writeText(options.map(item => item.label).join("\r\n")); setMessage("Valid list values copied."); }
    catch { setError("Unable to copy values. Select and copy them from the list instead."); }
  }
  async function send(action: "check" | "import") {
    if (action === "import" && !window.confirm(`${rows.length} customers and their contacts will be imported. Continue?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/import-customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, rows }) });
      const result = await response.json() as ApiResult;
      if (result.statuses) setStatuses(result.statuses.map(item => item.status));
      if (!response.ok || !result.ok) throw new Error(result.error || "Customer import failed.");
      if (action === "check") setMessage(result.statuses?.every(item => item.status === "OK to import") ? "All customer rows are ready to import." : "Some rows need attention. Review Import Status and correct them.");
      else { setMessage(`${result.imported ?? 0} customers and their contacts were imported.`); setRows([]); setStatuses([]); setSourceFields([]); setRawRows([]); setFileName(""); setMapping({}); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Customer import failed."); }
    finally { setBusy(false); }
  }
  function reset() {
    if ((rows.length || sourceFields.length) && !window.confirm("There is some import data that has not been imported. Reset it?")) return;
    setRows([]); setStatuses([]); setRawRows([]); setSourceFields([]); setMapping({}); setFileName(""); setMessage("Import reset."); setError("");
  }

  return <section className="employee-import-screen customer-import-screen">
    <header className="employee-import-header"><h1>Customer Import</h1><div><AccessButton onClick={reset}>Reset</AccessButton><AccessButton onClick={() => { if ((!rows.length && !sourceFields.length) || window.confirm("There is import data that has not been completely imported yet. Continue closing?")) router.push("/tracking"); }}>Close</AccessButton></div></header>
    <div className="employee-import-setup-row"><span>(1) Create a new import file.</span><AccessButton onClick={downloadTemplate}>Create</AccessButton></div>
    <div className="employee-import-setup-row"><span>(2) Select an import file.</span><label className="employee-import-file">Browse<input type="file" accept=".xlsx" onChange={event => void chooseFile(event.target.files?.[0])}/></label><em>The Excel file must have a header row and the data must be in the first worksheet of the workbook. See the Customer Import Template.xlsx file as an example.</em>{fileName&&<strong>{fileName}</strong>}</div>
    <div className="employee-import-match-area customer-import-match-area"><div className="employee-import-match-left"><div className="employee-import-section-title"><span>(3) Match the database fields.</span><em>Select a Database Field match for each Import Field that you wish to import.</em></div><div className="employee-import-matching-grid"><table><thead><tr><th>Import Field</th><th>Database Field</th></tr></thead><tbody>{Array.from({length:Math.max(14,sourceFields.length)},(_,index)=>{const source=sourceFields[index]??"";return <tr key={source||`empty-${index}`}><td>{source}</td><td>{source?<select value={mapping[source]??""} onChange={event=>setMapping(old=>({...old,[source]:event.target.value as FieldKey|""}))}><option value="">(Do not import)</option>{FIELDS.map(([field,label])=><option key={field} value={field} disabled={mappedFields.includes(field)&&mapping[source]!==field}>{label}</option>)}</select>:<select disabled><option/></select>}</td></tr>})}</tbody></table></div></div>
      <fieldset className="employee-import-valid-lists customer-import-valid-lists"><legend>Valid List Values</legend><em>Copy list values to paste into the Excel Template.</em><div className="employee-import-valid-grid"><label><span>Contact Title</span><select aria-label="Contact Title valid values"><option value=""/>{lists.titles.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><AccessButton title="Copy Contact Title values" onClick={()=>void copyValues(lists.titles)}>▤</AccessButton></label><label><span>City</span><select aria-label="City valid values"><option value=""/>{lists.cities.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><AccessButton title="Copy City values" onClick={()=>void copyValues(lists.cities)}>▤</AccessButton></label><label><span>State</span><select aria-label="State valid values"><option value=""/>{lists.states.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><AccessButton title="Copy State values" onClick={()=>void copyValues(lists.states)}>▤</AccessButton></label></div></fieldset>
    </div>
    <div className="employee-import-analyze-row"><span>(4) Analyze the data.</span><AccessButton onClick={analyze} disabled={!sourceFields.length}>Analyze</AccessButton><em>This process will match import values with database values, where it can.</em></div>
    <div className="employee-import-edit-title"><span>(5) Edit the import data.</span><em>Fill blanks in the data. If M City, State is blank, double-click it to select a city and state.</em></div>
    <div className="employee-import-table-wrap"><table><thead><tr>{["ID",...FIELDS.map(([,label])=>label),"M City, State","Import Status"].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}><td>{index+1}</td>{FIELDS.map(([field])=><td key={field}><input aria-label={`Row ${index+1} ${field}`} value={row[field]} onChange={event=>editRow(index,field,event.target.value)}/></td>)}<td>{row.mailCity&&row.mailState?`${row.mailCity}, ${findLabel(lists.states,row.mailState)||row.mailState}`:""}</td><td className={statuses[index]==="OK to import"?"is-ready":statuses[index]?"has-error":""}>{statuses[index]||""}</td></tr>)}{!rows.length&&Array.from({length:8},(_,index)=><tr key={index} className={index===0?"employee-import-new-row":undefined}><td>{index===0?"(New)":""}</td>{Array.from({length:FIELDS.length+2},(_,column)=><td key={column}/>)}</tr>)}</tbody></table></div>
    <div className="customer-import-actions"><span>(6) Analyze and check the data.</span><AccessButton onClick={()=>void send("check")} disabled={busy||!rows.length}>{busy?"Checking…":"Analyze"}</AccessButton><em>Match import values with database values and find existing customers.</em><span>(7) Import the new Customers.</span><AccessButton variant="primary" onClick={()=>void send("import")} disabled={busy||!ready}>{busy?"Importing…":"Import"}</AccessButton><em>Add new customer records and their contacts to the database.</em></div>
    {(error||message)&&<p className={error?"employee-import-error":"employee-import-message"} role={error?"alert":"status"}>{error||message}</p>}
  </section>;
}
