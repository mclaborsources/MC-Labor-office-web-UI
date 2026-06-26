import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}

/** Compact Access-style screen caption bar. */
export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 border-b border-[#b6c2d0] pb-1.5">
      <div className="flex items-baseline gap-2">
        {icon && <Icon icon={icon} size="xs" className="text-[#5a6c82]" />}
        <h1 className="text-[15px] font-bold tracking-tight text-[#1f2d3d]">{title}</h1>
        {subtitle && <span className="text-[11px] text-[#6a6a6a]">— {subtitle}</span>}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}
