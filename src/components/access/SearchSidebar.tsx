import Link from "next/link";
import { AccessButton } from "@/components/access/AccessButton";

interface SearchSidebarProps {
  entityLabel: string;
}

/** Compact search hint — primary search uses top filters (large screens only). */
export function SearchSidebar({ entityLabel }: SearchSidebarProps) {
  return (
    <aside className="ac-search-sidebar flex gap-2">
      <div className="ac-search-sidebar-label hidden xl:block">Search</div>
      <p className="text-[10px] leading-snug text-[#64748b]">
        Use filters above the grid to search {entityLabel.toLowerCase()} records.
      </p>
    </aside>
  );
}

export function SearchViewTabs({ labels }: { labels: string[] }) {
  return (
    <div className="ac-tabs overflow-x-auto rounded-t border border-b-0 border-[#e2e8f0] bg-[#f8fafc]">
      {labels.slice(0, 6).map((label, i) => (
        <button
          key={label}
          type="button"
          className={`ac-tab ${i === 0 ? "ac-tab-active" : ""}`}
          disabled={i !== 0}
          title={i !== 0 ? "Saved views — coming later" : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function SearchActionBar({ onClearHref }: { onClearHref: string }) {
  return (
    <div className="flex items-center justify-end gap-2 border border-t-0 border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5">
      <Link href={onClearHref}>
        <AccessButton xs>Clear filters</AccessButton>
      </Link>
    </div>
  );
}
