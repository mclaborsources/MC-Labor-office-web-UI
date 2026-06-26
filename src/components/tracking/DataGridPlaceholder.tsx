import { Info } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { TrackingPreview } from "@/types/tracking";

const COLUMNS = [
  "Job / Site",
  "First Name",
  "Last Name",
  "City",
  "Cell #",
  "Week Ending",
  "Pay Rate",
  "Bill Rate",
];

interface DataGridPlaceholderProps {
  preview?: TrackingPreview;
}

export function DataGridPlaceholder({ preview }: DataGridPlaceholderProps) {
  const rows = preview?.rows ?? [];
  const hasData = rows.length > 0;

  return (
    <div className="mc-panel overflow-hidden flex-1 min-h-[360px] flex flex-col">
      <div className="overflow-x-auto flex-1 mc-scroll-smooth">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-sm">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-3 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-wider whitespace-nowrap border-r border-white/10 last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasData
              ? rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-100/80 transition-colors duration-150 ease-out ${
                      i % 2 === 0 ? "bg-white/60" : "bg-slate-50/50"
                    } hover:bg-blue-50/60`}
                  >
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-700 whitespace-nowrap">{r.jobSite || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-700 whitespace-nowrap">{r.firstName || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-700 whitespace-nowrap">{r.lastName || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">{r.city || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">{r.cell || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">{r.weekEnding || "—"}</td>
                    <td className="px-3 py-2 border-r border-slate-100/80 text-slate-600 whitespace-nowrap">{r.payRate || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.billRate || "—"}</td>
                  </tr>
                ))
              : Array.from({ length: 10 }).map((_, row) => (
                  <tr
                    key={row}
                    className={`border-b border-slate-100/80 ${row % 2 === 0 ? "bg-white/60" : "bg-slate-50/50"}`}
                  >
                    {COLUMNS.map((col) => (
                      <td key={col} className="px-3 py-2.5 text-slate-300 border-r border-slate-100/80 whitespace-nowrap last:border-r-0">
                        —
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-200/70 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 backdrop-blur-sm">
        <Icon icon={Info} size="xs" className="text-slate-400 shrink-0" />
        {hasData
          ? `Showing ${rows.length} recent assignment row(s) — read-only preview${preview?.source ? ` (source: ${preview.source})` : ""}. Full editable grid arrives in Milestone 4.`
          : "Assignment data preview — connect tblTracking / Portal_Assignment_Export. Full editable grid arrives in Milestone 4."}
      </div>
    </div>
  );
}
