"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessButton } from "@/components/access/AccessButton";
import type { AllContactRow } from "@/types/allContacts";

export function PhoneNumberSearchScreen({ rows, error = "" }: { rows: AllContactRow[]; error?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const visible = useMemo(() => rows.filter((row) => {
    const numbers = [row.cell1, row.cell2, row.cell3, row.cell4].filter(Boolean);
    return numbers.length > 0 && (!phone || numbers.join(" ").replace(/\D/g, "").includes(phone.replace(/\D/g, "")));
  }), [rows, phone]);
  return <section className="ac-phone-search">
    <header><h1>Phone Number Search</h1><AccessButton onClick={() => router.refresh()}>Refresh</AccessButton><AccessButton onClick={() => setPhone("")}>Clear</AccessButton><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton></header>
    <div className="ac-phone-search-tools"><label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label></div>
    {error && <p role="alert" className="report-data-error">{error}</p>}
    <div className="ac-phone-search-grid-wrap"><table className="ac-phone-search-grid"><thead><tr><th>Contact</th><th>Customer / Employee</th><th>Type</th><th>Phone</th><th>Email</th></tr></thead><tbody>
      {visible.map((row) => <tr key={row.id}><td>{`${row.firstName} ${row.lastName}`.trim()}</td><td>{row.customerName || row.employeeName}</td><td>{row.profileType}</td><td>{[row.cell1,row.cell2,row.cell3,row.cell4].filter(Boolean).join(" · ")}</td><td>{row.email}</td></tr>)}
      {!visible.length && <tr><td colSpan={5}>{error ? "Contact phone records are unavailable." : "No contact phone numbers match the search."}</td></tr>}
    </tbody></table></div><footer>{visible.length} contacts</footer>
  </section>;
}
