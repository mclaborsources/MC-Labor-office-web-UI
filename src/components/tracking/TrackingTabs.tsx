"use client";

import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Gift,
  History,
  TableProperties,
} from "lucide-react";
import type { TrackingTabId } from "@/types/tracking";
import { Icon } from "@/components/ui/Icon";

const TABS: { id: TrackingTabId; label: string; icon: LucideIcon }[] = [
  { id: "tracking", label: "Tracking", icon: TableProperties },
  { id: "hours", label: "Hours", icon: Clock },
  { id: "hours2", label: "Hours 2", icon: Clock },
  { id: "benefits", label: "Benefits", icon: Gift },
  { id: "ts-history", label: "TS History", icon: History },
];

interface TrackingTabsProps {
  activeTab: TrackingTabId;
  onTabChange: (tab: TrackingTabId) => void;
}

export function TrackingTabs({ activeTab, onTabChange }: TrackingTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60"
      role="tablist"
      aria-label="Tracking views"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out ${
              isActive
                ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25"
                : "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            <Icon
              icon={tab.icon}
              size="sm"
              className={isActive ? "text-white/90" : "text-slate-400"}
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
