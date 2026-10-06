"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { AccessButton } from "@/components/access/AccessButton";

const FIELDS = [
  ["firstName", "First Name"], ["middleInitial", "MI"], ["lastName", "Last Name"], ["cellPhone", "Cell #"],
  ["city", "City"], ["state", "State"], ["pay", "Pay"], ["trade", "Trade"], ["qualification", "Qualification"],
  ["email", "Email"], ["employeeStatus", "Employee Status"], ["howReferred", "How Referred"], ["referredBy", "Other Desc/Employee"],
] as const;
type FieldKey = typeof FIELDS[number][0];
type ImportRow = Record<FieldKey, string>;
type CheckResponse = { ok: boolean; statuses?: { row: number; status: string }[]; imported?: number; error?: string };
type LookupOption = { value: string; label: string };
type RefResponse = { ok: boolean; grades?: LookupOption[]; trades?: LookupOption[]; referrals?: LookupOption[]; qualifications?: LookupOption[]; statuses?: LookupOption[]; states?: LookupOption[]; error?: string };
const headers = FIELDS.map(([, label]) => label);
const emptyRow = (): ImportRow => Object.fromEntries(FIELDS.map(([key]) => [key, ""])) as ImportRow;
const fieldKeyForHeader = (header: string): FieldKey | "" => FIELDS.find(([, label]) => label.toLowerCase() === header.trim().toLowerCase())?.[0] ?? "";

