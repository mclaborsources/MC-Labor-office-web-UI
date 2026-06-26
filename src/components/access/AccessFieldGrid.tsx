import { DataValue } from "@/components/access/DataValue";

export interface AccessField {
  label: string;
  value?: string | number | boolean | null;
  kind?: "auto" | "text" | "date" | "phone" | "email" | "money" | "yesno";
  mono?: boolean;
  /** Span this field across the whole row */
  wide?: boolean;
}

interface AccessFieldGridProps {
  fields: AccessField[];
  /** Columns at the widest breakpoint (default 3) */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const colClass: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Dense Access-style field layout: label over a sunken read-only value box.
 * Renders many fields compactly without hand-laying out each one.
 */
export function AccessFieldGrid({ fields, columns = 3, className = "" }: AccessFieldGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-x-3 gap-y-1.5 ${colClass[columns]} ${className}`}>
      {fields.map((f, i) => (
        <div key={`${f.label}-${i}`} className={f.wide ? "sm:col-span-2 lg:col-span-full" : ""}>
          <div className="ac-flabel">{f.label}</div>
          <div className="ac-readonly">
            <DataValue value={f.value} kind={f.kind} mono={f.mono} />
          </div>
        </div>
      ))}
    </div>
  );
}
