import type { ReactNode } from "react";

const widths: Record<string, number> = {
  "Payroll Co": 74, Job: 54, Info: 43, S: 28, "J App": 49, OSHA: 51, Health: 57,
  First: 54, MI: 35, Last: 60, City: 40, "Cell #": 52, "Grade Change": 96,
  "WCC State": 75, State: 48, WCC: 48, "Per Diem": 69, OH: 40, E: 27, T: 29,
  DV: 40, "%": 40, "Pay Rate": 72, "Bill Rate": 72, "Bill Rate OT": 90,
  "Bill Rate C": 90, "Emp Notes": 80, "Assignment User Name": 150,
  "Assignment Timestamp": 150, "Hours Note": 180, "Cell": 90,
  TH: 45, RH: 45, OT: 45,
};

/** Shared Access datasheet sizing for Tracking, Hours, and Hours 2. */
const referenceWidths: Record<string, number> = {
  "Payroll Co": 20, Job: 100, Info: 17, S: 17, "J App": 43, OSHA: 39, Health: 43,
  First: 50, MI: 21, Last: 64, City: 79, "Cell #": 79, "Grade Change": 25,
  "WCC State": 29, WCC: 64, "Per Diem": 42, OH: 36, E: 29, T: 29,
  DV: 27, "%": 42, "Pay Rate": 61, "Bill Rate": 78, "Bill Rate OT": 108,
  "Emp Notes": 46, "Assignment User Name": 32, "Assignment Timestamp": 152,
  "HL CV": 48, "HL/CV": 48, "Send Auto Text": 29,
};

export function TrackingDataTable({ columns, children, referenceLayout = false }: { columns: readonly string[]; children: ReactNode; referenceLayout?: boolean }) {
  const sizes = columns.map(label => !label ? 7 : /^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)( S)?$/.test(label) ? 50 : (referenceLayout ? referenceWidths[label] : undefined) ?? widths[label] ?? 85);
  return <table className="ac-tracking-datasheet" style={{ width: sizes.reduce((sum, width) => sum + width, 0), tableLayout: "fixed" }}>
    <colgroup>{sizes.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
    {children}
  </table>;
}
