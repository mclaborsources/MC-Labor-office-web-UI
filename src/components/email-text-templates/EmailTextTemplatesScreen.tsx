"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

type Option = { id: string; label: string };
type Template = { id: number; name: string; typeId: string; sendId: string; queryName: string; sort: string; futureDays: string; addresses: string; cc: string; bcc: string; subject: string; body: string; newsletter: string };
const EMPTY: Template = { id: 0, name: "", typeId: "", sendId: "", queryName: "", sort: "", futureDays: "", addresses: "", cc: "", bcc: "", subject: "", body: "", newsletter: "" };
const SIGNATURE = "email-template-signature-v1", LOGO = "email-template-logo-v1";
const normalizeTemplate = (row: Partial<Template>): Template => ({ id: Number(row.id) || 0, name: String(row.name ?? ""), typeId: String(row.typeId ?? ""), sendId: String(row.sendId ?? ""), queryName: String(row.queryName ?? ""), sort: String(row.sort ?? ""), futureDays: String(row.futureDays ?? ""), addresses: String(row.addresses ?? ""), cc: String(row.cc ?? ""), bcc: String(row.bcc ?? ""), subject: String(row.subject ?? ""), body: String(row.body ?? ""), newsletter: String(row.newsletter ?? "") });
const sanitizeTemplateHtml = (html: string) => html
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|meta|link)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
  .replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|meta|link)\b[^>]*\/?>/gi, "")
  .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, rawName: string) => {
    const name = rawName.toLowerCase();
    if (!["p","div","br","strong","b","em","i","u","ul","ol","li","span","a","h1","h2","h3","blockquote","table","thead","tbody","tr","td","th"].includes(name)) return "";
    return tag.startsWith("</") ? `</${name}>` : `<${name}>`;
  });

