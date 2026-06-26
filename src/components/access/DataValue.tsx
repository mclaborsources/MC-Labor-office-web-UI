import type { ReactNode } from "react";

type ValueKind = "auto" | "text" | "date" | "phone" | "email" | "money" | "yesno";

interface DataValueProps {
  value?: string | number | boolean | null;
  kind?: ValueKind;
  mono?: boolean;
  className?: string;
}

function isPhone(v: string): boolean {
  return /^[\d(+]/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 7;
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function formatDate(v: string): string {
  const s = v.trim();
  if (!s || s.startsWith("1900") || s.startsWith("0001")) return "";
  // Already mm/dd/yyyy from SQL CONVERT(101)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US");
}

/**
 * Renders a single field value the Access-style way: never hides a field, shows
 * a muted dash when empty, and auto-links phones/emails so office staff can act.
 */
export function DataValue({ value, kind = "auto", mono = false, className = "" }: DataValueProps) {
  if (kind === "yesno") {
    const truthy = value === true || value === 1 || value === "1" || value === "true";
    return <span className={className}>{truthy ? "Yes" : "No"}</span>;
  }

  const raw = value === null || value === undefined ? "" : String(value).trim();

  let display = raw;
  if (kind === "date") display = formatDate(raw);
  if (kind === "money" && raw) {
    const n = Number(raw.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(n)) display = n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  if (display === "") {
    return <span className="text-slate-300">—</span>;
  }

  let content: ReactNode = display;
  if (kind === "email" || (kind === "auto" && isEmail(display))) {
    content = (
      <a href={`mailto:${display}`} className="text-blue-700 hover:underline">
        {display}
      </a>
    );
  } else if (kind === "phone" || (kind === "auto" && isPhone(display))) {
    content = (
      <a href={`tel:${display}`} className="text-blue-700 hover:underline">
        {display}
      </a>
    );
  }

  return <span className={`${mono ? "font-mono text-xs" : ""} ${className}`}>{content}</span>;
}
