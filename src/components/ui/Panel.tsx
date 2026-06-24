import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface PanelProps {
  children: ReactNode;
  title?: string;
  titleIcon?: LucideIcon;
  className?: string;
  padding?: "sm" | "md";
  variant?: "glass" | "solid";
}

export function Panel({
  children,
  title,
  titleIcon,
  className = "",
  padding = "md",
  variant = "glass",
}: PanelProps) {
  const pad = padding === "sm" ? "p-3" : "p-4";
  const variantClass = variant === "solid" ? "mc-panel-solid" : "";

  return (
    <section className={`mc-panel ${variantClass} ${pad} ${className}`}>
      {title && (
        <h3 className="mc-section-title flex items-center gap-2">
          {titleIcon && (
            <Icon icon={titleIcon} size="xs" className="text-slate-400" />
          )}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
