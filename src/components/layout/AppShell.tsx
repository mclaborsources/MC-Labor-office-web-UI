import type { ReactNode } from "react";
import { User } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

interface AppShellProps {
  children: ReactNode;
  userDisplayName?: string;
}

export function AppShell({ children, userDisplayName }: AppShellProps) {
  return (
    <div className="ac-screen ac-desktop min-h-screen text-[#1b1b1b]">
      {/* Title band */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[#5a2f33] bg-[#7a3338] px-3 py-1.5 text-white">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" variant="on-dark" />
          <span className="text-sm font-semibold tracking-tight">MC Labor Sources</span>
          <span className="text-xs text-white/70">Office Portal · Read-only</span>
        </div>
        {userDisplayName && (
          <span className="flex items-center gap-1.5 text-xs text-white/90">
            <Icon icon={User} size="xs" className="text-white/70" />
            {userDisplayName}
          </span>
        )}
      </header>

      <TopNav />

      <main className="mx-auto max-w-[1680px] px-2 py-2 sm:px-3">{children}</main>
    </div>
  );
}
