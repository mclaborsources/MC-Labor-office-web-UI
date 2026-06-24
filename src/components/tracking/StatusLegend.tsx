import { Info, Palette } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

const LEGEND_ITEMS = [
  { color: "bg-blue-500", label: "Full day" },
  { color: "bg-red-500", label: "No show" },
  { color: "bg-amber-400", label: "Partial / other" },
  { color: "bg-emerald-500", label: "Verified" },
  { color: "bg-slate-400", label: "Inactive" },
  { color: "bg-orange-500", label: "Alert" },
];

export function StatusLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-4 px-4 py-3 mc-panel"
      aria-label="Status legend"
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Icon icon={Palette} size="xs" />
        Status
      </span>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className={`h-3.5 w-3.5 rounded-md shadow-sm ring-1 ring-black/10 transition-transform duration-200 hover:scale-110 ${item.color}`}
          />
          <span className="text-xs font-medium text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
