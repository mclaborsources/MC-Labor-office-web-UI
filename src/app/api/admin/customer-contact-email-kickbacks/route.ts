import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";

type FieldRow = { name: string };
const FLAG_FIELDS = ["CustomerContactKickback", "CustomerContactEmailKickback", "CustomerContactEmailAddressKickback", "EmailKickback", "Kickback"];
const COUNT_FIELDS = ["CustomerContactKickbackTimes", "CustomerContactEmailKickbackTimes", "CustomerContactEmailAddressKickbackTimes", "EmailKickbackTimes", "KickbackTimes"];
const quote = (name: string) => `[${name.replace(/]/g, "]]" )}]`;
const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US");

async function schema() {
  const fields = await queryReadOnly<FieldRow>(`SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblCustomerContacts'`);
  const byLower = new Map(fields.map(field => [field.name.toLocaleLowerCase("en-US"), field.name]));
  const find = (candidates: string[]) => candidates.map(candidate => byLower.get(candidate.toLocaleLowerCase("en-US"))).find(Boolean) ?? null;
  return { flag: find(FLAG_FIELDS), count: find(COUNT_FIELDS) };
}

async function admin() {
  const session = await requireSession();
  if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required.");
}

export async function GET() {
  try {
    await admin();
    const fields = await schema();
    return NextResponse.json({ ok: true, canSetKickback: Boolean(fields.flag && fields.count), kickbackFields: fields });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to inspect customer contact fields." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try { await admin(); } catch { return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 }); }
  try {
    const body = await request.json() as { action?: string; emails?: string[]; contactIds?: number[] };
    if (body.action === "check") {
      const emails = [...new Set((Array.isArray(body.emails) ? body.emails : []).map(value => normalize(String(value))).filter(Boolean))];
      if (!emails.length || emails.length > 500) throw new Error("Enter between 1 and 500 email addresses.");
      const params = emails.map((email, index) => ({ name: `email${index}`, value: email }));
      const matches = await queryReadOnly<{ id: number; email: string; customer: string; contact: string }>(
        `SELECT cc.CustomerContactID AS id, LTRIM(RTRIM(cc.CustomerContactEmail)) AS email,
          ISNULL(c.CustBusName, '') AS customer,
          LTRIM(RTRIM(CONCAT(ISNULL(cc.CustomerContactFName,''), ' ', ISNULL(cc.CustomerContactLName,'')))) AS contact
         FROM tblCustomerContacts cc WITH (NOLOCK)
         LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = cc.CustomerID
         WHERE LOWER(LTRIM(RTRIM(ISNULL(cc.CustomerContactEmail,'')))) IN (${params.map((_, index) => `@email${index}`).join(",")})`, params);
      return NextResponse.json({ ok: true, results: emails.map(email => {
        const found = matches.filter(match => normalize(match.email) === email);
        return { email, matches: found };
      }) });
    }
    if (body.action !== "set") throw new Error("Choose Check before setting kickback status.");
    const ids = [...new Set((Array.isArray(body.contactIds) ? body.contactIds : []).map(Number).filter(id => Number.isSafeInteger(id) && id > 0))];
    if (!ids.length || ids.length > 500) throw new Error("There are no uniquely matched contacts to update.");
    const fields = await schema();
    if (!fields.flag || !fields.count) throw new Error("The customer contact kickback fields were not found. No database rows were changed.");
    const params = ids.map((id, index) => ({ name: `id${index}`, value: id }));
    const update = `UPDATE tblCustomerContacts SET ${quote(fields.flag)} = 1, ${quote(fields.count)} = ISNULL(${quote(fields.count)}, 0) + 1 WHERE CustomerContactID IN (${params.map((_, index) => `@id${index}`).join(",")})`;
    const result = await withTransaction(async run => run(update, params));
    clearReadCache();
    return NextResponse.json({ ok: true, updated: result.rowsAffected.reduce((sum, count) => sum + count, 0) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer contact kickbacks failed.";
    const status = message.includes("Write operations are disabled") ? 503 : message.includes("Administrator") ? 403 : message.includes("fields were not found") ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
