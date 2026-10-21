"use client";

import { useEffect, useState } from "react";

export type CustomerLoadProgress = { stage: "fetching" | "downloading" | "preparing"; bytes: number; count?: number };

const stages = ["Fetching records", "Downloading data", "Preparing table"];

export function CustomerRecordsLoading({ progress, recordType = "customer" }: { progress: CustomerLoadProgress; recordType?: "customer" | "employee" }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setSeconds((performance.now() - started) / 1000), 100);
    return () => window.clearInterval(timer);
  }, []);
  const active = progress.stage === "fetching" ? 0 : progress.stage === "downloading" ? 1 : 2;
  return <div className="ac-customer-records-loading" aria-busy="true">
    <div className="ac-customer-records-loading-card">
      <div className="ac-customer-records-loading-heading"><span className="ac-customer-records-spinner" aria-hidden="true" /><strong>Loading {recordType} records</strong><span className="ac-customer-records-elapsed">{seconds.toFixed(1)}s</span></div>
      <p role="status" aria-live="polite">{active === 0 ? `Fetching all ${recordType} records and their fields…` : active === 1 ? `Downloading ${progress.count?.toLocaleString() ?? "all"} ${recordType} records…` : "Preparing your table, search, and filters…"}</p>
      <div className="ac-customer-loading-track" aria-hidden="true"><span className="ac-customer-loading-bar" /></div>
      <ol className="ac-customer-records-stages">{stages.map((label, index) => <li key={label} data-state={index < active ? "done" : index === active ? "active" : "pending"}><span aria-hidden="true">{index < active ? "✓" : index + 1}</span>{label}</li>)}</ol>
      <div className="ac-customer-records-loading-detail">{progress.bytes > 0 ? `${(progress.bytes / 1024 / 1024).toFixed(1)} MB received (uncompressed)` : "All records • All columns • No row limit"}</div>
      {seconds >= 10 && <div className="ac-customer-records-loading-detail">Still working. The table will appear automatically when ready.</div>}
    </div>
  </div>;
}
