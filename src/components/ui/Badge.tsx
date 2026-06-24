import type { ReactNode } from "react";

type BadgeVariant = "primary" | "success" | "warning" | "muted";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  primary: "bg-blue-600/90 text-white shadow-sm shadow-blue-600/20 ring-1 ring-blue-500/30",
  success: "bg-emerald-600/90 text-white shadow-sm shadow-emerald-600/20 ring-1 ring-emerald-500/30",
  warning: "bg-amber-500/90 text-white shadow-sm shadow-amber-500/20 ring-1 ring-amber-400/30",
  muted: "bg-slate-200/80 text-slate-700 ring-1 ring-slate-300/50",
};

export function Badge({ children, variant = "muted", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-transform duration-200 hover:scale-105 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
