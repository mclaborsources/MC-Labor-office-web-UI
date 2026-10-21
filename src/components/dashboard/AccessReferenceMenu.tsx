"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { DashboardRichText } from "./DashboardRichText";
import { DASHBOARD_VIEW_IDS, dashboardViewLabel, type DashboardViewId } from "@/lib/dashboardViews";
import { ZIP_CODE_1_URL, ZIP_CODE_2_URL } from "@/lib/dashboardConstants";

export function AccessReferenceMenu({ activeView, policy, notes, trackingHref, today, serverLabel, resourceSizeMb, onPolicies, onNotes, onPdf, onSql, children }: {
  activeView: DashboardViewId; policy: string; notes: string; trackingHref: string; today: string;
  serverLabel: string; resourceSizeMb: number; onPolicies: () => void; onNotes: () => void;
  onPdf: () => void; onSql: () => void; children?: ReactNode;
}) {
  const [arrows, setArrows] = useState(false);
  const [size, setSize] = useState("normal");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutDialog = useRef<HTMLDialogElement>(null);
  return <div className="ac-access-menu" data-screen-size={size}>
    <nav className="ac-access-menu-views" aria-label="Company policy views">
      {DASHBOARD_VIEW_IDS.map(id => <button key={id} type="button" className="ac-access-menu-button" aria-pressed={id === activeView} onClick={() => {
        const url = new URL(window.location.href); url.searchParams.set("view", id);
        if (url.href !== window.location.href) window.history.pushState(null, "", url);
      }}>{dashboardViewLabel(id)}</button>)}
    </nav>
    <div className="ac-access-menu-corner"><button type="button" onClick={onNotes} aria-label="Company information"><CircleHelp size={20} /></button></div>
    <section className="ac-access-menu-policy">
      <header><span>Company Policy</span><button className="ac-access-menu-button" onClick={onPolicies}>Edit Policies</button></header>
      <div className="ac-access-menu-document"><DashboardRichText html={policy} emptyMessage="No policy text configured for this view." /></div>
    </section>
    <section className="ac-access-menu-work" aria-label="Work Area">
      <header><strong>Work Area</strong><div>
        <button className="ac-access-menu-button" onClick={onPdf}>PDF Map</button>
        <button className="ac-access-menu-button" onClick={() => window.open(ZIP_CODE_1_URL, "_blank", "noopener,noreferrer")}>Zip Code 1</button>
        <button className="ac-access-menu-button" onClick={() => window.open(ZIP_CODE_2_URL, "_blank", "noopener,noreferrer")}>Zip Code 2</button>
      </div></header>
      <div className="ac-access-menu-work-canvas">
        <h1 className="ac-access-menu-company-name">Mc Labor Sources, Inc.</h1>
        <Image src="/logo_dashboard.png" alt="MC Labor eagle with American and Irish flags" width={525} height={258} priority className="ac-access-menu-eagle" />
        <div>Version 5.43.18<br /><span>June 2, 2014</span></div>
      </div>
      <div className="ac-access-menu-week-tools">
        <button className="ac-access-menu-button ac-access-menu-toggle" aria-pressed={arrows} onClick={() => setArrows(!arrows)}>Toggle Arrows</button>
        <div className="ac-access-menu-today"><strong>Today&apos;s Date</strong><br />{today}</div>
        <button className="ac-access-menu-button ac-access-menu-history" onClick={onNotes}>History</button>
        <nav aria-label="Tracking week"><Link className="ac-access-menu-button" href="/tracking?weekOffset=-1">{arrows ? "‹ " : ""}Last Week</Link><Link className="ac-access-menu-button" href={trackingHref}>This Week</Link><Link className="ac-access-menu-button" href="/tracking?weekOffset=1">Next Week{arrows ? " ›" : ""}</Link></nav>
      </div>
      <button className="ac-access-menu-server" onClick={onSql} title="Check SQL Server connection" aria-label="Check SQL Server connection">{serverLabel}</button>
    </section>
    <section className="ac-access-menu-notes">
      <header><span>Company History Notes</span><button className="ac-access-menu-button" onClick={onNotes}>Edit Notes</button></header>
      <div className="ac-access-menu-document"><DashboardRichText html={notes} emptyMessage="No company history notes configured." /></div>
    </section>
    <section className="ac-access-menu-shortcuts" aria-label="Search and utilities">
      <button type="button" className="ac-access-menu-button ac-access-menu-exit ac-access-menu-logout" disabled={loggingOut} onClick={() => {
        setLogoutError("");
        logoutDialog.current?.showModal();
      }}>Logout</button>
      <Link href="/customers" className="ac-access-menu-button">Customer Search</Link><Link href="/employees" className="ac-access-menu-button">Employee Search</Link>
      <Link href="/customer-search-1" className="ac-access-menu-button">Customer Search 1</Link><Link href="/customers/name-search" className="ac-access-menu-button">Customer Name Search</Link>
      <Link href="/employee-licenses" className="ac-access-menu-button">Licensed Employee Search</Link>
    </section>
    <div className="ac-access-menu-screen-controls"><span>Screen Size</span><button className="ac-access-menu-button" aria-pressed={size === "normal"} onClick={() => setSize("normal")}>Normal</button><div>{[1, 2, 3, 4].map(n => <div key={n}><button className="ac-access-menu-button" aria-pressed={size === String(n)} onClick={() => setSize(String(n))}>{n}</button></div>)}</div></div>
    <div className="ac-access-menu-resource"><div>Size MB<span>{resourceSizeMb}</span></div><div>Max<span>2000</span></div></div>
    <dialog ref={logoutDialog} className="ac-logout-dialog" aria-labelledby="logout-title" aria-describedby="logout-description" onCancel={event => { if (loggingOut) event.preventDefault(); }}>
      <header><h2 id="logout-title">Log out of MC Labor?</h2></header>
      <div className="ac-logout-dialog-body">
        <p id="logout-description">You will return to the login page. You can sign in again whenever you are ready.</p>
        {logoutError && <p className="ac-logout-dialog-error" role="alert">{logoutError}</p>}
      </div>
      <footer>
        <button type="button" className="ac-access-menu-button" disabled={loggingOut} onClick={() => logoutDialog.current?.close()}>Stay signed in</button>
        <button type="button" className="ac-access-menu-button ac-logout-dialog-confirm" disabled={loggingOut} onClick={async () => {
          setLoggingOut(true);
          setLogoutError("");
          try {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (!response.ok) throw new Error("Logout failed");
            window.location.replace("/login");
          } catch {
            setLoggingOut(false);
            setLogoutError("We couldn’t log you out. Please try again.");
          }
        }}>{loggingOut ? "Logging out…" : "Log out"}</button>
      </footer>
    </dialog>
    {children}
  </div>;
}
