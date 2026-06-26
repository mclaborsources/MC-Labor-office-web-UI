"use client";

interface TabItem {
  id: string;
  label: string;
}

interface AccessTabStripProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Rectangular Access-style in-screen tab strip (controlled). */
export function AccessTabStrip({ tabs, active, onChange, className = "" }: AccessTabStripProps) {
  return (
    <div className={`ac-tabs ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`ac-tab ${active === t.id ? "ac-tab-active" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
