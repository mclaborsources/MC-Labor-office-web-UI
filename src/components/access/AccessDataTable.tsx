import type { ReactNode } from "react";

export interface AccessColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Allow the cell to wrap (grid cells are nowrap by default). */
  nowrap?: boolean;
}

interface AccessDataTableProps<T> {
  columns: AccessColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage?: string;
  /** Optional record-navigator style footer text/content */
  footer?: ReactNode;
  /** Max height before vertical scroll (e.g. "60vh") */
  maxHeight?: string;
}

/** Dense, bordered, Access-style data grid with a light-blue header. */
export function AccessDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records.",
  footer,
  maxHeight,
}: AccessDataTableProps<T>) {
  return (
    <div>
      <div className="ac-grid mc-scroll-smooth" style={maxHeight ? { maxHeight } : undefined}>
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ textAlign: c.align ?? "left" }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="!whitespace-normal py-4 text-center italic text-[#7a7a7a]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={rowKey(row, i)}>
                  {columns.map((c, ci) => (
                    <td
                      key={ci}
                      style={{ textAlign: c.align ?? "left" }}
                      className={c.nowrap === false ? "!whitespace-normal" : ""}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer !== undefined && <div className="ac-recordbar">{footer}</div>}
    </div>
  );
}
