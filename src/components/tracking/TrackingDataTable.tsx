import { TRACKING_ACCESS_COLUMN_WIDTHS, TRACKING_ACCESS_VIEW_WIDTHS } from "@/lib/trackingAccessColumnWidths";
import type { ReactNode } from "react";

const widths: Record<string, number> = {
  "Payroll Co": 74, Job: 54, Info: 43, S: 28, "J App": 49, OSHA: 51, Health: 57,
  First: 54, MI: 21, Last: 60, City: 40, "Cell #": 52, "Grade Change": 96,
  "WCC State": 75, State: 48, WCC: 48, "Per Diem": 69, OH: 40, E: 27, T: 29,
  DV: 40, "%": 40, "Pay Rate": 72, "Bill Rate": 72, "Bill Rate OT": 90,
  "Bill Rate C": 90, "Emp Notes": 80, "Assignment User Name": 150,
  "Assignment Timestamp": 150, "Hours Note": 180, "Cell": 90,
  TH: 45, RH: 45, OT: 45,
};

export function TrackingDataTable({ columns, children, view = "tracking", rowSelector = false }: { columns: readonly string[]; children: ReactNode; view?: string; rowSelector?: boolean }) {
  const sizes = columns.map((label, index) => rowSelector && index === 0 ? 19 : !label ? (view === "tracking" ? 10 : 7) : TRACKING_ACCESS_VIEW_WIDTHS[view]?.[label] ?? TRACKING_ACCESS_COLUMN_WIDTHS[label] ?? widths[label] ?? 85);
  return <table data-shared-widths="tracking" className="ac-tracking-datasheet" style={{ width: sizes.reduce((sum, width) => sum + width, 0), minWidth: 0, tableLayout: "fixed" }}>
    <colgroup>{sizes.map((width, index) => <col key={index} data-column-key={columns[index] ? `${view}:${columns[index]}` : undefined} style={{ width }} />)}</colgroup>
    {children}
  </table>;
}
