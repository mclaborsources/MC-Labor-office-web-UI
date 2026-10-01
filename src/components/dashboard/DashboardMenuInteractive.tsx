"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { DashboardRichText } from "@/components/dashboard/DashboardRichText";
import type { CompanyPolicyRow, DashboardSettings } from "@/lib/dashboard";
import {
  PDF_MAP_RELATIVE_PATH,
  ZIP_CODE_1_URL,
  ZIP_CODE_2_URL,
} from "@/lib/dashboardConstants";
import {
  DASHBOARD_VIEW_IDS,
  dashboardViewLabel,
  type DashboardViewId,
} from "@/lib/dashboardViews";
import type { WeekContext } from "@/types/tracking";

interface DashboardMenuInteractiveProps {
  week: WeekContext;
  activeView: DashboardViewId;
  settings: DashboardSettings;
  policies: CompanyPolicyRow[];
  activePolicy: CompanyPolicyRow | null;
}

const workspaces = [
  {
    title: "Tracking",
    description: "Review this week’s assignments and staffing status.",
    links: [
      { label: "Open this week", href: "tracking-week" },
      { label: "Search tracking", href: "/tracking-search" },
      { label: "Current jobs", href: "/current-jobs" },
    ],
  },
  {
    title: "Customers",
    description: "Find customer records, contacts, and permits.",
    href: "/customer-menu",
    links: [
      { label: "Customer menu", href: "/customer-menu" },
      { label: "Search customers", href: "/customers" },
      { label: "Customer permits", href: "/customer-permits" },
    ],
  },
  {
    title: "Employees",
    description: "Search employee records and applications.",
    href: "/employees",
    links: [
      { label: "Search employees", href: "/employees" },
      { label: "Employee application", href: "/employee-application" },
      { label: "Quick search", href: "/employee-quick-search" },
    ],
  },
  {
    title: "Jobs",
    description: "Browse job orders and current openings.",
    href: "/jobs",
    links: [
      { label: "Search jobs", href: "/jobs" },
      { label: "Current jobs", href: "/current-jobs" },
      { label: "Job orders report", href: "/job-orders-report" },
    ],
  },
  {
    title: "Reports",
    description: "Open operational, payroll, and customer reports.",
    href: "/reports",
    links: [
      { label: "All reports", href: "/reports" },
      { label: "Open invoices", href: "/open-invoices" },
      { label: "Manpower report", href: "/manpower-report" },
    ],
  },
  {
    title: "Office tools",
    description: "Notes, contacts, and office references.",
    href: "/office-staff-notes",
    links: [
      { label: "Staff notes", href: "/office-staff-notes" },
      { label: "All contacts", href: "/all-contacts-search" },
      { label: "Email addresses", href: "/email-addresses" },
    ],
  },
];

export function DashboardMenuInteractive({
  week,
  activeView,
  settings,
  policies,
  activePolicy,
}: DashboardMenuInteractiveProps) {
  const [showPolicy, setShowPolicy] = useState(false);
  const trackingHref = `/tracking?week=${week.assignWeek}&year=${week.assignYear}`;

  const openPdfMap = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/pdf-map");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { hint?: string } | null;
        window.alert(body?.hint ?? "Work Area PDF is not available on this server.");
        return;
      }
      window.open("/api/dashboard/pdf-map", "_blank", "noopener,noreferrer");
    } catch {
      window.alert("Could not open Work Area PDF.");
    }
  }, []);

  return (
    <main className="ac-main-menu ac-main-menu--modern ac-main-menu-simple">
      <section className="ac-dashboard-welcome" aria-labelledby="dashboard-title">
        <div>
          <p className="ac-dashboard-eyebrow">Main menu</p>
          <h1 id="dashboard-title">{settings.companyApplicationTitle}</h1>
          <p>Choose a work area to get started.</p>
        </div>
        <div className="ac-dashboard-week-actions" aria-label="Tracking week shortcuts">
          <Link href="/tracking?weekOffset=-1">Last week</Link>
          <Link href={trackingHref} aria-current="page">This week</Link>
          <Link href="/tracking?weekOffset=1">Next week</Link>
        </div>
      </section>

      <section className="ac-dashboard-workspaces" aria-label="Work areas">
        {workspaces.map((workspace) => (
          <article className="ac-dashboard-workspace" key={workspace.title}>
            <div className="ac-dashboard-workspace-heading">
              <h2>{workspace.title}</h2>
              <p>{workspace.description}</p>
            </div>
            <div className="ac-dashboard-workspace-links">
              {workspace.links.map((link) => (
                <Link key={link.href} href={link.href === "tracking-week" ? trackingHref : link.href}>{link.label}<span aria-hidden="true">→</span></Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="ac-dashboard-quick-tools" aria-label="Quick tools">
        <div>
          <h2>Quick tools</h2>
          <p>Maps and company guidance</p>
        </div>
        <div className="ac-dashboard-tool-links">
          <button type="button" onClick={openPdfMap} title={PDF_MAP_RELATIVE_PATH}>Work area map (PDF)</button>
          <a href={ZIP_CODE_1_URL} target="_blank" rel="noreferrer">Local zip map <span aria-hidden="true">↗</span></a>
          <a href={ZIP_CODE_2_URL} target="_blank" rel="noreferrer">Zip code lookup <span aria-hidden="true">↗</span></a>
          <button type="button" onClick={() => setShowPolicy((shown) => !shown)} aria-expanded={showPolicy}>
            {showPolicy ? "Hide company policy" : "View company policy"}
          </button>
          <Link href="/admin/connection">Settings</Link>
        </div>
      </section>

      {showPolicy && (
        <section className="ac-dashboard-policy" aria-label="Company policy">
          <div className="ac-dashboard-policy-heading">
            <div>
              <h2>Company policy</h2>
              <p>{dashboardViewLabel(activeView)}{policies.length ? ` · ${policies.length} views available` : ""}</p>
            </div>
            <select
              aria-label="Policy view"
              value={activeView}
              onChange={(event) => { window.location.href = `/dashboard?view=${event.target.value}`; }}
            >
              {DASHBOARD_VIEW_IDS.map((id) => <option key={id} value={id}>{dashboardViewLabel(id)}</option>)}
            </select>
          </div>
          <DashboardRichText
            html={activePolicy?.companyPolicyText ?? ""}
            emptyMessage={`No policy text configured for ${dashboardViewLabel(activeView)}.`}
          />
        </section>
      )}

      <footer className="ac-dashboard-footer">
        <Image src="/logo_dashboard.png" alt="" width={44} height={32} />
        <span>{settings.companyApplicationTitle}</span>
        <span className="ac-dashboard-version">Version 5.42.2</span>
      </footer>
    </main>
  );
}
