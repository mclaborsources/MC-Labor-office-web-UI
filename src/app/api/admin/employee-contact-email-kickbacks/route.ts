import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";
type FieldRow = { name: string };
type Fields = { flag: string | null; count: string | null; note: string | null };
const FLAG_FIELDS = ["EmployeeContactEmailKickback", "EmployeeContactKickback", "EmailKickback", "Kickback"];
const COUNT_FIELDS = ["EmployeeContactEmailKickbackTimes", "EmployeeContactKickbackTimes", "EmailKickbackTimes", "KickbackTimes"];
const NOTE_FIELDS = ["EmployeeContactKickbackNote", "EmployeeContactEmailKickbackNote", "EmployeeContactNote", "KickbackNote"];
const quote = (name: string) => `[${name.replace(/]/g, "]]" )}]`;
const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US");

async function getFields(): Promise<Fields> {
  const columns = await queryReadOnly<FieldRow>(`SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblEmployeeContacts'`);
  const names = new Map(columns.map(column => [column.name.toLocaleLowerCase("en-US"), column.name]));
  const find = (candidates: string[]) => candidates.map(name => names.get(name.toLocaleLowerCase("en-US"))).find(Boolean) ?? null;
  return { flag: find(FLAG_FIELDS), count: find(COUNT_FIELDS), note: find(NOTE_FIELDS) };
}

async function requireAdmin() {
  const session = await requireSession();
  if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required.");
}

export async function GET() {
  try {
    await requireAdmin();
    const fields = await getFields();
    const canRemove = Boolean(fields.flag && fields.count && fields.note);
    return NextResponse.json({ ok: true, canSetKickback: canRemove, kickbackFields: fields, message: canRemove ? "Employee contact removal fields are available." : "Required employee kickback, count, or note fields were not found; removal is disabled." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to inspect employee contact fields." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try { await requireAdmin(); } catch { return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 }); }
  try {
    const body = await request.json() as { action?: string; emails?: string[]; contactIds?: number[] };
    if (body.action === "check") {
      const emails = [...new Set((Array.isArray(body.emails) ? body.emails : []).map(value => normalize(String(value))).filter(Boolean))];
      if (!emails.length || emails.length > 500) throw new Error("Enter between 1 and 500 email addresses.");
      const params = emails.map((email, index) => ({ name: `email${index}`, value: email }));
      const matches = await queryReadOnly<{ id: number; email: string; employee: string; contact: string }>(
        `SELECT ec.EmployeeContactID AS id, LTRIM(RTRIM(ec.EmployeeContactEmail)) AS email,
          LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''), ' ', ISNULL(e.EmLastName,'')))) AS employee,
          LTRIM(RTRIM(CONCAT(ISNULL(ec.EmployeeContactFName,''), ' ', ISNULL(ec.EmployeeContactLName,'')))) AS contact
         FROM tblEmployeeContacts ec WITH (NOLOCK)
         LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID = ec.EmployeeID
         WHERE LOWER(LTRIM(RTRIM(ISNULL(ec.EmployeeContactEmail,'')))) IN (${params.map((_, index) => `@email${index}`).join(",")})`, params);
      return NextResponse.json({ ok: true, results: emails.map(email => ({ email, matches: matches.filter(match => normalize(match.email) === email).map(match => ({ id: match.id, email: match.email, customer: match.employee, contact: match.contact })) })) });
    }
    if (body.action !== "remove") throw new Error("Choose Check before removing employee contact emails.");
    const ids = [...new Set((Array.isArray(body.contactIds) ? body.contactIds : []).map(Number).filter(id => Number.isSafeInteger(id) && id > 0))];
    if (!ids.length || ids.length > 500) throw new Error("There are no uniquely matched employee contacts to remove.");
    const fields = await getFields();
    if (!fields.flag || !fields.count || !fields.note) throw new Error("Required employee kickback, count, or note fields were not found. No database rows were changed.");
    const params: { name: string; value: string | number }[] = ids.map((id, index) => ({ name: `id${index}`, value: id }));
    params.push({ name: "note", value: `Email kickback ${new Date().toISOString()}` });
    const flag = quote(fields.flag), count = quote(fields.count), note = quote(fields.note);
    const update = `UPDATE tblEmployeeContacts SET EmployeeContactEmail = NULL, ${flag} = 1, ${count} = ISNULL(${count}, 0) + 1,
      ${note} = CASE WHEN LEN(LTRIM(RTRIM(ISNULL(CONVERT(NVARCHAR(MAX), ${note}), '')))) = 0 THEN @note
        ELSE CONVERT(NVARCHAR(MAX), ${note}) + CHAR(13) + CHAR(10) + @note END
      WHERE EmployeeContactID IN (${ids.map((_, index) => `@id${index}`).join(",")})`;
    const result = await withTransaction(async run => run(update, params));
    clearReadCache();
    return NextResponse.json({ ok: true, updated: result.rowsAffected.reduce((sum, count) => sum + count, 0) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Employee contact email removal failed.";
    const status = message.includes("Write operations are disabled") ? 503 : message.includes("required") ? 403 : message.includes("fields were not found") ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
