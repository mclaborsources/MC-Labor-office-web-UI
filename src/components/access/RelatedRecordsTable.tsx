import type { LucideIcon } from "lucide-react";
import { AccessDataTable, type AccessColumn } from "@/components/access/AccessDataTable";
import { Icon } from "@/components/ui/Icon";

interface RelatedRecordsTableProps<T> {
  id?: string;
  title: string;
  icon?: LucideIcon;
  columns: AccessColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage?: string;
  /** Extra content shown to the right of the record count in the footer */
  footerExtra?: React.ReactNode;
  noun?: string;
}

/** A titled Access section wrapping a related-records grid (contacts, jobs, …). */
export function RelatedRecordsTable<T>({
  id,
  title,
  icon,
  columns,
  rows,
  rowKey,
  emptyMessage = "No records.",
  footerExtra,
  noun = "record",
}: RelatedRecordsTableProps<T>) {
  return (
    <section id={id} className="ac-panel">
      <div className="ac-panel-head">
        {icon && <Icon icon={icon} size="xs" className="text-[#5a6c82]" />}
        <span>{title}</span>
      </div>
      <div className="p-2">
        <AccessDataTable
          columns={columns}
          rows={rows}
          rowKey={rowKey}
          emptyMessage={emptyMessage}
          footer={
            <div className="flex w-full items-center justify-between">
              <span>
                {rows.length} {noun}
                {rows.length === 1 ? "" : "s"}
              </span>
              {footerExtra}
            </div>
          }
        />
      </div>
    </section>
  );
}
