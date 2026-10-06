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
type RefResponse = { ok: boolean; grades?: { value: string; label: string }[]; error?: string };
const headers = FIELDS.map(([, label]) => label);
const emptyRow = (): ImportRow => Object.fromEntries(FIELDS.map(([key]) => [key, ""])) as ImportRow;
const fieldKeyForHeader = (header: string): FieldKey | "" => FIELDS.find(([, label]) => label.toLowerCase() === header.trim().toLowerCase())?.[0] ?? "";

export function EmployeeImportScreen() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | "">>({});
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [grades, setGrades] = useState<{ value: string; label: string }[]>([]);
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
    XLSX.writeFile(workbook, "employee-import-template.xlsx");
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
    <header className="employee-import-header"><div><h1>Employee Import</h1><p>Prepare, match, analyze, check, and import new employee records.</p></div><div><AccessButton onClick={() => { if ((!rows.length && !sourceFields.length) || window.confirm("There is import data that has not been completely imported yet. Close anyway?")) router.push("/tracking"); }}>Close</AccessButton><AccessButton onClick={() => { if (rows.length || sourceFields.length) { if (!window.confirm("There is import data that has not been completely imported yet. Reset?")) return; } setRows([]); setStatuses([]); setRawRows([]); setSourceFields([]); setMapping({}); setFileName(""); setGradeId(""); setMessage("Import workspace reset."); setError(""); }}>Reset</AccessButton></div></header>
    <ol className="employee-import-steps"><li><b>1</b> Create file</li><li><b>2</b> Select file</li><li><b>3</b> Match fields</li><li><b>4</b> Analyze</li><li><b>5</b> Edit data</li><li><b>6</b> Check</li><li><b>7</b> Grade</li><li><b>8</b> Import</li></ol>
    <div className="employee-import-actions">
      <section><h2>(1) Create a new import file</h2><p>Use the first worksheet and keep the header row. Import the employee details supported by this workflow.</p><AccessButton variant="primary" onClick={downloadTemplate}>Create Excel Template</AccessButton></section>
      <section><h2>(2) Select an import file</h2><label className="employee-import-file">Choose .xlsx workbook<input type="file" accept=".xlsx" onChange={event => void chooseFile(event.target.files?.[0])}/></label><span>{fileName || "No workbook selected"}</span><small>The first worksheet must have column headers. Maximum 10 MB and 500 employee rows.</small></section>
    </div>
    {sourceFields.length > 0 && <section className="employee-import-mapping"><div><h2>(3) Match the database fields</h2><p>Each destination can be used once. Unmatched columns are ignored.</p></div><div className="employee-import-map-grid">{sourceFields.map(source => <label key={source}><span>{source}</span><select value={mapping[source] ?? ""} onChange={event => setMapping(old => ({ ...old, [source]: event.target.value as FieldKey | "" }))}><option value="">(Do not import)</option>{FIELDS.map(([field, label]) => <option key={field} value={field} disabled={mappedFields.includes(field) && mapping[source] !== field}>{label}</option>)}</select></label>)}</div><AccessButton variant="go" onClick={analyze}>Analyze</AccessButton></section>}
    {rows.length > 0 && <>
      <section className="employee-import-review"><div className="employee-import-review-head"><div><h2>(4–6) Review and check the data</h2><p>Required: First Name, Last Name, Employee Status, and Grade. Duplicate employees and invalid lookup values block import.</p></div><div><label>(7) Grade (required)<select value={gradeId} onChange={event => { setGradeId(event.target.value); setStatuses([]); }}><option value="">Select a grade</option>{grades.map(grade => <option key={grade.value} value={grade.value}>{grade.label}</option>)}</select></label><AccessButton onClick={() => void send("check")} disabled={busy || !gradeId}>{busy ? "Checking…" : "Check"}</AccessButton><AccessButton variant="primary" onClick={() => void send("import")} disabled={busy || !ready || !gradeId}>{busy ? "Importing…" : "Import Employees"}</AccessButton></div></div>
        <div className="employee-import-table-wrap"><table><thead><tr>{["Row","First Name","MI","Last Name","Cell #","City","State","Pay","Trade","Qualification","Email","Employee Status","How Referred","Other Desc/Employee","Import Status"].map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}><td>{index+1}</td>{FIELDS.map(([field])=><td key={field}><input aria-label={`Row ${index+1} ${field}`} value={row[field]} onChange={event => editRow(index,field,event.target.value)}/></td>)}<td className={statuses[index] === "OK to import" ? "is-ready" : statuses[index] ? "has-error" : ""}>{statuses[index] || "Not checked"}</td></tr>)}</tbody></table></div>
      </section>
    </>}
    {(error || message) && <p className={error ? "employee-import-error" : "employee-import-message"} role={error ? "alert" : "status"}>{error || message}</p>}
    <footer>(8) Import the new Employees — the import is completed as a single database transaction.</footer>
  </section>;
}
