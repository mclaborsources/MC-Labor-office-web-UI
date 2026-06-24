import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface SearchBoxProps {
  label?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
}

export function SearchBox({
  label,
  placeholder = "Search…",
  value,
  disabled = false,
  className = "",
  icon = Search,
}: SearchBoxProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="mc-label">{label}</label>}
      <div className="relative">
        <Icon
          icon={icon}
          size="sm"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          readOnly={disabled}
          className="mc-input mc-input-icon-left min-w-[140px] w-full"
        />
      </div>
    </div>
  );
}
