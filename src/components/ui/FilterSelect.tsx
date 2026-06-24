import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label?: string;
  options?: FilterSelectOption[];
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  icon?: LucideIcon;
}

export function FilterSelect({
  label,
  options = [],
  value,
  disabled = false,
  placeholder = "Select…",
  className = "",
  icon,
}: FilterSelectProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="mc-label">{label}</label>}
      <div className="relative">
        {icon && (
          <Icon
            icon={icon}
            size="sm"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}
        <select
          value={value}
          disabled={disabled}
          className={`mc-input mc-input-icon-right min-w-[160px] w-full cursor-pointer appearance-none ${
            icon ? "mc-input-icon-left" : ""
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Icon
          icon={ChevronDown}
          size="xs"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
