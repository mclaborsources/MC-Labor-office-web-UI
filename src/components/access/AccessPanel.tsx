import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface AccessPanelProps {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Optional right-aligned content in the header (e.g. small buttons) */
  headerRight?: ReactNode;
}

/** Light-gray bordered Access panel with an optional section header. */
export function AccessPanel({
  title,
  icon,
  children,
  className = "",
  bodyClassName = "",
  headerRight,
}: AccessPanelProps) {
  return (
    <section className={`ac-panel ${className}`}>
      {title && (
        <div className="ac-panel-head">
          {icon && <Icon icon={icon} size="xs" className="text-[#5a6c82]" />}
          <span>{title}</span>
          {headerRight && <span className="ml-auto flex items-center gap-1">{headerRight}</span>}
        </div>
      )}
      <div className={`p-2 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
