import type { ReactNode } from "react";
import { Building2, User } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

interface AppShellProps {
  children: ReactNode;
  userDisplayName?: string;
}

export function AppShell({ children, userDisplayName }: AppShellProps) {
  return (
    <div className="min-h-screen mc-app-bg text-slate-900">
      <header
        className="sticky top-0 z-40 border-b border-white/[0.08] bg-slate-950/90 text-white shadow-lg shadow-slate-950/20 backdrop-blur-xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Logo size="sm" variant="on-dark" />
            <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />
            <div>
              <p className="text-sm font-semibold leading-tight tracking-tight text-white">
                MC Labor
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Icon icon={Building2} size="xs" className="text-slate-500" />
                Office Portal
              </p>
            </div>
          </div>
          {userDisplayName && (
            <div className="flex items-center gap-2.5 text-sm">
              <span className="hidden sm:inline text-slate-400">Signed in as</span>
              <span
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-medium text-slate-100 shadow-inner shadow-white/5 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <Icon icon={User} size="xs" className="text-slate-400" />
                {userDisplayName}
              </span>
            </div>
          )}
        </div>
      </header>
      <TopNav activeTab="tracking" />
      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6 lg:py-6 mc-animate-in">
        {children}
      </main>
    </div>
  );
}
