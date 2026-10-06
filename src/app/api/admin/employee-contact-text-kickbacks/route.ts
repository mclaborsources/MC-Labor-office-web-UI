import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";
type Column = { name: string };
type Schema = { address: string | null; cell: string | null; carrier: string | null; flag: string | null; count: string | null; note: string | null };
const names = {
  address: ["EmployeeContactTextMsgAddress", "EmployeeContactTextMsgAddr", "TextMsgAddress"],
  cell: ["EmployeeContactCell"], carrier: ["EmployeeContactCellCarrierID"],
  flag: ["EmployeeContactTextKickback", "EmployeeContactKickback", "TextKickback", "Kickback"],
  count: ["EmployeeContactTextKickbackTimes", "EmployeeContactKickbackTimes", "TextKickbackTimes", "KickbackTimes"],
  note: ["EmployeeContactTextKickbackNote", "EmployeeContactKickbackNote", "TextKickbackNote", "KickbackNote"],
};
const quote = (value: string) => `[${value.replace(/]/g, "]]" )}]`;
const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US");
async function getSchema(): Promise<Schema> {
  const columns = await queryReadOnly<Column>(`SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblEmployeeContacts'`);
  const byName = new Map(columns.map(column => [column.name.toLocaleLowerCase("en-US"), column.name]));
  const find = (list: string[]) => list.map(name => byName.get(name.toLowerCase())).find(Boolean) ?? null;
  return { address: find(names.address), cell: find(names.cell), carrier: find(names.carrier), flag: find(names.flag), count: find(names.count), note: find(names.note) };
}
async function admin() { const session = await requireSession(); if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required."); }

export async function GET() {
  try {
    await admin();
    const schema = await getSchema();
    const canFix = Boolean(schema.address && schema.cell && schema.flag && schema.count && schema.note);
    return NextResponse.json({ ok: true, canFix, schema, message: canFix ? "Employee contact correction fields are available." : "Required employee contact cell, kickback, count, or note fields were not found; Remove/Fix is disabled." });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to inspect employee contact fields." }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try { await admin(); } catch { return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 }); }
  try {
    const body = await request.json() as { action?: string; addresses?: string[]; rows?: { contactId: number; correctedCell?: string; importCarrier?: string; correctedCarrier?: string; correctedAddress?: string }[] };
    const schema = await getSchema();
    if (body.action === "check") {
      const addresses = [...new Set((Array.isArray(body.addresses) ? body.addresses : []).map(value => String(value).trim()).filter(Boolean))];
      if (!addresses.length || addresses.length > 500) throw new Error("Enter between 1 and 500 text message addresses.");
      const source = schema.address ? `cc.${quote(schema.address)}` : schema.cell ? `cc.${quote(schema.cell)}` : null;
      if (!source) throw new Error("Employee contact text-address and cell fields were not found.");
      const cell = schema.cell ? `ISNULL(cc.${quote(schema.cell)},'')` : `''`;
      const carrier = schema.carrier ? `CONVERT(NVARCHAR(50),cc.${quote(schema.carrier)})` : `''`;
      const params = addresses.map((address, index) => ({ name: `address${index}`, value: address }));
      const matches = await queryReadOnly<{ id: number; address: string; employee: string; contact: string; currentCell: string; currentCarrier: string }>(
        `SELECT cc.EmployeeContactID AS id, LTRIM(RTRIM(CONVERT(NVARCHAR(255),${source}))) AS address,
          LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmLastName,'')))) AS employee,
          LTRIM(RTRIM(CONCAT(ISNULL(cc.EmployeeContactFName,''),' ',ISNULL(cc.EmployeeContactLName,'')))) AS contact,
          ${cell} AS currentCell, ISNULL(${carrier},'') AS currentCarrier
         FROM tblEmployeeContacts cc WITH (NOLOCK) LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=cc.EmployeeID
         WHERE LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(255),${source})))) IN (${params.map((_, index) => `@address${index}`).join(",")})${schema.address && schema.cell ? ` OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(cc.${quote(schema.cell)},''),' ',''),'-',''),'(',''),')',''),'+','') IN (${params.map((_, index) => `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@address${index},' ',''),'-',''),'(',''),')',''),'+','')`).join(",")})` : ""}`, params);
      return NextResponse.json({ ok: true, results: addresses.map(address => ({ address, matches: matches.filter(match => normalize(match.address) === normalize(address) || (match.currentCell.replace(/\D/g, "") && match.currentCell.replace(/\D/g, "") === address.replace(/\D/g, ""))) })) });
    }
    if (body.action !== "remove-fix") throw new Error("Choose Check before Remove/Fix.");
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const unique = new Map<number, (typeof rows)[number]>();
    for (const row of rows) if (Number.isSafeInteger(Number(row.contactId)) && Number(row.contactId) > 0) unique.set(Number(row.contactId), row);
    if (!unique.size || unique.size > 500) throw new Error("There are no uniquely matched employee contacts to update.");
    if (!schema.address || !schema.cell || !schema.flag || !schema.count || !schema.note) throw new Error("Required employee contact text address, cell, kickback, count, or note fields were not found. No database rows were changed.");
    if (rows.some(row => String(row.correctedCarrier ?? "").trim() || String(row.importCarrier ?? "").trim())) throw new Error("Carrier correction values need a confirmed carrier lookup mapping before they can be saved. No database rows were changed.");
    const cellColumn = schema.cell, flagColumn = schema.flag, countColumn = schema.count, noteColumn = schema.note;
    if ([...unique.values()].some(row => String(row.correctedCarrier ?? "").trim() || String(row.importCarrier ?? "").trim())) throw new Error("Carrier name-to-ID mapping is not available from the connected database schema. Clear carrier correction values before saving.");
    const results = await withTransaction(async run => {
      let updated = 0;
      for (const [contactId, row] of unique) {
        const parameters: { name: string; value: string | number | null }[] = [{ name: "contactId", value: contactId }, { name: "note", value: `Text message kickback ${new Date().toISOString()}` }];
        const correctedCell = String(row.correctedCell ?? "").trim();
        const cellSet = correctedCell ? `, ${quote(cellColumn)}=@cell` : "";
        if (correctedCell) parameters.push({ name: "cell", value: correctedCell });
        let addressSet = "";
        if (schema.address) { parameters.push({ name: "address", value: String(row.correctedAddress ?? "").trim() || null }); addressSet = `, ${quote(schema.address)}=@address`; }
        const flag = quote(flagColumn), count = quote(countColumn), note = quote(noteColumn);
        const sql = `UPDATE tblEmployeeContacts SET ${flag}=1, ${count}=ISNULL(${count},0)+1${cellSet}${addressSet},
          ${note}=CASE WHEN LEN(LTRIM(RTRIM(ISNULL(CONVERT(NVARCHAR(MAX),${note}),''))))=0 THEN @note ELSE CONVERT(NVARCHAR(MAX),${note})+CHAR(13)+CHAR(10)+@note END
          WHERE EmployeeContactID=@contactId`;
        const result = await run(sql, parameters); updated += result.rowsAffected.reduce((sum, amount) => sum + amount, 0);
      }
      return updated;
    });
    clearReadCache();
    return NextResponse.json({ ok: true, updated: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Employee contact text address update failed.";
    const status = message.includes("Write operations are disabled") ? 503 : message.includes("fields were not found") ? 409 : message.includes("Administrator") ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
