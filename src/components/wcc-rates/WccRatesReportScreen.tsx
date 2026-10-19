"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { AccessButton } from "@/components/access/AccessButton";

interface WccReportRow {
  WCC: string;
  Description: string;
  State: string;
  TrackingWccRate: number | string | null;
}

export function WccRatesReportScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<WccReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/reports/wcc-rates-print", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { ok?: boolean; rows?: WccReportRow[]; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load the WCC rates report.");
        if (active) setRows(result.rows ?? []);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load the WCC rates report."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const split = useMemo(() => Math.ceil(rows.length / 2), [rows.length]);
  const leftRows = rows.slice(0, split);
  const rightRows = rows.slice(split);

  function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
      WCC: row.WCC,
      Desc: row.Description,
      State: row.State,
      "Tracking Wcc Rate": row.TrackingWccRate,
    })));
    worksheet["!cols"] = [{ wch: 8 }, { wch: 34 }, { wch: 8 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WCC Rates");
    XLSX.writeFile(workbook, "wcc-rates-report.xlsx");
  }

  return <section className="wcc-print-report">
    <header className="wcc-print-toolbar">
      <h1>WCC Rates Report</h1>
      <span>{loading ? "Loading report..." : `${rows.length.toLocaleString()} rows`}</span>
      <AccessButton data-action-status="complete" onClick={downloadExcel} disabled={!rows.length}>Download Excel</AccessButton>
      <AccessButton data-action-status="complete" onClick={() => window.print()} disabled={!rows.length}>Print / Save PDF</AccessButton>
      <AccessButton data-action-status="linked" onClick={() => router.push("/reports")}>Close</AccessButton>
    </header>
    {error && <p role="alert" className="wcc-print-error">{error}</p>}
    <div className="wcc-print-page-wrap">
      <article className="wcc-print-page">
        <table className="wcc-print-grid">
          <colgroup>{[8,23,7,12,8,23,7,12].map((width,index)=><col key={index} style={{width:`${width}%`}}/>)}</colgroup>
          <thead><tr>{Array.from({length:2},(_,pair)=><Fragment key={pair}><th>WCC</th><th>Desc</th><th>State</th><th>Tracking<br/>Wcc Rate</th></Fragment>)}</tr></thead>
          <tbody>{leftRows.map((left,index)=>{
            const right=rightRows[index];
            return <tr key={`${left.WCC}-${left.State}-${index}`}>
              <td>{left.WCC}</td><td>{left.Description}</td><td>{left.State}</td><td>{left.TrackingWccRate ?? ""}</td>
              <td>{right?.WCC ?? ""}</td><td>{right?.Description ?? ""}</td><td>{right?.State ?? ""}</td><td>{right?.TrackingWccRate ?? ""}</td>
            </tr>;
          })}</tbody>
        </table>
        {!loading && !error && !rows.length && <p>No WCC tracking rows were found.</p>}
      </article>
    </div>
  </section>;
}
