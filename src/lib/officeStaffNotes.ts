import { queryReadOnly } from "@/lib/db/sql";
import type { OfficeStaffNoteRow } from "@/types/officeStaffNotes";

interface DbOfficeStaffNote {
  OfficeStaffNotesID: unknown;
  OfficeStaffNote: string | null;
  OfficeStaffNoteUserName: string | null;
  OfficeStaffNoteTimestamp: Date | string | null;
  OfficeStaffNoteTo: string | null;
  OfficeStaffNoteCompleted: boolean | number | null;
  OfficeStaffNoteCompletedUserName: string | null;
  OfficeStaffNoteCompletedTimestamp: Date | string | null;
}

const text = (value: unknown) => value == null ? "" : String(value).trim();
const timestamp = (value: Date | string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleString("en-US");
};

export async function getOfficeStaffNotes(): Promise<OfficeStaffNoteRow[]> {
  const rows = await queryReadOnly<DbOfficeStaffNote>(
    `SELECT OfficeStaffNotesID, OfficeStaffNote, OfficeStaffNoteUserName,
            OfficeStaffNoteTimestamp, OfficeStaffNoteTo, OfficeStaffNoteCompleted,
            OfficeStaffNoteCompletedUserName, OfficeStaffNoteCompletedTimestamp
     FROM tblOfficeStaffNotes WITH (NOLOCK)
     ORDER BY OfficeStaffNotesID`,
  );

  return rows.map((row) => ({
    id: text(row.OfficeStaffNotesID),
    note: text(row.OfficeStaffNote),
    from: text(row.OfficeStaffNoteUserName),
    to: text(row.OfficeStaffNoteTo),
    createdAt: timestamp(row.OfficeStaffNoteTimestamp),
    completed: row.OfficeStaffNoteCompleted === true || row.OfficeStaffNoteCompleted === 1,
    completedBy: text(row.OfficeStaffNoteCompletedUserName),
    completedAt: timestamp(row.OfficeStaffNoteCompletedTimestamp),
  }));
}
