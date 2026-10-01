"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { AllContactRow } from "@/types/allContacts";

export function NewsletterSearchScreen({ rows, error = "" }: { rows: AllContactRow[]; error?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const visible = useMemo(() => rows.filter((row) =>
    (!name || `${row.firstName} ${row.lastName} ${row.customerName} ${row.employeeName}`.toLowerCase().includes(name.toLowerCase())) &&
    (!email || row.email.toLowerCase().includes(email.toLowerCase())) && Boolean(row.email),
  ), [rows, name, email]);
  return <section className="ac-newsletter">
    <header><h1>Newsletter Contacts</h1><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => { setName(""); setEmail(""); }}>Clear</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    <div className="newsletter-tools"><label>Name or company<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label></div>
    <p className="report-data-note">Live customer and employee contact records with email addresses. Newsletter subscription and sent-history fields are not available in the confirmed data source.</p>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="newsletter-grid-wrap"><table className="legacy-report-grid newsletter-grid"><thead><tr><th>Source</th><th>Contact</th><th>Customer / Employee</th><th>Email</th><th>No Communication</th></tr></thead><tbody>
      {visible.map((row) => <tr key={row.id}><td>{row.profileType}</td><td>{`${row.firstName} ${row.lastName}`.trim()}</td><td>{row.customerName || row.employeeName}</td><td>{row.email}</td><td>{row.noCommunication ? "Yes" : ""}</td></tr>)}
      {!visible.length && <tr><td colSpan={5}>{error ? "Contact records are unavailable." : "No email contacts match the filters."}</td></tr>}
    </tbody></table></div><footer>{visible.length} email contacts</footer>
  </section>;
}
