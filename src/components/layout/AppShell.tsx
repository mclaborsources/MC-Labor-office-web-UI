import type { ReactNode } from "react";
import { User } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

interface AppShellProps {
  children: ReactNode;
  userDisplayName?: string;
  /** Let page content stretch to fill the viewport below the nav. */
  fillViewport?: boolean;
  /** Remove max-width cap (tracking / dense grids). */
  fullWidth?: boolean;
}

export function AppShell({ children, userDisplayName, fillViewport, fullWidth }: AppShellProps) {
  return (
    <div
      className={`ac-screen ac-desktop text-[#1b1b1b] ${
        fillViewport ? "flex h-dvh max-h-dvh flex-col overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* Title band */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[#5a2f33]/80 bg-gradient-to-r from-[#7a3338] to-[#8b3a42] px-4 py-2 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="on-dark" />
          <div>
            <span className="text-sm font-semibold tracking-tight">MC Labor Sources</span>
            <span className="ml-2 text-[11px] font-normal text-white/75">Office Portal</span>
          </div>
        </div>
        {userDisplayName && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/95">
            <Icon icon={User} size="xs" className="text-white/70" />
            {userDisplayName}
          </span>
        )}
      </header>

      <TopNav />

      <main
        className={`w-full px-2 py-2 sm:px-3 sm:py-3 ${
          fullWidth ? "max-w-none" : "mx-auto max-w-[1680px]"
        } ${fillViewport ? "flex min-h-0 flex-1 flex-col overflow-hidden" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
