/**
 * Color palette for status pills. Full static class strings so Tailwind's
 * JIT compiler can detect them. Green/rose are reserved for semantic meaning
 * (active / negative), so they're excluded from the hashed fallback palette.
 */
const PALETTE = [
  "bg-blue-50 text-blue-700 ring-blue-200",
  "bg-violet-50 text-violet-700 ring-violet-200",
  "bg-amber-50 text-amber-700 ring-amber-200",
  "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "bg-teal-50 text-teal-700 ring-teal-200",
  "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  "bg-orange-50 text-orange-700 ring-orange-200",
  "bg-sky-50 text-sky-700 ring-sky-200",
  "bg-pink-50 text-pink-700 ring-pink-200",
  "bg-lime-50 text-lime-700 ring-lime-200",
  "bg-purple-50 text-purple-700 ring-purple-200",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return Math.abs(hash);
}

/**
 * Returns Tailwind classes for a status pill.
 * "Active"-type statuses are green and negative/closed statuses are red;
 * every other status gets its own stable, distinct color derived from its text.
 */
export function statusPillClass(status?: string | null): string {
  const s = (status ?? "").trim().toLowerCase();

  if (!s) return "bg-slate-100 text-slate-700 ring-slate-200";

  // Negative / closed states (checked first so "inactive" isn't read as "active")
  if (
    s.includes("inactive") ||
    s.includes("terminat") ||
    s.includes("do not") ||
    s.includes("closed") ||
    s.includes("cancel") ||
    s.includes("lost") ||
    s.includes("dead") ||
    s.includes("fired")
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  // Active / working
  if (s.includes("active") || s.includes("working") || s.includes("current")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  // Every other status gets its own consistent color
  return PALETTE[hashString(s) % PALETTE.length];
}
