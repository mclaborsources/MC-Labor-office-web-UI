import Link from "next/link";
import type { ResolvedTrackingWeek } from "@/lib/trackingWeek";
import type { WeekContext } from "@/types/tracking";
import { AccessButton } from "@/components/access/AccessButton";

interface WeekBannerProps {
  week: WeekContext | ResolvedTrackingWeek;
  fallback?: boolean;
  fallbackMessage?: string;
  showNav?: boolean;
}

export function WeekBanner({
  week,
  fallback,
  fallbackMessage,
  showNav = true,
}: WeekBannerProps) {
  const q = `week=${week.assignWeek}&year=${week.assignYear}`;
  const warn = fallback || fallbackMessage;

  return (
    <div className={`ac-week-banner ${warn ? "ac-week-banner-warn" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="ac-week-banner-label">Work week</span>
        <span className="font-mono font-semibold text-[#0f172a]">
          #{week.assignWeek}
        </span>
        <span className="text-[#64748b]">·</span>
        <span>{week.assignYear}</span>
        <span className="text-[#64748b]">·</span>
        <span>
          Sat {week.weekStartDate} – Fri {week.weekEndingDate}
        </span>
      </div>
      {warn && fallbackMessage && (
        <p className="mt-1 text-[11px] text-[#b45309]">{fallbackMessage}</p>
      )}
      {showNav && (
        <div className="ml-auto flex flex-wrap gap-1">
          <Link href={`?weekOffset=-1`}>
            <AccessButton xs>Last</AccessButton>
          </Link>
          <Link href={`?${q}`}>
            <AccessButton xs variant="go">
              This
            </AccessButton>
          </Link>
          <Link href={`?weekOffset=1`}>
            <AccessButton xs>Next</AccessButton>
          </Link>
        </div>
      )}
    </div>
  );
}
