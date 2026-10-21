"use client";

import { AccessReferenceMenu } from "./AccessReferenceMenu";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DashboardRichText } from "@/components/dashboard/DashboardRichText";
import type { CompanyPolicyRow, DashboardSettings } from "@/lib/dashboard";
import { dashboardViewLabel, parseDashboardView, type DashboardViewId } from "@/lib/dashboardViews";
import type { WeekContext } from "@/types/tracking";

interface DashboardMenuInteractiveProps {
  week: WeekContext;
  activeView: DashboardViewId;
  settings: DashboardSettings;
  policies: CompanyPolicyRow[];
  canWrite: boolean;
  today: string;
  serverLabel: string;
  resourceSizeMb: number;
}

type SettingsTab = "policies" | "notes";
type SqlCheckState = { status: "idle" | "checking" | "connected" | "disconnected"; message: string };

export function DashboardMenuInteractive({ week, activeView: initialView, settings, policies, canWrite, today, serverLabel, resourceSizeMb }: DashboardMenuInteractiveProps) {
  const searchParams = useSearchParams();
  const activeView = searchParams ? parseDashboardView(searchParams.get("view") ?? undefined) : initialView;
  const activePolicy = policies.find((policy) => policy.companyPolicy === dashboardViewLabel(activeView)) ?? null;
  const [, setPdfUnavailable] = useState(!settings.rootFolder.trim());
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
    <AccessReferenceMenu activeView={activeView} policy={activePolicy?.companyPolicyText ?? ""} notes={settings.companyHistoryNotes} trackingHref={trackingHref}
      today={today} serverLabel={sqlCheck.status === "idle" ? serverLabel : sqlCheck.message} resourceSizeMb={resourceSizeMb}
      onPolicies={openPolicies} onNotes={openNotes} onPdf={openPdfMap} onSql={checkSqlConnection}>
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
    </AccessReferenceMenu>
  );
}
