"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import shortcuts from "@/lib/dashboardShortcuts.json";

export function DashboardShortcutsDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);
  const shown = shortcuts.filter(item => item.title.toLowerCase().includes(search.trim().toLowerCase()));
  function select(index: number) {
    const next = Math.max(0, Math.min(shown.length - 1, index));
    setSelected(next);
    list.current?.querySelectorAll(".ac-shortcuts-row")[next]?.scrollIntoView({ block: "nearest" });
  }
  return <>
    <button type="button" className="ac-access-menu-windows" aria-label="Open shortcuts" title="Shortcuts" onClick={() => { setSearch(""); setSelected(0); dialog.current?.showModal(); if (list.current) list.current.scrollTop = 0; }}><FileText size={20} /></button>
    <dialog ref={dialog} className="ac-shortcuts-dialog" aria-labelledby="shortcuts-heading">
      <header className="ac-shortcuts-titlebar"><FileText size={16} aria-hidden="true" /><span id="shortcuts-heading">Shortcuts</span><button type="button" aria-label="Close shortcuts" onClick={() => dialog.current?.close()}>×</button></header>
      <div className="ac-shortcuts-column-heading"><span aria-hidden="true" /><span>Shortcuts</span><span aria-hidden="true">▾</span></div>
      <div ref={list} className="ac-shortcuts-list" aria-label="Main Menu shortcuts">
        {shown.map((item, index) => <div key={item.id} className={`ac-shortcuts-row${index === selected ? " is-selected" : ""}`}>
          <span className="ac-shortcuts-selector" aria-hidden="true">{index === selected ? "▸" : ""}</span>
          {item.objectName === "frmOfficeStaffEdit"
            ? <Link href="/admin/office-staff" onFocus={() => setSelected(index)} onClick={() => dialog.current?.close()}>{item.title}</Link>
            : <span className="ac-shortcuts-inactive" aria-disabled="true" title="Not available yet">{item.title}</span>}
        </div>)}
        {!shown.length && <p className="ac-shortcuts-empty">No matching shortcuts.</p>}
      </div>
      <footer className="ac-shortcuts-footer">
        <span>Record:</span>
        <button type="button" aria-label="First shortcut" disabled={!shown.length || selected === 0} onClick={() => select(0)}>Ⅰ‹</button>
        <button type="button" aria-label="Previous shortcut" disabled={!shown.length || selected === 0} onClick={() => select(selected - 1)}>‹</button>
        <span>{shown.length ? selected + 1 : 0} of {shown.length}</span>
        <button type="button" aria-label="Next shortcut" disabled={!shown.length || selected >= shown.length - 1} onClick={() => select(selected + 1)}>›</button>
        <button type="button" aria-label="Last shortcut" disabled={!shown.length || selected >= shown.length - 1} onClick={() => select(shown.length - 1)}>›Ⅰ</button>
        <input type="search" aria-label="Search shortcuts" placeholder="Search" value={search} onChange={event => { setSearch(event.target.value); setSelected(0); if (list.current) list.current.scrollTop = 0; }} />
      </footer>
    </dialog>
  </>;
}
