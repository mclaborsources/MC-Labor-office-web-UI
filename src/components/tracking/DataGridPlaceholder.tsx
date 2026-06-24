import { Info } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

const COLUMNS = [
  "Job / Site",
  "First Name",
  "Last Name",
  "City",
  "Cell #",
  "Sat",
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Pay Rate",
  "Bill Rate",
  "Bill OT",
  "Notes",
  "Assigned",
];

export function DataGridPlaceholder() {
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
            {Array.from({ length: 10 }).map((_, row) => (
              <tr
                key={row}
                className={`border-b border-slate-100/80 transition-colors duration-150 ease-out ${
                  row % 2 === 0 ? "bg-white/60" : "bg-slate-50/50"
                } hover:bg-blue-50/60`}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2.5 text-slate-400 border-r border-slate-100/80 text-sm whitespace-nowrap last:border-r-0"
                  >
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
        Assignment data loads in Milestone 4. Layout preview only.
      </div>
    </div>
  );
}
