import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = SearchX,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
        <Icon icon={icon} size="lg" className="text-slate-400" />
      </div>
      <p className="text-base font-medium text-slate-700">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
