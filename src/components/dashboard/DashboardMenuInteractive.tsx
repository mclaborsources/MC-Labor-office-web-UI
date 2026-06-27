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

type SettingsTab = "policies" | "notes";

interface DashboardMenuInteractiveProps {
  week: WeekContext;
  activeView: DashboardViewId;
  settings: DashboardSettings;
  policies: CompanyPolicyRow[];
  activePolicy: CompanyPolicyRow | null;
  canWrite: boolean;
}

export function DashboardMenuInteractive({
  week,
  activeView,
  settings,
  policies,
  activePolicy,
  canWrite,
}: DashboardMenuInteractiveProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<SettingsTab>("policies");
  const [selectedPolicy, setSelectedPolicy] = useState(
    activePolicy?.companyPolicy ?? dashboardViewLabel(activeView),
  );

  const trackingHref = `/tracking?week=${week.assignWeek}&year=${week.assignYear}`;
  const lastWeekHref = `/tracking?weekOffset=-1`;
  const nextWeekHref = `/tracking?weekOffset=1`;

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
        const body = (await res.json().catch(() => null)) as { hint?: string } | null;
        window.alert(
          body?.hint ??
            "Work Area PDF is not available on this server. Check SettingsBE RootFolder.",
        );
        return;
      }
      window.open("/api/dashboard/pdf-map", "_blank", "noopener,noreferrer");
    } catch {
      window.alert("Could not open Work Area PDF.");
    }
  }, []);

  const openZip = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const selectedPolicyRow =
    policies.find((p) => p.companyPolicy === selectedPolicy) ?? null;

  return (
    <div className="ac-main-menu ac-main-menu--modern">
      <div className="ac-main-menu-views">
        {DASHBOARD_VIEW_IDS.map((id) => {
          const isActive = id === activeView;
          return (
            <Link key={id} href={`/dashboard?view=${id}`} className="ac-main-menu-view-link">
              <AccessButton
                className={isActive ? "ac-main-menu-view-btn-active" : ""}
                variant={isActive ? "go" : "default"}
              >
                {dashboardViewLabel(id)}
              </AccessButton>
            </Link>
          );
        })}
      </div>

      <div className="ac-main-menu-grid">
        <div className="ac-main-menu-panel">
          <div className="ac-main-menu-panel-head">
            <span>Company Policy</span>
            <AccessButton xs type="button" onClick={openPolicies}>
              Edit Policies
            </AccessButton>
          </div>
          <div className="ac-main-menu-panel-body ac-main-menu-policy-scroll">
            <DashboardRichText
              html={activePolicy?.companyPolicyText ?? ""}
              emptyMessage={`No policy text configured for ${dashboardViewLabel(activeView)} in tblCompanyPolicies.`}
            />
          </div>
        </div>

        <div className="ac-main-menu-panel ac-main-menu-center">
          <div className="ac-main-menu-panel-head">
            <span>Work Area</span>
          </div>
          <div className="ac-main-menu-panel-body ac-main-menu-work">
            <div className="ac-main-menu-toolbar">
              <AccessButton type="button" onClick={openPdfMap} title={PDF_MAP_RELATIVE_PATH}>
                PDF Map
              </AccessButton>
              <AccessButton type="button" onClick={() => openZip(ZIP_CODE_1_URL)}>
                Zip Code 1
              </AccessButton>
              <AccessButton type="button" onClick={() => openZip(ZIP_CODE_2_URL)}>
                Zip Code 2
              </AccessButton>
            </div>

            <div className="ac-main-menu-hero">
              <div className="ac-main-menu-logo-wrap">
                <Image
                  src="/logo_dashboard.png"
                  alt={settings.companyApplicationTitle}
                  width={480}
                  height={300}
                  className="ac-main-menu-logo"
                  priority
                />
              </div>
              <div className="ac-main-menu-brand">
                <p className="ac-main-menu-brand-name">{settings.companyApplicationTitle}</p>
                <span className="ac-main-menu-version">v5.42.2</span>
              </div>
            </div>

            <div className="ac-main-menu-bottom">
              <div className="ac-main-menu-week-nav">
                <Link href={lastWeekHref} className="ac-main-menu-week-link">
                  <AccessButton>Last Week</AccessButton>
                </Link>
                <Link href={trackingHref} className="ac-main-menu-week-link">
                  <AccessButton variant="go">This Week</AccessButton>
                </Link>
                <Link href={nextWeekHref} className="ac-main-menu-week-link">
                  <AccessButton>Next Week</AccessButton>
                </Link>
              </div>
              <p className="ac-main-menu-server">10.1.10.32\McLabor</p>
            </div>
          </div>
        </div>

        <div className="ac-main-menu-panel">
          <div className="ac-main-menu-panel-head">
            <span>{settings.companyApplicationTitle}</span>
            <AccessButton xs type="button" onClick={openNotes}>
              Edit Notes
            </AccessButton>
          </div>
          <div className="ac-main-menu-panel-body ac-main-menu-policy-scroll">
            <DashboardRichText
              html={settings.companyHistoryNotes}
              emptyMessage="No company history notes in SettingsBE."
            />
          </div>
        </div>
      </div>

      {dialogOpen && (
        <div
          className="ac-dash-dialog-backdrop"
          role="presentation"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="ac-dash-dialog"
            role="dialog"
            aria-labelledby="dash-settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ac-dash-dialog-head">
              <h2 id="dash-settings-title">Backend Settings</h2>
              <button
                type="button"
                className="ac-dash-dialog-close"
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="ac-dash-dialog-tabs">
              <button
                type="button"
                className={dialogTab === "policies" ? "active" : ""}
                onClick={() => setDialogTab("policies")}
              >
                Company Policies
              </button>
              <button
                type="button"
                className={dialogTab === "notes" ? "active" : ""}
                onClick={() => setDialogTab("notes")}
              >
                Company Notes
              </button>
            </div>

            {!canWrite && (
              <p className="ac-dash-dialog-readonly">
                Read-only — same as opening Access <code>frmSettingsBE</code>. Saving requires
                write approval.
              </p>
            )}

            {dialogTab === "policies" ? (
              <div className="ac-dash-dialog-body">
                <label className="ac-dash-field-label" htmlFor="policy-select">
                  Policy view
                </label>
                <select
                  id="policy-select"
                  className="ac-dash-select"
                  value={selectedPolicy}
                  onChange={(e) => setSelectedPolicy(e.target.value)}
                  disabled={!canWrite}
                >
                  {policies.length === 0 ? (
                    <option value="">No policies in database</option>
                  ) : (
                    policies.map((p) => (
                      <option key={p.companyPolicyId} value={p.companyPolicy}>
                        {p.companyPolicy}
                      </option>
                    ))
                  )}
                </select>
                <div className="ac-dash-dialog-preview">
                  <DashboardRichText
                    html={selectedPolicyRow?.companyPolicyText ?? ""}
                    emptyMessage="No policy text for this view."
                  />
                </div>
              </div>
            ) : (
              <div className="ac-dash-dialog-body">
                <div className="ac-dash-dialog-preview">
                  <DashboardRichText
                    html={settings.companyHistoryNotes}
                    emptyMessage="No company history notes in SettingsBE."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
