"use client";

interface TabItem {
  id: string;
  label: string;
}

interface AccessTabsProps {
  tabs: TabItem[];
  className?: string;
  sticky?: boolean;
  activeId?: string;
  onTabChange?: (id: string) => void;
}

/**
 * Sticky section jump-nav for dense profile screens. Clicking a tab scrolls to
 * that section; all sections stay rendered (Access-style: nothing hidden).
 */
export function AccessTabs({ tabs, className = "", sticky = true, activeId, onTabChange }: AccessTabsProps) {
  return (
    <div
      className={`ac-tabs ${sticky ? "sticky top-0 z-20 shadow-sm" : ""} ${className}`.trim()}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`ac-tab ${activeId === t.id ? "ac-tab-active" : ""}`}
          onClick={() => {
            if (onTabChange) onTabChange(t.id);
            else document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