export function EmployeeImportScreen({ variant = "employees" }: { variant?: "employees" | "carriers" | "addresses" }) {
  const router = useRouter();
  const screenTitle = variant === "carriers" ? "Employee Import Carriers" : variant === "addresses" ? "Employee Import New Addresses" : "Employee Import";
  const [fileName, setFileName] = useState("");
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | "">>({});
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [grades, setGrades] = useState<{ value: string; label: string }[]>([]);
  const [validLists, setValidLists] = useState<{ trade: LookupOption[]; status: LookupOption[]; qualification: LookupOption[]; state: LookupOption[]; referral: LookupOption[] }>({ trade: [], status: [], qualification: [], state: [], referral: [] });
  const [gradeId, setGradeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ready = rows.length > 0 && statuses.length === rows.length && statuses.every(status => status === "OK to import");
  const mappedFields = useMemo(() => Object.values(mapping).filter(Boolean), [mapping]);

  async function loadGradeOptions() {
    try {
      const response = await fetch("/api/employees/new-employee-reference", { cache: "no-store" });
      const result = await response.json() as RefResponse;
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load employee grades.");
      setGrades(result.grades ?? []);
      setValidLists({ trade: result.trades ?? [], status: result.statuses ?? [], qualification: result.qualifications ?? [], state: result.states ?? [], referral: result.referrals ?? [] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load employee grades."); }
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
      if (!parsed.length) throw new Error("The first worksheet contains no employee rows.");
      const fields = Object.keys(parsed[0] ?? {});
      if (!fields.length) throw new Error("The first worksheet needs a header row.");
      setFileName(file.name); setSourceFields(fields); setRawRows(parsed);
      setMapping(Object.fromEntries(fields.map(field => [field, fieldKeyForHeader(field)])));
      setGradeId(""); await loadGradeOptions();
      setMessage(`${parsed.length} row${parsed.length === 1 ? "" : "s"} loaded from the first worksheet.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to read this workbook."); }
  }

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    sheet["!cols"] = headers.map(header => ({ wch: Math.max(18, header.length + 3) }));
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Employees");
    XLSX.writeFile(workbook, `${screenTitle.toLowerCase().replaceAll(" ", "-")}-template.xlsx`);
  }

  function analyze() {
    setError(""); setStatuses([]);
    if (!sourceFields.length) { setError("Select an import workbook first."); return; }
    const targets = Object.values(mapping).filter(Boolean);
    if (new Set(targets).size !== targets.length) { setError("Match each database field at most once."); return; }
    const mapped = rawRows.map(raw => {
      const row = emptyRow();
      for (const source of sourceFields) {
        const target = mapping[source];
        if (target) row[target] = String(raw[source] ?? "").trim();
      }
      return row;
    }).filter(row => FIELDS.some(([key]) => row[key]));
    if (!mapped.length) { setError("No employee data rows were found after ignoring blank rows."); return; }
    if (mapped.length > 500) { setError("This import supports up to 500 employee rows at a time."); return; }
    setRows(mapped); setMessage(`${mapped.length} employee rows analyzed. Review the rows, choose a grade, then run Check.`);
  }

  function editRow(index: number, field: FieldKey, value: string) {
    setRows(old => old.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
    setStatuses([]);
  }

  function matchedLabel(list: LookupOption[], value: string) {
    return list.find(option => option.label.trim().toLowerCase() === value.trim().toLowerCase())?.label ?? "";
  }

  async function copyValidValues(list: LookupOption[]) {
    try { await navigator.clipboard.writeText(list.map(option => option.label).join("\r\n")); setMessage("Valid list values copied."); }
    catch { setError("Unable to copy values. Select and copy them from the list instead."); }
  }

  async function send(action: "check" | "import") {
    if (action === "import" && !window.confirm(`${rows.length} employees and employee contacts will be imported. Continue?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/import-employees", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, gradeId, rows }),
      });
      const result = await response.json() as CheckResponse;
      if (result.statuses) setStatuses(result.statuses.map(item => item.status));
      if (!response.ok || !result.ok) throw new Error(result.error || "Employee import failed.");
      if (action === "check") setMessage(result.statuses?.every(item => item.status === "OK to import") ? "All employee rows are ready to import." : "Some rows need attention. Review Import Status and correct the listed issues.");
      else { setMessage(`${result.imported ?? 0} employees and employee contacts were imported.`); setRows([]); setStatuses([]); setSourceFields([]); setRawRows([]); setFileName(""); setMapping({}); setGradeId(""); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Employee import failed."); }
    finally { setBusy(false); }
  }

  return <section className="employee-import-screen">
    <header className="employee-import-header"><h1>{screenTitle}</h1><div><AccessButton onClick={() => { if ((rows.length || sourceFields.length) && !window.confirm("There is some data that has not been completely imported yet. Reset?")) return; setRows([]); setStatuses([]); setRawRows([]); setSourceFields([]); setMapping({}); setFileName(""); setGradeId(""); setMessage("Import reset."); setError(""); }}>Reset</AccessButton><AccessButton onClick={() => { if ((!rows.length && !sourceFields.length) || window.confirm("There is import data that has not been completely imported yet. Continue closing?")) router.push("/tracking"); }}>Close</AccessButton></div></header>

    <div className="employee-import-setup-row"><span>(1) Create a new import file.</span><AccessButton onClick={downloadTemplate}>Create</AccessButton></div>
    <div className="employee-import-setup-row"><span>(2) Select an import file.</span><label className="employee-import-file">Browse<input type="file" accept=".xlsx" onChange={event => void chooseFile(event.target.files?.[0])}/></label><em>The Excel file must have a header row and the data must be in the first worksheet of the workbook. See the {screenTitle} Template.xlsx file as an example.</em>{fileName&&<strong>{fileName}</strong>}</div>

    <div className="employee-import-match-area">
      <div className="employee-import-match-left"><div className="employee-import-section-title"><span>(3) Match the database fields.</span><em>Select a Database Field match for each Import Field that you wish to import.</em></div>
        <div className="employee-import-matching-grid"><table><thead><tr><th>Import Field</th><th>Database Field</th></tr></thead><tbody>{Array.from({length:Math.max(14,sourceFields.length)},(_,index)=>{const source=sourceFields[index]??"";return <tr key={source||`empty-${index}`}><td>{source}</td><td>{source?<select value={mapping[source]??""} onChange={event=>setMapping(old=>({...old,[source]:event.target.value as FieldKey|""}))}><option value="">(Do not import)</option>{FIELDS.map(([field,label])=><option key={field} value={field} disabled={mappedFields.includes(field)&&mapping[source]!==field}>{label}</option>)}</select>:<select disabled><option/></select>}</td></tr>})}</tbody></table></div>
      </div>
      <fieldset className="employee-import-valid-lists"><legend>Valid List Values</legend><em>Copy list values to paste into the Excel Template.</em><div className="employee-import-valid-grid">{([ ["Trade",validLists.trade],["Employee Status",validLists.status],["Qualification",validLists.qualification],["State",validLists.state],["How Referred",validLists.referral] ] as [string,LookupOption[]][]).map(([label,list])=><label key={label}><span>{label}</span><select aria-label={`${label} valid values`}><option value=""/>{list.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><AccessButton aria-label={`Copy ${label} values`} title={`Copy ${label} values`} onClick={()=>void copyValidValues(list)}>▤</AccessButton></label>)}</div></fieldset>
    </div>

    <div className="employee-import-analyze-row"><span>(4) Analyze the data.</span><AccessButton onClick={analyze} disabled={!sourceFields.length}>Analyze</AccessButton><em>This process will match import values with database values, where it can.</em></div>
    <div className="employee-import-edit-title"><span>(5) Edit the import data.</span><em>Fill blanks in the data. If City, State is blank but there is a City (Import) value, select a value from State (Database). To change a City, State, double-click to select a different combination.</em></div>
    <div className="employee-import-table-wrap"><table><thead><tr>{["ID","First Name","MI","LastName","Cell #","City (Import)","State (Import)","State (Database)","City, State","Pay","Trade (Import)","Trade (Database)","Qualification (Import)","Qualification (Database)","Email","Employee Status (Import)","Employee Status (Database)","How Referred (Import)","How Referred (Database)","Other Desc/Employee","Import Status"].map(header=><th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}>
      <td>{index+1}</td>
      {(["firstName","middleInitial","lastName","cellPhone","city","state"] as FieldKey[]).map(field=><td key={field}><input aria-label={`Row ${index+1} ${field}`} value={row[field]} onChange={event=>editRow(index,field,event.target.value)}/></td>)}
      <td>{matchedLabel(validLists.state,row.state)}</td><td>{row.city&&row.state?`${row.city}, ${matchedLabel(validLists.state,row.state)||row.state}`:""}</td>
      <td><input aria-label={`Row ${index+1} pay`} value={row.pay} onChange={event=>editRow(index,"pay",event.target.value)}/></td>
      <td><input aria-label={`Row ${index+1} trade`} value={row.trade} onChange={event=>editRow(index,"trade",event.target.value)}/></td><td>{matchedLabel(validLists.trade,row.trade)}</td>
      <td><input aria-label={`Row ${index+1} qualification`} value={row.qualification} onChange={event=>editRow(index,"qualification",event.target.value)}/></td><td>{matchedLabel(validLists.qualification,row.qualification)}</td>
      <td><input aria-label={`Row ${index+1} email`} value={row.email} onChange={event=>editRow(index,"email",event.target.value)}/></td>
      <td><input aria-label={`Row ${index+1} employee status`} value={row.employeeStatus} onChange={event=>editRow(index,"employeeStatus",event.target.value)}/></td><td>{matchedLabel(validLists.status,row.employeeStatus)}</td>
      <td><input aria-label={`Row ${index+1} how referred`} value={row.howReferred} onChange={event=>editRow(index,"howReferred",event.target.value)}/></td><td>{matchedLabel(validLists.referral,row.howReferred)}</td>
      <td><input aria-label={`Row ${index+1} other description`} value={row.referredBy} onChange={event=>editRow(index,"referredBy",event.target.value)}/></td>
      <td className={statuses[index]==="OK to import"?"is-ready":statuses[index]?"has-error":""}>{statuses[index]||""}</td>
    </tr>)}{!rows.length&&Array.from({length:8},(_,index)=><tr key={`new-${index}`} className={index===0?"employee-import-new-row":undefined}><td>{index===0?"(New)":""}</td>{Array.from({length:20},(_,column)=><td key={column}/>)}</tr>)}</tbody></table></div>
    <div className="employee-import-lower-actions"><div className="employee-import-step-action"><span>(6) Check the data.</span><AccessButton onClick={()=>void send("check")} disabled={busy||!rows.length||!gradeId}>{busy?"Checking…":"Check"}</AccessButton><em>Find duplicates and missing required values before importing.</em></div><div className="employee-import-step-action"><span>(7) Select a Grade (required).</span><select value={gradeId} onChange={event=>{setGradeId(event.target.value);setStatuses([]);}}><option value="">Select a Grade</option>{grades.map(grade=><option key={grade.value} value={grade.value}>{grade.label}</option>)}</select></div><div className="employee-import-step-action"><span>(8) Import the new Employees.</span><AccessButton variant="primary" onClick={()=>void send("import")} disabled={busy||!ready||!gradeId}>{busy?"Importing…":"Import"}</AccessButton><em>Add the new Employees and [SAME PERSON] contacts to the database.</em></div></div>
    {(error||message)&&<p className={error?"employee-import-error":"employee-import-message"} role={error?"alert":"status"}>{error||message}</p>}
  </section>;
}