export function EmailTextTemplatesScreen() {
  const [rows, setRows] = useState<Template[]>([]), [types, setTypes] = useState<Option[]>([]), [sendTypes, setSendTypes] = useState<Option[]>([]), [queryOptions, setQueryOptions] = useState<{ value: string; label: string }[]>([]), [queryFields, setQueryFields] = useState<string[]>([]);
  const [form, setForm] = useState<Template>(EMPTY), [templateFilter, setTemplateFilter] = useState(""), [sendFilter, setSendFilter] = useState(""), [nameSearch, setNameSearch] = useState(""), [activeQuery, setActiveQuery] = useState("");
  const [notice, setNotice] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [editing, setEditing] = useState(false), [signature, setSignature] = useState(""), [logo, setLogo] = useState(""), [selectedField, setSelectedField] = useState("");
  const signatureInput = useRef<HTMLInputElement>(null), logoInput = useRef<HTMLInputElement>(null), subjectRef = useRef<HTMLInputElement>(null), bodyRef = useRef<HTMLDivElement>(null), addressRef = useRef<HTMLInputElement>(null);
  const activeEditor = useRef<"subject"|"addresses"|"body">("body");
  const load = useCallback(async (search = "") => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/email-text-templates?search=${encodeURIComponent(search)}`, { cache: "no-store" });
      const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Could not load email templates.");
      setRows((data.rows ?? []).map(normalizeTemplate)); setTypes((data.types ?? []).map((option: Option) => ({ id: String(option.id ?? ""), label: String(option.label ?? "") }))); setSendTypes((data.sendTypes ?? []).map((option: Option) => ({ id: String(option.id ?? ""), label: String(option.label ?? "") }))); setQueryOptions((data.queryOptions ?? []).map((option: {value:string;label:string}) => ({ value: String(option.value ?? ""), label: String(option.label ?? "") })));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load templates."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); try { setSignature(localStorage.getItem(SIGNATURE) ?? ""); setLogo(localStorage.getItem(LOGO) ?? ""); } catch { /* Ignore unavailable browser storage. */ } }, [load]);
  useEffect(() => {
    let active = true;
    void fetch(`/api/admin/email-text-templates?query=${encodeURIComponent(activeQuery)}`, { cache: "no-store" }).then(async response => { const data = await response.json(); if (!response.ok || !data.ok) return; if (active) setQueryFields(data.sourceFields ?? []); }).catch(() => { if (active) setQueryFields([]); });
    return () => { active = false; };
  }, [activeQuery]);
  const visibleRows = useMemo(() => rows.filter(row => (!templateFilter || row.typeId === templateFilter) && (!sendFilter || row.sendId === sendFilter) && (!nameSearch || row.name.toLowerCase().includes(nameSearch.toLowerCase()))).slice().sort((a,b) => (Number(a.sort)||0)-(Number(b.sort)||0) || a.name.localeCompare(b.name)), [rows,templateFilter,sendFilter,nameSearch]);
  const set = (key: keyof Template, value: string) => setForm(old => ({ ...old, [key]: value }));
  function select(row: Template) { const selected = normalizeTemplate(row); setForm(selected); setEditing(true); setNotice(""); setError(""); setActiveQuery(selected.queryName); }
  function startNew() { setForm({ ...EMPTY, typeId: templateFilter, sendId: sendFilter }); setEditing(true); setNotice(""); setError(""); setActiveQuery(""); }
  function cancel() { setForm(EMPTY); setEditing(false); setNotice(""); setError(""); }
  async function action(type: "save"|"copy"|"rename"|"delete", name?: string): Promise<boolean> {
    const nextName = name ?? form.name;
    if (type !== "delete" && !nextName.trim()) { setError("Enter a template name."); return false; }
    if ((type === "rename" || type === "delete") && !form.id) { setError("Select a saved template first."); return false; }
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/email-text-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: type, id: form.id, name: nextName, template: form }) });
      const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Template action failed.");
      await load(nameSearch); setNotice(type === "delete" ? "Template deleted." : type === "rename" ? "Template renamed." : type === "copy" ? "Template copied." : "Template saved.");
      if (type === "delete" || type === "copy") cancel(); else setForm(current => ({ ...current, name: nextName }));
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Template action failed."); return false; }
    finally { setBusy(false); }
  }
  async function removeSelected() { if (!form.id || !window.confirm(`Delete template “${form.name}”?`)) return; await action("delete"); }
  async function renameSelected() { if (!form.id) { setError("Select a saved template first."); return; } const value = window.prompt("New template name", form.name); if (value?.trim()) await action("rename", value.trim()); }
  async function moveSelected(direction: -1|1) { if (!form.id) { setError("Select a saved template first."); return; } setBusy(true); setError(""); try { const response = await fetch("/api/admin/email-text-templates", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"move",id:form.id,direction}) }); const data=await response.json(); if(!response.ok||!data.ok) throw new Error(data.error||"Unable to change template order."); await load(nameSearch); setNotice("Template sort order updated."); } catch(cause) { setError(cause instanceof Error?cause.message:"Unable to change template order."); } finally { setBusy(false); } }
  function insertField() {
    const field = selectedField; if (!field) { setError("Select a data query field first."); return; }
    const token = `{{${field}}}`;
    if (activeEditor.current === "body") {
      const target = bodyRef.current;
      if (!target) return;
      target.focus();
      const selection = window.getSelection();
      if (selection?.rangeCount && target.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0); range.deleteContents(); const text = document.createTextNode(token); range.insertNode(text); range.setStartAfter(text); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
      } else target.append(document.createTextNode(token));
      set("body", target.innerHTML);
      return;
    }
    const target = activeEditor.current === "subject" ? subjectRef.current : addressRef.current;
    const current = target === subjectRef.current ? form.subject : form.addresses;
    const start = target?.selectionStart ?? current.length, end = target?.selectionEnd ?? start;
    const value = `${current.slice(0,start)}${token}${current.slice(end)}`;
    if (target === subjectRef.current) set("subject", value); else if (target === addressRef.current) set("addresses", value);
    requestAnimationFrame(() => { target?.focus(); target?.setSelectionRange(start + token.length, start + token.length); });
    setNotice(`Inserted ${token}.`);
  }
  function storeImage(file: File | undefined, kind: "signature"|"logo") { if (!file) return; if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; } if (file.size > 2_000_000) { setError("Choose an image smaller than 2 MB."); return; } const reader = new FileReader(); reader.onload = () => { const value = String(reader.result ?? ""); try { localStorage.setItem(kind === "signature" ? SIGNATURE : LOGO, value); if (kind === "signature") setSignature(value); else setLogo(value); setNotice(`${kind === "signature" ? "Signature" : "Logo"} saved in this browser.`); } catch { setError("Browser storage is full; the image was not saved."); } }; reader.readAsDataURL(file); }
  function removeImage(kind: "signature"|"logo") { try { localStorage.removeItem(kind === "signature" ? SIGNATURE : LOGO); if (kind === "signature") setSignature(""); else setLogo(""); setNotice(`${kind === "signature" ? "Signature" : "Logo"} removed.`); } catch { setError("Unable to remove the image."); } }
  function preview() { const popup = window.open("", "template-preview", "width=900,height=750"); if (!popup) { setError("Allow pop-ups to preview the template."); return; } const html = `<!doctype html><html><head><title>${escapeHtml(form.name || "Template preview")}</title><style>body{font:14px Arial;margin:30px;color:#222}img{max-width:260px;max-height:120px}</style></head><body><h2>${escapeHtml(form.subject || form.name || "Template preview")}</h2><p><b>To:</b> ${escapeHtml(form.addresses)}</p><p><b>CC:</b> ${escapeHtml(form.cc)}　 <b>BCC:</b> ${escapeHtml(form.bcc)}</p>${logo ? `<img src="${logo}" alt="Logo">` : ""}${sanitizeTemplateHtml(form.body || form.newsletter)}${signature ? `<img src="${signature}" alt="Signature">` : ""}</body></html>`; popup.document.write(html); popup.document.close(); }
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);

  return <section className="ac-email-templates">
    <header className="ac-email-templates-header"><h1>Email/Text/Letter/Postcard Templates</h1><div><AccessButton onClick={async () => { if (await action("save")) preview(); }}>Save/Preview</AccessButton><AccessButton onClick={() => window.history.back()}>Close</AccessButton></div></header>
    <div className="ac-email-templates-filter"><label>Template Type <select value={templateFilter ?? ""} onChange={event => setTemplateFilter(event.target.value)}><option value="">All</option>{types.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><label>Send Type <select value={sendFilter ?? ""} onChange={event => setSendFilter(event.target.value)}><option value="">All</option>{sendTypes.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><label>Search in Name: <input value={nameSearch ?? ""} onChange={event => setNameSearch(event.target.value)} /></label></div>
    <main className="ac-email-templates-main"><section className="ac-email-templates-list"><div className="ac-email-templates-instructions"><i>1) Select a Template Type Filter.<br/>2) Double-click a Template below to view or edit the template.<br/>3) Use the up and down arrow buttons to change the sort.</i></div><div className="ac-email-templates-list-grid"><table className="legacy-report-grid"><thead><tr><th>Email Type</th><th>Send Type</th><th>Template</th><th>Sort</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.id} onDoubleClick={() => select(row)} onClick={() => select(row)} className={form.id === row.id ? "is-current" : undefined}><td>{types.find(option => option.id === row.typeId)?.label ?? row.typeId}</td><td>{sendTypes.find(option => option.id === row.sendId)?.label ?? row.sendId}</td><td>{row.name}</td><td>{row.sort}</td></tr>)}</tbody></table></div><div className="ac-email-templates-row-tools"><AccessButton disabled={!form.id||busy} onClick={() => void moveSelected(-1)}>↑</AccessButton><AccessButton disabled={!form.id||busy} onClick={() => void moveSelected(1)}>↓</AccessButton><AccessButton disabled={!form.id||busy} onClick={() => void removeSelected()}>✕</AccessButton><span>{visibleRows.length} templates</span></div></section>
      <section className="ac-email-templates-editor"><div className="ac-email-templates-editor-top"><label>Template: <input value={form.name ?? ""} onChange={event => set("name",event.target.value)} /></label><AccessButton disabled={busy} onClick={startNew}>New</AccessButton><AccessButton disabled={busy || (!editing && !form.id)} onClick={() => void action("save")}>Save</AccessButton><AccessButton disabled={busy} onClick={cancel}>Cancel</AccessButton><AccessButton disabled={busy || !form.id} onClick={() => void action("copy", `${form.name} Copy`)}>Copy</AccessButton><AccessButton disabled={busy || !form.id} onClick={() => void renameSelected()}>Rename</AccessButton></div>
        <div className="ac-email-templates-form-grid"><label>Template Type <select value={form.typeId ?? ""} onChange={event => set("typeId",event.target.value)}><option value="" />{types.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><label>Sort <input value={form.sort ?? ""} onChange={event => set("sort",event.target.value)} /></label><label>Query for Data <select value={form.queryName ?? ""} onChange={event => { set("queryName",event.target.value); setActiveQuery(event.target.value); }}><option value="" />{queryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>This is where the data for the email contents comes from.</small></label><label>Send Type <select value={form.sendId ?? ""} onChange={event => set("sendId",event.target.value)}><option value="" />{sendTypes.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><label>Future Call Days <input value={form.futureDays ?? ""} onChange={event => set("futureDays",event.target.value)} /></label><small>Default the Future Call date this many days out.</small></div>
        <div className="ac-email-templates-content"><div className="ac-email-templates-compose"><label>Addresses <input ref={addressRef} onFocus={()=>{activeEditor.current="addresses";}} value={form.addresses ?? ""} onChange={event => set("addresses",event.target.value)} /></label><i>Separate email addresses with a semicolon and no spaces, like: user@example.com;other@example.com</i><label>Cc Addresses <input value={form.cc ?? ""} onChange={event => set("cc",event.target.value)} /></label><label>Bcc Addresses <input value={form.bcc ?? ""} onChange={event => set("bcc",event.target.value)} /></label><label>Subject <input ref={subjectRef} onFocus={()=>{activeEditor.current="subject";}} value={form.subject ?? ""} onChange={event => set("subject",event.target.value)} /><AccessButton onClick={insertField}>← Insert</AccessButton></label><label className="ac-email-templates-body-label">Body <div ref={bodyRef} className="ac-email-templates-rich-body" contentEditable suppressContentEditableWarning onFocus={()=>{activeEditor.current="body";}} onInput={event => set("body",event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: sanitizeTemplateHtml(form.body) }} /></label></div>
          <aside className="ac-email-templates-fields"><i>1) Click a Query Field Name.<br/>2) Click where you want to insert it.<br/>3) Click the nearby Insert button.</i><div className="ac-email-templates-field-table"><table className="legacy-report-grid"><thead><tr><th>Query Field Names</th></tr></thead><tbody>{queryFields.map(field => <tr key={field} className={selectedField===field?"is-current":undefined} onClick={() => setSelectedField(field)}><td>{field}</td></tr>)}</tbody></table></div><AccessButton onClick={insertField}>← Insert [Employee Bio]</AccessButton><AccessButton onClick={insertField}>← Insert</AccessButton><div className="ac-email-templates-asset"><div><input ref={signatureInput} hidden type="file" accept="image/*" onChange={event => storeImage(event.target.files?.[0],"signature")} /><AccessButton onClick={() => signatureInput.current?.click()}>Get Signature</AccessButton><AccessButton onClick={() => removeImage("signature")}>Remove Signature</AccessButton>{signature && <span className="ac-email-templates-image-preview" style={{ backgroundImage: `url("${signature}")` }} role="img" aria-label="Signature preview" />}</div><div><input ref={logoInput} hidden type="file" accept="image/*" onChange={event => storeImage(event.target.files?.[0],"logo")} /><AccessButton onClick={() => logoInput.current?.click()}>Get Logo</AccessButton><AccessButton onClick={() => removeImage("logo")}>Remove Logo</AccessButton>{logo && <span className="ac-email-templates-image-preview" style={{ backgroundImage: `url("${logo}")` }} role="img" aria-label="Logo preview" />}</div></div><label className="ac-email-templates-newsletter">Newsletter <select value={form.newsletter ?? ""} onChange={event => set("newsletter",event.target.value)}><option value="">None</option>{queryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><AccessButton onClick={() => set("body",`${form.body}${form.newsletter ? `\n{{${form.newsletter}}}` : ""}`)}>Build</AccessButton></label></aside></div>
        <div className="ac-email-templates-footer"><AccessButton onClick={preview}>Preview</AccessButton>{notice && <span role="status">{notice}</span>}{error && <span role="alert">{error}</span>}</div>
      </section>
    </main>
  </section>;
}
