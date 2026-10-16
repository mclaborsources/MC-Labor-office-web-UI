"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { WebsiteAccessRow } from "@/lib/websiteAccess";

function safeWebsiteAddress(value: string) {
  const address = value.trim();
  if (!address) return "";
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(address) ? address : `https://${address}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

const columns = [24, 242, 145, 318, 155, 152, 300, 83, 98, 53, 50];

export function WebsiteAccessScreen({ rows, error }: { rows: WebsiteAccessRow[]; error?: string }) {
  const [message, setMessage] = useState("");

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`${label} copied.`); }
    catch { setMessage("Clipboard access is unavailable in this browser."); }
  }

  function showReadOnlyNotice() { setMessage("Adding and deleting website accounts is not available in this view."); }

  return <section className="website-access-screen">
    <header><h1>Website Access</h1><button aria-label="Help" title="Website login reference list">?</button></header>
    <div className="website-access-content">
      <aside className="website-access-actions" aria-label="Record actions">
        <button onClick={showReadOnlyNotice} aria-label="Add website access record" title="Add website access record">+</button>
        <button onClick={showReadOnlyNotice} aria-label="Delete website access record" title="Delete website access record">×</button>
      </aside>
      <div className="website-access-grid-wrap">
        <table className="website-access-grid">
          <colgroup>{columns.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
          <thead><tr><th className="wa-actions"/><th>Payroll Co on Site / Company</th><th>Website Name</th><th>Website Address</th><th>Website User</th><th>Password</th><th>Notes</th><th>Entry User</th><th>Entry Date</th><th>Active</th><th>Sort</th></tr></thead>
          <tbody>{rows.map((row, index) => {
            const href = safeWebsiteAddress(row.address);
            return <tr key={row.id} className={index === 0 ? "is-current" : undefined}>
              <td className="wa-actions"><span>{index === 0 ? "▸" : ""}</span></td>
              <td><input readOnly aria-label={`Company for ${row.websiteName}`} value={row.company}/></td>
              <td><input readOnly aria-label="Website name" value={row.websiteName}/></td>
              <td><div className="wa-address"><input readOnly aria-label="Website address" value={row.address}/>{href ? <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${row.websiteName}`} title="Open website">↗</a> : <span/>}</div></td>
              <td><div className="wa-copy"><input readOnly aria-label="Website user" value={row.username}/><button onClick={()=>void copy(row.username,"Username")} aria-label="Copy username" title="Copy username"><Copy size={15} strokeWidth={1.8}/></button></div></td>
              <td><div className="wa-copy"><input readOnly aria-label="Website password" value={row.password}/><button onClick={()=>void copy(row.password,"Password")} aria-label="Copy password" title="Copy password"><Copy size={15} strokeWidth={1.8}/></button></div></td>
              <td><input readOnly aria-label="Website notes" value={row.notes}/></td><td><input readOnly aria-label="Entry user" value={row.entryUser}/></td><td><input readOnly aria-label="Entry date" value={row.entryDate}/></td><td className="wa-check"><input type="checkbox" checked={row.active} readOnly aria-label={`Active ${row.websiteName}`}/></td><td><input readOnly aria-label="Sort order" value={row.sort}/></td>
            </tr>;
          })}{!rows.length&&<tr><td colSpan={11}>{error||"No website access records were found."}</td></tr>}</tbody>
        </table>
      </div>
    </div>
    <footer><span className="wa-screen-message" role="status">{message}</span></footer>
  </section>;
}
