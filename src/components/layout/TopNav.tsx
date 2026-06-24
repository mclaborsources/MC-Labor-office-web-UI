"use client";

import { ClipboardList, LayoutGrid, LogOut, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface TopNavProps {
  activeTab?: "menu" | "tracking" | "customer-menu";
}

const tabs: {
  id: "menu" | "tracking" | "customer-menu";
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "menu", label: "Menu", icon: LayoutGrid },
  { id: "tracking", label: "Tracking", icon: ClipboardList },
  { id: "customer-menu", label: "Customer Menu", icon: Users },
];

export function TopNav({ activeTab = "tracking" }: TopNavProps) {
  return (
    <nav
      className="border-b border-slate-200/70 bg-white/70 px-3 backdrop-blur-xl lg:px-6"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3 py-2.5">
        <div className="flex gap-0.5 rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/60">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.id !== "tracking";
            return (
              <button
                key={tab.id}
                type="button"
                disabled={isDisabled}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200/80 ring-1 ring-slate-200/80"
                    : "text-slate-400 cursor-not-allowed"
                }`}
              >
                <Icon
                  icon={tab.icon}
                  size="sm"
                  className={isActive ? "text-blue-600" : "text-slate-400"}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          className="text-slate-500 hover:bg-slate-100/80 hover:text-slate-800"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <Icon icon={LogOut} size="sm" />
          Log out
        </Button>
      </div>
    </nav>
  );
}
