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

function richTextToPlainText(value: unknown): string {
  const source = text(value);
  if (!source) return "";

  const withoutTags = source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "");

  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
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
    note: richTextToPlainText(row.OfficeStaffNote),
    from: text(row.OfficeStaffNoteUserName),
    to: text(row.OfficeStaffNoteTo),
    createdAt: timestamp(row.OfficeStaffNoteTimestamp),
    completed: row.OfficeStaffNoteCompleted === true || row.OfficeStaffNoteCompleted === 1,
    completedBy: text(row.OfficeStaffNoteCompletedUserName),
    completedAt: timestamp(row.OfficeStaffNoteCompletedTimestamp),
  }));
}
