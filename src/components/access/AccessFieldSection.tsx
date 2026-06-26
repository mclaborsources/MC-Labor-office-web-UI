import type { LucideIcon } from "lucide-react";
import { AccessPanel } from "@/components/access/AccessPanel";
import { AccessFieldGrid, type AccessField } from "@/components/access/AccessFieldGrid";

export type { AccessField };

interface AccessFieldSectionProps {
  title: string;
  icon?: LucideIcon;
  fields: AccessField[];
  columns?: 2 | 3 | 4;
  id?: string;
  note?: string;
}

/**
 * A titled Access panel containing a dense label/value field grid.
 * The building block for the field-heavy profile screens.
 */
export function AccessFieldSection({
  title,
  icon,
  fields,
  columns = 3,
  id,
  note,
}: AccessFieldSectionProps) {
  return (
    <div id={id}>
      <AccessPanel title={title} icon={icon}>
        <AccessFieldGrid fields={fields} columns={columns} />
        {note && <p className="mt-2 border-t border-[#d8d8d8] pt-1.5 text-[11px] italic text-[#7a7a7a]">{note}</p>}
      </AccessPanel>
    </div>
  );
}
