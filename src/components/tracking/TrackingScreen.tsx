"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  Info,
  MapPin,
  Search,
  Settings,
  Shield,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { WeekContext, TrackingTabId } from "@/types/tracking";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Panel } from "@/components/ui/Panel";
import { SearchBox } from "@/components/ui/SearchBox";
import { Icon } from "@/components/ui/Icon";
import { WeekControls } from "@/components/tracking/WeekControls";
import { ActionButtonGroup } from "@/components/tracking/ActionButtonGroup";
import { TrackingTabs } from "@/components/tracking/TrackingTabs";
import { StatusLegend } from "@/components/tracking/StatusLegend";
import { DataGridPlaceholder } from "@/components/tracking/DataGridPlaceholder";

const RIBBON_ALERTS = [
  { label: "Health Ins", tone: "default" },
  { label: "Bonus Exp", tone: "default" },
  { label: "Job App Problems", tone: "warn" },
  { label: "Missing WC", tone: "warn" },
  { label: "Expired WC", tone: "warn" },
  { label: "Missing GL", tone: "warn" },
  { label: "Expired GL", tone: "warn" },
] as const;

const JOB_INFO_TABS = [
  "Job Info",
  "Co Contacts",
  "Employees",
  "Salesmen",
  "Bill Rates",
  "Schedule/Timesheet",
];

interface TrackingScreenProps {
  week: WeekContext;
}

export function TrackingScreen({ week }: TrackingScreenProps) {
  const [activeTab, setActiveTab] = useState<TrackingTabId>("tracking");
  const [jobInfoTab, setJobInfoTab] = useState("Job Info");

  return (
    <div className="flex flex-col gap-4">
      <Panel padding="sm" className="bg-white/40">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect placeholder="Search" disabled className="min-w-[120px]" icon={Search} />
          <FilterSelect placeholder="Admin" disabled icon={Shield} />
          <FilterSelect placeholder="Reports" disabled icon={FileText} />
          <div className="h-8 w-px bg-slate-200 hidden sm:block" aria-hidden />
          <div className="flex flex-wrap gap-1.5">
            {RIBBON_ALERTS.map((item) => (
              <Button
                key={item.label}
                variant="toolbar"
                disabled
                className={`text-xs ${item.tone === "warn" ? "text-amber-800 bg-amber-50 border-amber-200" : ""}`}
              >
                {item.tone === "warn" && (
                  <Icon icon={AlertTriangle} size="xs" className="text-amber-600" />
                )}
                {item.label}
              </Button>
            ))}
          </div>
          <Button variant="toolbar" disabled>
            <Icon icon={FileText} size="xs" />
            Job Application
          </Button>
          <Button
            variant="toolbar"
            disabled
            className="text-amber-900 bg-amber-50 border-amber-200 font-medium"
          >
            <Icon icon={BarChart3} size="xs" className="text-amber-700" />
            WCC Payroll / Sales Report
          </Button>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Assignment" titleIcon={Briefcase} className="xl:col-span-3 space-y-4">
          <WeekControls week={week} />
          <SearchBox label="Empl Quick Search" disabled placeholder="Coming in Milestone 2" />
          <FilterSelect
            label="Assigned customer"
            disabled
            placeholder="Hutter Construction Corpor…"
            icon={Building2}
          />
          <FilterSelect label="Assigned job" disabled placeholder="Select job…" icon={MapPin} />
          <ActionButtonGroup />
          <div className="flex flex-wrap gap-2">
            <Button variant="toolbar" disabled>
              <Icon icon={FileText} size="xs" />
              T Sheets HL
            </Button>
            <Button variant="toolbar" disabled>
              <Icon icon={FileText} size="xs" />
              View Invoice
            </Button>
            <Button variant="toolbar" disabled>
              <Icon icon={Search} size="xs" />
              Cell # Search
            </Button>
          </div>
          <Badge variant="primary">
            <Icon icon={MapPin} size="xs" className="text-white/90" />
            OnSite
          </Badge>
        </Panel>

        <Panel title="Job details" titleIcon={Briefcase} className="xl:col-span-5">
          <div className="flex flex-wrap gap-1 mb-4 rounded-xl bg-slate-100/70 p-1 ring-1 ring-slate-200/60">
            {JOB_INFO_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setJobInfoTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ease-out ${
                  jobInfoTab === tab
                    ? "bg-white text-blue-700 shadow-sm shadow-slate-200/80 ring-1 ring-slate-200/80"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {["Contract With", "Salesman", "Total Owed", "Credit History"].map(
              (label) => (
                <div key={label} className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/50 transition-colors hover:bg-slate-50">
                  <span className="text-xs font-medium text-slate-500">{label}</span>
                  <p className="mt-1 font-medium text-slate-300">—</p>
                </div>
              ),
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="toolbar" disabled>
              <Icon icon={FileText} size="xs" />
              Open Contract
            </Button>
            <Button variant="toolbar" disabled>Open W-9</Button>
            <Button variant="toolbar" disabled>Open WC</Button>
            <Button variant="toolbar" disabled>Open GL</Button>
          </div>
          <div className="relative mt-4">
            <Icon
              icon={StickyNote}
              size="sm"
              className="absolute left-3 top-3 text-slate-400 pointer-events-none"
            />
            <textarea
              readOnly
              disabled
              placeholder="Customer and job notes will appear here…"
              className="w-full h-24 resize-none rounded-xl border border-slate-200/70 bg-slate-50/80 pl-10 pr-3 py-2 text-sm text-slate-400 placeholder:text-slate-400 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </Panel>

        <Panel title="Totals & reports" titleIcon={BarChart3} className="xl:col-span-4">
          <div className="overflow-hidden rounded-xl border border-slate-200/70 mb-4 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-3 py-2 text-left text-xs font-semibold">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-3 text-slate-300">—</td>
                  <td className="px-3 py-3 text-slate-300">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <FilterSelect placeholder="Reports menu" disabled icon={FileText} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {["TIA", "CPM"].map((label) => (
              <div key={label} className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/50 transition-colors hover:bg-slate-50">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <p className="mt-1 text-slate-300">—</p>
              </div>
            ))}
          </div>
          <Button variant="toolbar" disabled className="mt-4">
            <Icon icon={Settings} size="xs" />
            Clear HL
          </Button>
        </Panel>
      </div>

      <Panel padding="sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TrackingTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex flex-wrap gap-2">
            <Button variant="toolbar" disabled>Hrs AutoText</Button>
            <Button variant="toolbar" disabled>Payroll Change</Button>
            <Button variant="toolbar" disabled>Customer Menu</Button>
            <Button variant="toolbar" disabled>History Update</Button>
            <Button variant="toolbar" disabled>Browse</Button>
            <Button variant="toolbar" disabled>Refresh All</Button>
            <Button variant="toolbar" disabled>Job</Button>
            <Button variant="toolbar" disabled>Emp</Button>
            <Button variant="danger" disabled>
              <Icon icon={Trash2} size="xs" />
              Delete
            </Button>
          </div>
        </div>
      </Panel>

      <StatusLegend />

      {activeTab !== "tracking" && (
        <Panel className="text-sm text-slate-500 text-center py-10 mc-animate-in">
          <Icon icon={Info} size="lg" className="mx-auto mb-3 text-slate-300" />
          <span className="font-medium text-slate-700">{activeTab}</span> view — available in a later milestone.
        </Panel>
      )}

      {activeTab === "tracking" && <DataGridPlaceholder />}
    </div>
  );
}
