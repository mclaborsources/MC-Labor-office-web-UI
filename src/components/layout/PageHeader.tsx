import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}

export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="ac-page-header">
      <div className="flex min-w-0 items-center gap-2">
        {icon && <Icon icon={icon} size="xs" className="shrink-0 text-[#64748b]" />}
        <h1>{title}</h1>
        {subtitle && <span className="ac-page-header-sub">{subtitle}</span>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
