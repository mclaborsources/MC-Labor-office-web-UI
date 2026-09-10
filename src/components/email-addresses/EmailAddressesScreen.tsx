"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";

const ROWS = [
  ["Intelligent Design & Build, LLC","92 Sewall (Beltramn Inn)","Aguinaldo","Martins..","","6/12/2026","","","","",""],
  ["Sleeping Dog Properties Inc","Louisburg Sq","Alan","Alves..","","5/5/2023","","","","",""],
  ["Adzemen Demolition Inc.","Calare","Alerson","Silva Pascoal..","","6/9/2023","","","","",""],
  ["Electrical Design and Control Inc","Rye","Alex","Gobeil","","8/1/2025","","","","",""],
  ["Ithaka Contracting and Design","Cambridge","Alex","Maia..","","10/17/2025","","","","",""],
  ["Ahc Mechanical Contractors Inc","MIT","Alex","Morales","","7/24/2026","","","","",""],
  ["Agilitas Energy, Inc.","Auburn","Alex","Perlera..","","8/4/2023","","","","",""],
  ["Industrial Power Group, Inc.","Office","Alison","Mc Veigh","","7/24/2026","","","","",""],
  ["Piquette & Howard Electric Services Inc","Bake N Joy","Altin","Koci..","","7/24/2026","","","","",""],
  ["Lothrop Companies, Inc","018-26 THTFRMS","Amarildo","Ribeiro..","","4/17/2026","","","","",""],
  ["KW Management Inc.","Mission Hill","Andre","Chavez..","","7/24/2026","","","","",""],
  ["Supereon, LLC","US Army Natick Soldier Systems","Andre","Lauzier","","2/14/2025","","","","",""],
  ["All-State Power And Controls, Inc","Woburn Bowling","Andrew","Kosterman","","7/24/2026","","","","",""],
  ["Pro Star Energy LLC","Belfast","Andrew","Legere","","9/13/2024","","","","",""],
  ["Pro Star Energy LLC","Carver (Rochester Rd.)","Anthony","Hernandez..","","7/11/2025","","","","",""],
  ["Elm Electrical Inc","Easthampton PO#84825","Anthony","Paton","","12/2/2022","","","","",""],
  ["New England Clean Energy","S. Boston Solar Array removal","Arnaldo","Pinto..","","12/13/2024","","","","",""],
  ["S.E. & D. Inc (Street)","Wilmington","Arnaldo","Torres","","7/24/2026","","","","",""],
  ["Harrison Brown Construction, LLC","Cambridge PO#21147","Baba","Dembele..","","10/27/2023","","","","",""],
  ["Thomas J Kennedy Plumbing, Heating & H","Hyde Park","Benjamin","Rossetti","","7/17/2026","","","","",""],
  ["Intelligent Design & Build, LLC","267 Tappan St","Bernado","Santana..","","4/11/2025","","","","",""],
  ["North Shore Mechanical Contractors","Zealand Pharma","Brad","Barba","","7/24/2026","","","","",""],
  ["Mark Richey Woodworking & Design Inc","Mark Richey Warehouse","Brendon","Kerche..","","2/27/2026","","","","",""],
  ["Interstate Electrical ( Construction )","Symbotic Tech PO#182473","Brian","Lim","","7/24/2026","","","","",""],
] as const;

export function EmailAddressesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const rows = useMemo(() => ROWS.filter(row => !search || `${row[2]} ${row[3]}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const columns = ["", "Customer", "Job", "Em First Name", "Em Last Name", "Cell", "Week Ending", "S L C", "Payroll Co", "Email", "App Front Desk Note", "Assignment"];
  return <section className="ac-email-addresses">
    <header><h1>Email Addresses</h1><div><label>View:</label><select><option>01 Default Email Addresses</option></select><AccessButton>Save View</AccessButton><AccessButton>Delete View</AccessButton><label>Go To:</label><select><option /></select><AccessButton>Refresh</AccessButton></div><aside><AccessButton onClick={() => router.push("/tracking")}>Cancel</AccessButton><button aria-label="Help">?</button></aside></header>
    <div className="email-address-tools"><label>Search in Employee:<input value={search} onChange={event => setSearch(event.target.value)} /></label><div><span>Select:</span><AccessButton onClick={() => setSelected(new Set(rows.map((_, index) => index)))}>All</AccessButton></div></div>
    <div className="email-address-grid-wrap"><table className="legacy-report-grid email-address-grid"><thead><tr>{columns.map((column,index) => <th key={index}>{column}</th>)}</tr></thead><tbody>{rows.map((row,index) => <tr key={`${row[0]}-${row[1]}`} className={index === 0 ? "is-current" : undefined} onClick={() => setSelected(old => { const next = new Set(old); if (next.has(index)) next.delete(index); else next.add(index); return next; })}><td>{selected.has(index) ? "✓" : ""}</td>{row.map((value,column) => <td key={column}>{value}</td>)}</tr>)}</tbody></table></div>
  </section>;
}
