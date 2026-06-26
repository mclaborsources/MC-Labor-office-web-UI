import Link from "next/link";

export interface WindowTab {
  label: string;
  href?: string;
  active?: boolean;
}

interface AccessWindowTabsProps {
  tabs: WindowTab[];
}

/** The Access "open objects" tab strip (Menu | Tracking | Customer Menu …). */
export function AccessWindowTabs({ tabs }: AccessWindowTabsProps) {
  return (
    <div className="ac-wintabs">
      {tabs.map((t) =>
        t.href && !t.active ? (
          <Link key={t.label} href={t.href} className="ac-wintab">
            {t.label}
          </Link>
        ) : (
          <span key={t.label} className={`ac-wintab ${t.active ? "ac-wintab-active" : ""}`}>
            {t.label}
          </span>
        ),
      )}
    </div>
  );
}
