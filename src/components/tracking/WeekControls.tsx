import type { WeekContext } from "@/types/tracking";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface WeekControlsProps {
  week: WeekContext;
}

export function WeekControls({ week }: WeekControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 p-3.5 text-sm ring-1 ring-slate-200/60">
        <span className="flex items-center gap-1.5 text-slate-500">
          <Icon icon={CalendarDays} size="xs" />
          Week ending
        </span>
        <span className="font-semibold text-slate-900">{week.displayDate}</span>
        <span className="text-slate-500">Week #</span>
        <span className="font-semibold text-slate-900">{week.assignWeek}</span>
        <span className="text-slate-500">Year</span>
        <span className="font-semibold text-slate-900">{week.assignYear}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="toolbar" disabled className="flex-1 sm:flex-none">
          <Icon icon={ChevronLeft} size="sm" />
          Last Week
        </Button>
        <Button variant="primary" disabled className="flex-1 sm:flex-none opacity-60">
          <Icon icon={CalendarDays} size="sm" />
          This Week
        </Button>
        <Button variant="toolbar" disabled className="flex-1 sm:flex-none">
          Next Week
          <Icon icon={ChevronRight} size="sm" />
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-500 leading-relaxed">
        <Icon icon={CalendarDays} size="xs" className="text-slate-400" />
        Work week: Sat {week.weekStartDate} — Fri {week.weekEndingDate}
      </p>
    </div>
  );
}
