import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function DetailSection({ title, icon, children, className = "" }: DetailSectionProps) {
  return (
    <section className={`mc-panel p-5 ${className}`}>
      <h3 className="mc-section-title flex items-center gap-2 mb-4">
        {icon && <Icon icon={icon} size="xs" className="text-slate-400" />}
        {title}
      </h3>
      {children}
    </section>
  );
}
