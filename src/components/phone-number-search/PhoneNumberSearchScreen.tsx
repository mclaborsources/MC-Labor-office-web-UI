"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

const DEFAULT_VIEWS = ["View 01", "View 02", "View 03", "View 04"];
const STORAGE_KEY = "phone-number-search-views";

export function PhoneNumberSearchScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [views, setViews] = useState(DEFAULT_VIEWS);
  const [selectedView, setSelectedView] = useState(DEFAULT_VIEWS[0]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as string[];
      if (parsed.length) setViews(parsed);
    } catch { /* Keep the standard views if saved browser data is malformed. */ }
  }, []);

  function persist(next: string[]) {
    setViews(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function saveView() {
    const name = window.prompt("View name", selectedView)?.trim();
    if (!name) return;
    persist(Array.from(new Set([...views, name])));
    setSelectedView(name);
  }

  function deleteView() {
    if (views.length === 1) return;
    const next = views.filter((view) => view !== selectedView);
    persist(next);
    setSelectedView(next[0]);
  }

  function clearFilters() { setPhoneNumber(""); }

  return (
    <section className="ac-phone-search">
      <header className="ac-phone-search-header">
        <h1>Phone Number Search</h1>
        <div className="ac-phone-search-viewbar">
          <label htmlFor="phone-search-view">View:</label>
          <select id="phone-search-view" value={selectedView} onChange={(event) => setSelectedView(event.target.value)}>
            {views.map((view) => <option key={view}>{view}</option>)}
          </select>
          <AccessButton onClick={saveView}>Save View</AccessButton>
          <AccessButton onClick={deleteView} disabled={views.length === 1}>Delete View</AccessButton>
          <AccessButton>Refresh</AccessButton>
          <AccessButton onClick={clearFilters}>Zero</AccessButton>
          <AccessButton onClick={() => window.print()}>Export View</AccessButton>
        </div>
        <div className="ac-phone-search-closebar">
          <AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton>
          <button className="ac-job-app-help" type="button" title="Help" aria-label="Help">?</button>
        </div>
      </header>
      <div className="ac-phone-search-tools">
        <form className="ac-phone-search-form" onSubmit={(event) => event.preventDefault()}>
          <strong>SEARCH</strong><label htmlFor="phone-number">Phone Number:</label>
          <input id="phone-number" type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
          <AccessButton type="submit">Search</AccessButton>
        </form>
        <div className="ac-phone-search-view-buttons" aria-label="Saved views">
          {DEFAULT_VIEWS.map((view) => <AccessButton key={view} aria-pressed={selectedView === view} onClick={() => setSelectedView(view)}>{view.replace(" ", "")}</AccessButton>)}
        </div>
        <AccessButton className="ac-phone-search-clear" onClick={clearFilters}>Clear Filters</AccessButton>
      </div>
      <div className="ac-phone-search-grid-wrap">
        <table className="ac-phone-search-grid">
          <colgroup><col className="selector" /><col className="name" /><col className="title" /><col className="type" /><col className="refers" /><col /></colgroup>
          <thead><tr><th /><th>Name <i /></th><th>Title <i /></th><th>Type <i /></th><th>Refers To <i /></th><th /></tr></thead>
          <tbody>{Array.from({ length: 32 }, (_, row) => <tr key={row}><td>{row === 0 ? "◢" : ""}</td><td /><td /><td /><td /><td /></tr>)}</tbody>
        </table>
      </div>
      <footer className="ac-phone-search-recordbar">
        <span>Record:</span><button type="button" disabled>|◀</button><button type="button" disabled>◀</button><input aria-label="Record number" />
        <button type="button" disabled>▶</button><button type="button" disabled>▶|</button><span className="ac-phone-search-filter">▽ No Filter</span>
        <span className="ac-phone-search-status">Search</span><div />
      </footer>
    </section>
  );
}
