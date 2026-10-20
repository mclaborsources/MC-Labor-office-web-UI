"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AccessButton } from "@/components/access/AccessButton";
import { DashboardRichText } from "@/components/dashboard/DashboardRichText";
import type { CompanyPolicyRow, DashboardSettings } from "@/lib/dashboard";
import { PDF_MAP_RELATIVE_PATH, ZIP_CODE_1_URL, ZIP_CODE_2_URL } from "@/lib/dashboardConstants";
import { DASHBOARD_VIEW_IDS, dashboardViewLabel, parseDashboardView, type DashboardViewId } from "@/lib/dashboardViews";
import type { WeekContext } from "@/types/tracking";

interface DashboardMenuInteractiveProps {
  week: WeekContext;
  activeView: DashboardViewId;
  settings: DashboardSettings;
  policies: CompanyPolicyRow[];
  canWrite: boolean;
}

type SettingsTab = "policies" | "notes";
type SqlCheckState = { status: "idle" | "checking" | "connected" | "disconnected"; message: string };

export function DashboardMenuInteractive({ week, activeView: initialView, settings, policies, canWrite }: DashboardMenuInteractiveProps) {
  const searchParams = useSearchParams();
  const activeView = searchParams ? parseDashboardView(searchParams.get("view") ?? undefined) : initialView;
  const activePolicy = policies.find((policy) => policy.companyPolicy === dashboardViewLabel(activeView)) ?? null;
  const [pdfUnavailable, setPdfUnavailable] = useState(!settings.rootFolder.trim());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<SettingsTab>("policies");
  const [sqlCheck, setSqlCheck] = useState<SqlCheckState>({ status: "idle", message: "Not checked" });
  const [selectedPolicy, setSelectedPolicy] = useState(activePolicy?.companyPolicy ?? dashboardViewLabel(activeView));
  const trackingHref = `/tracking?week=${week.assignWeek}&year=${week.assignYear}`;

  const openPolicies = useCallback(() => {
    setSelectedPolicy(activePolicy?.companyPolicy ?? dashboardViewLabel(activeView));
    setDialogTab("policies");
    setDialogOpen(true);
  }, [activePolicy, activeView]);
  const openNotes = useCallback(() => {
    setDialogTab("notes");
    setDialogOpen(true);
  }, []);
  const openPdfMap = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/pdf-map");
      if (!res.ok) {
        setPdfUnavailable(true);
        const body = (await res.json().catch(() => null)) as { hint?: string } | null;
        window.alert(body?.hint ?? "Work Area PDF is not available on this server. Check SettingsBE RootFolder.");
        return;
      }
      setPdfUnavailable(false);
      window.open("/api/dashboard/pdf-map", "_blank", "noopener,noreferrer");
    } catch {
      setPdfUnavailable(true);
      window.alert("Could not open Work Area PDF.");
    }
  }, []);
  const openZip = useCallback((url: string) => window.open(url, "_blank", "noopener,noreferrer"), []);
  const checkSqlConnection = useCallback(async () => {
    setSqlCheck({ status: "checking", message: "Checking SQL Server…" });
    try {
      const response = await fetch("/api/health/db", { cache: "no-store" });
      const result = await response.json() as { ok?: boolean; database?: string; error?: string };
      if (!response.ok || !result.ok) {
        setSqlCheck({ status: "disconnected", message: result.error || "SQL Server is not connected." });
        return;
      }
      setSqlCheck({ status: "connected", message: `Connected · ${result.database || "SQL Server"}` });
    } catch {
      setSqlCheck({ status: "disconnected", message: "Could not reach the connection check." });
    }
  }, []);
  const selectedPolicyRow = policies.find((policy) => policy.companyPolicy === selectedPolicy) ?? null;

  return (
    <div className="ac-main-menu ac-main-menu--modern">
      <p className="ac-dashboard-action-legend"><span className="is-missing">Red: no action</span><span className="is-linked">Green: linked or partially implemented</span><span>Neutral: complete action</span></p>
      <div className="ac-main-menu-views" aria-label="Company policy views">
        {DASHBOARD_VIEW_IDS.map((id) => {
          const active = id === activeView;
          return (
              <AccessButton data-action-status="complete" key={id} aria-current={active ? "page" : undefined} aria-pressed={active} className={active ? "ac-main-menu-view-btn-active" : ""} variant={active ? "go" : "default"} onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("view", id);
                if (url.href !== window.location.href) window.history.pushState(null, "", url);
              }}>
                {dashboardViewLabel(id)}
              </AccessButton>
          );
        })}
      </div>

      <div className="ac-main-menu-grid">
        <section className="ac-main-menu-panel">
          <div className="ac-main-menu-panel-head">
            <span>Company Policy · {dashboardViewLabel(activeView)}</span>
            <AccessButton data-action-status="complete" xs type="button" onClick={openPolicies}>View Policies</AccessButton>
          </div>
          <div className="ac-main-menu-panel-body ac-main-menu-policy-scroll">
            <DashboardRichText html={activePolicy?.companyPolicyText ?? ""} emptyMessage={`No policy text configured for ${dashboardViewLabel(activeView)}.`} />
          </div>
        </section>

        <section className="ac-main-menu-panel ac-main-menu-center">
          <div className="ac-main-menu-panel-head"><span>Work Area</span></div>
          <div className="ac-main-menu-panel-body ac-main-menu-work">
            <div className="ac-main-menu-toolbar">
              <Link href="/customers/name-search"><AccessButton data-action-status="linked" type="button">Customer Name Search</AccessButton></Link>
              <AccessButton data-action-status={pdfUnavailable ? "partial" : "complete"} type="button" onClick={openPdfMap} title={`${pdfUnavailable ? "Unavailable — check PDF configuration. " : ""}${PDF_MAP_RELATIVE_PATH}`}>PDF Map</AccessButton>
              <AccessButton data-action-status="linked" type="button" onClick={() => openZip(ZIP_CODE_1_URL)}>Zip Code 1</AccessButton>
              <AccessButton data-action-status="linked" type="button" onClick={() => openZip(ZIP_CODE_2_URL)}>Zip Code 2</AccessButton>
              <div className={`ac-main-menu-sql-check is-${sqlCheck.status}`}>
                <AccessButton data-action-status="partial" type="button" onClick={checkSqlConnection} disabled={sqlCheck.status === "checking"} aria-label="Check SQL Server connection">
                  {sqlCheck.status === "checking" ? "Checking…" : "Check SQL Connection"}
                </AccessButton>
                <span role="status" aria-live="polite">{sqlCheck.message}</span>
              </div>
            </div>
            <div className="ac-main-menu-hero">
              <div className="ac-main-menu-logo-wrap">
                <Image src="/logo_dashboard.png" alt={settings.companyApplicationTitle} width={480} height={300} className="ac-main-menu-logo" priority />
              </div>
              <div className="ac-main-menu-brand">
                <p className="ac-main-menu-brand-name">{settings.companyApplicationTitle}</p>
                <span className="ac-main-menu-version">v5.42.2</span>
              </div>
            </div>
            <div className="ac-main-menu-bottom">
              <nav className="ac-main-menu-week-nav" aria-label="Tracking week">
                <Link href="/tracking?weekOffset=-1" className="ac-main-menu-week-link"><AccessButton data-action-status="linked">Last Week</AccessButton></Link>
                <Link href={trackingHref} className="ac-main-menu-week-link" aria-current="page"><AccessButton data-action-status="linked" variant="go">This Week</AccessButton></Link>
                <Link href="/tracking?weekOffset=1" className="ac-main-menu-week-link"><AccessButton data-action-status="linked">Next Week</AccessButton></Link>
              </nav>
              <p className="ac-main-menu-server">Work Area</p>
            </div>
          </div>
        </section>

        <section className="ac-main-menu-panel">
          <div className="ac-main-menu-panel-head">
            <span>{settings.companyApplicationTitle}</span>
            <AccessButton data-action-status="complete" xs type="button" onClick={openNotes}>View Notes</AccessButton>
          </div>
          <div className="ac-main-menu-panel-body ac-main-menu-policy-scroll">
            <DashboardRichText html={settings.companyHistoryNotes} emptyMessage="No company history notes in SettingsBE." />
          </div>
        </section>
      </div>

      {dialogOpen && (
        <div className="ac-dash-dialog-backdrop" role="presentation" onClick={() => setDialogOpen(false)}>
          <div className="ac-dash-dialog" role="dialog" aria-modal="true" aria-labelledby="dash-settings-title" onClick={(event) => event.stopPropagation()}>
            <div className="ac-dash-dialog-head">
              <h2 id="dash-settings-title">Company Information</h2>
              <button data-action-status="complete" type="button" className="ac-dash-dialog-close" onClick={() => setDialogOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="ac-dash-dialog-tabs" role="tablist" aria-label="Company information">
              <button data-action-status="complete" type="button" role="tab" aria-selected={dialogTab === "policies"} className={dialogTab === "policies" ? "active" : ""} onClick={() => setDialogTab("policies")}>Company Policies</button>
              <button data-action-status="complete" type="button" role="tab" aria-selected={dialogTab === "notes"} className={dialogTab === "notes" ? "active" : ""} onClick={() => setDialogTab("notes")}>Company Notes</button>
            </div>
            {!canWrite && <p className="ac-dash-dialog-readonly">Read-only view. Editing is not available here.</p>}
            {dialogTab === "policies" ? (
              <div className="ac-dash-dialog-body">
                <label className="ac-dash-field-label" htmlFor="policy-select">Policy view</label>
                <select id="policy-select" className="ac-dash-select" value={selectedPolicy} onChange={(event) => setSelectedPolicy(event.target.value)}>
                  {policies.length === 0 ? <option value="">No policies in database</option> : policies.map((policy) => <option key={policy.companyPolicyId} value={policy.companyPolicy}>{policy.companyPolicy}</option>)}
                </select>
                <div className="ac-dash-dialog-preview"><DashboardRichText html={selectedPolicyRow?.companyPolicyText ?? ""} emptyMessage="No policy text for this view." /></div>
              </div>
            ) : (
              <div className="ac-dash-dialog-body"><div className="ac-dash-dialog-preview"><DashboardRichText html={settings.companyHistoryNotes} emptyMessage="No company history notes in SettingsBE." /></div></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
