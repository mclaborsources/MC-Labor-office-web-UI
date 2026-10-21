import type { ReactNode } from "react";
import { AppPageTabs } from "@/components/layout/AppPageTabs";
import { AccessWindowTabs, type WindowTab } from "@/components/access/AccessWindowTabs";
import { NavigationLoadingFeedback } from "@/components/layout/NavigationLoadingFeedback";

interface AppShellProps {
  children: ReactNode;
  userDisplayName?: string;
  /** Let page content stretch to fill the viewport below the nav. */
  fillViewport?: boolean;
  /** Remove max-width cap (tracking / dense grids). */
  fullWidth?: boolean;
  /** Remove content padding for dense Access-style pages. */
  compactHeader?: boolean;
  /** Use the compact Microsoft Access-style object tabs without the portal chrome. */
  legacyAccessFrame?: boolean;
  legacyAccessTabs?: WindowTab[];
}

export function AppShell({ children, fillViewport, fullWidth, compactHeader = false, legacyAccessFrame, legacyAccessTabs }: AppShellProps) {
  if (legacyAccessFrame) {
    return (
      <div className="ac-screen ac-desktop ac-legacy-access-frame flex h-dvh max-h-dvh flex-col overflow-hidden text-[#1b1b1b]">
        <NavigationLoadingFeedback />
        <AccessWindowTabs
          tabs={legacyAccessTabs ?? [
            { label: "Menu", href: "/dashboard" },
            { label: "Tracking", href: "/tracking" },
            { label: "Employee Search 3", active: true },
          ]}
        />
        <main className="flex min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div
      className={`ac-screen ac-desktop text-[#1b1b1b] ${
        fillViewport ? "flex h-dvh max-h-dvh flex-col overflow-hidden" : "min-h-screen"
      }`}
    >
      <NavigationLoadingFeedback />
      <AppPageTabs />

      <main
        className={`w-full ${compactHeader ? "p-0" : "px-2 py-2 sm:px-3 sm:py-3"} ${
          fullWidth ? "max-w-none" : "mx-auto max-w-[1680px]"
        } ${fillViewport ? "flex min-h-0 flex-1 flex-col overflow-hidden" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
