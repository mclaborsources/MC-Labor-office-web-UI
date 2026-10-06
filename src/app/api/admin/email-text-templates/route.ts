import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";
type Column = { tableName: string; name: string; tableType?: string };
type TemplateRow = { id: number; name: string; typeId: string; sendId: string; queryName: string; sort: string; futureDays: string; addresses: string; cc: string; bcc: string; subject: string; body: string; newsletter: string };
const quote = (name: string) => `[${name.replace(/]/g, "]]" )}]`;
const norm = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const fields = {
  id: ["EmailTemplateID"], name: ["EmailTemplate"], typeId: ["EmailTemplateTypeID", "EmailTypeID", "TemplateTypeID"], type: ["EmailType", "EmailTemplateType"],
  sendId: ["EmailTemplateSendTypeID", "EmailSendTypeID", "SendTypeID"], send: ["SendType", "EmailSendType"],
  queryName: ["EmailTemplateQueryForData", "EmailTemplateQueryData", "QueryForData", "EmailTemplateQuery", "DataQuery"], sort: ["EmailTemplateSort", "TemplateSort", "Sort"],
  futureDays: ["EmailTemplateFutureCallDays", "FutureCallDays"], addresses: ["EmailTemplateAddresses", "Addresses", "EmailAddresses", "EmailTo"], cc: ["EmailTemplateCcAddresses", "CcAddresses", "EmailCc"],
  bcc: ["EmailTemplateBccAddresses", "BccAddresses", "EmailBcc"], subject: ["EmailTemplateSubject", "Subject"], body: ["EmailTemplateBody", "Body", "EmailTemplateText"], newsletter: ["EmailTemplateNewsletterID", "NewsletterID"],
};
async function admin() { const session = await requireSession(); if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required."); return session; }
async function catalog(): Promise<Column[]> { return queryReadOnly<Column>(`SELECT c.TABLE_NAME AS tableName, c.COLUMN_NAME AS name, t.TABLE_TYPE AS tableType FROM INFORMATION_SCHEMA.COLUMNS c JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_NAME=c.TABLE_NAME AND t.TABLE_SCHEMA=c.TABLE_SCHEMA`); }
async function templateColumns() {
  const all = await catalog();
  const cols = all.filter(item => item.tableName.toLowerCase() === "tblemailtemplates");
  if (!cols.length) throw new Error("The database does not contain tblEmailTemplates.");
  const byName = new Map(cols.map(col => [norm(col.name), col.name]));
  const find = (key: keyof typeof fields) => fields[key].map(name => byName.get(norm(name))).find(Boolean) ?? null;
  const mapped = Object.fromEntries(Object.keys(fields).map(key => [key, find(key as keyof typeof fields)])) as Record<keyof typeof fields, string | null>;
  if (!mapped.id || !mapped.name) throw new Error("tblEmailTemplates is missing its EmailTemplateID or EmailTemplate column.");
  return { all, mapped };
}
const optsFrom = async (all: Column[], base: string, idColumn: string | null, labelCandidates: string[]) => {
  if (!idColumn) return [] as { id: string; label: string }[];
  const tables = [...new Set(all.filter(col => norm(col.name) === norm(idColumn)).map(col => col.tableName))]
    .filter(table => table.toLowerCase() !== "tblemailtemplates" && norm(table).includes(norm(base)))
    .sort((a, b) => Number(norm(b).includes(norm(base))) - Number(norm(a).includes(norm(base))));
  for (const table of tables) {
    const cols = all.filter(col => col.tableName === table).map(col => col.name);
    const label = labelCandidates.map(name => cols.find(col => norm(col) === norm(name))).find(Boolean)
      ?? cols.find(col => /(?:desc|description|name|label)$/.test(norm(col)) && /type|send/.test(norm(col)));
    const id = cols.find(col => norm(col) === norm(idColumn));
    if (label && id) return queryReadOnly<{ id: string; label: string }>(`SELECT CONVERT(NVARCHAR(100),${quote(id)}) id, CONVERT(NVARCHAR(250),${quote(label)}) label FROM ${quote(table)} WITH (NOLOCK) ORDER BY ${quote(label)}`);
  }
  return [] as { id: string; label: string }[];
};
const selectExpr = (column: string | null, alias: string) => column ? `CONVERT(NVARCHAR(MAX),${quote(column)}) AS ${quote(alias)}` : `CAST('' AS NVARCHAR(MAX)) AS ${quote(alias)}`;
async function getTemplateLookups(all: Column[], mapped: Record<keyof typeof fields, string | null>, name: string | null = null) {
  const typeOptions = await optsFrom(all, "templateType", mapped.typeId, ["EmailTemplateType", "EmailType", "TemplateType", "Description", "Name"]);
  const sendOptions = await optsFrom(all, "sendType", mapped.sendId, ["EmailTemplateSendType", "EmailSendType", "SendType", "Description", "Name"]);
  const fallbackDistinct = async (column: string | null) => column ? queryReadOnly<{ id: string; label: string }>(`SELECT DISTINCT CONVERT(NVARCHAR(150),${quote(column)}) id, CONVERT(NVARCHAR(150),${quote(column)}) label FROM tblEmailTemplates WITH (NOLOCK) WHERE ${quote(column)} IS NOT NULL AND LTRIM(RTRIM(CONVERT(NVARCHAR(150),${quote(column)})))<>'' ORDER BY label`) : [];
  const [types, sendTypes] = await Promise.all([typeOptions.length ? Promise.resolve(typeOptions) : fallbackDistinct(mapped.type ?? mapped.typeId), sendOptions.length ? Promise.resolve(sendOptions) : fallbackDistinct(mapped.send ?? mapped.sendId)]);
  const viewTables = [...new Set(all.filter(col => col.tableType === "VIEW").map(col => col.tableName))].sort();
  const queryTables = viewTables.filter(table => /^(qry|vw)|query|report/i.test(table));
  const queryOptions = (queryTables.length ? queryTables : viewTables).map(table => ({ value: table, label: table }));
  const sourceFields = name ? all.filter(col => col.tableName.toLowerCase() === name.toLowerCase()).map(col => col.name) : [];
  return { types, sendTypes, queryOptions, sourceFields };
}

export async function GET(request: Request) {
  try {
    await admin();
    const { all, mapped } = await templateColumns();
    const templateIdColumn = mapped.id!, templateNameColumn = mapped.name!;
    const search = new URL(request.url).searchParams;
    const queryName = search.get("query")?.trim() ?? "";
    const [lookups, rows] = await Promise.all([
      getTemplateLookups(all, mapped, queryName),
      queryReadOnly<TemplateRow>(`SELECT ${quote(templateIdColumn)} id, CONVERT(NVARCHAR(500),${quote(templateNameColumn)}) name,
        ${selectExpr(mapped.typeId ?? mapped.type,"typeId")},${selectExpr(mapped.sendId ?? mapped.send,"sendId")},${selectExpr(mapped.queryName,"queryName")},${selectExpr(mapped.sort,"sort")},
        ${selectExpr(mapped.futureDays,"futureDays")},${selectExpr(mapped.addresses,"addresses")},${selectExpr(mapped.cc,"cc")},${selectExpr(mapped.bcc,"bcc")},${selectExpr(mapped.subject,"subject")},${selectExpr(mapped.body,"body")},${selectExpr(mapped.newsletter,"newsletter")}
        FROM tblEmailTemplates WITH (NOLOCK) WHERE @search='' OR ${quote(templateNameColumn)} LIKE @pattern ORDER BY ${mapped.sort ? quote(mapped.sort) + "," : ""}${quote(templateNameColumn)}`,
        [{ name: "search", value: search.get("search") ?? "" }, { name: "pattern", value: `%${search.get("search") ?? ""}%` }]),
    ]);
    return NextResponse.json({ ok: true, rows, ...lookups, available: mapped });
  } catch (error) { const message = error instanceof Error ? error.message : "Unable to load template data."; return NextResponse.json({ ok: false, error: message }, { status: message.includes("Administrator") ? 403 : 500 }); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  let session;
  try { session = await admin(); } catch { return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 }); }
  try {
    const body = await request.json() as { action?: string; id?: number | string; name?: string; direction?: number; template?: Partial<TemplateRow>; query?: string };
    const { mapped } = await templateColumns();
    const action = body.action ?? "save";
    const id = Number(body.id ?? body.template?.id);
    const params: { name: string; value: unknown }[] = [];
    const name = String(body.name ?? body.template?.name ?? "").trim();
    const existingId = Number.isSafeInteger(id) && id > 0 ? id : 0;
    const template = body.template ?? {};
    if (action === "delete") {
      if (!existingId) throw new Error("Select a saved template to delete.");
      await withTransaction(async run => { const result = await run(`DELETE FROM tblEmailTemplates WHERE ${quote(mapped.id!)}=@id`, [{ name: "id", value: existingId }]); if (!result.rowsAffected.some(count => count > 0)) throw new Error("Template no longer exists."); });
      clearReadCache(); return NextResponse.json({ ok: true });
    }
    if (action === "rename") {
      if (!existingId || !name) throw new Error("Select a template and enter its new name.");
      await withTransaction(async run => { await run(`UPDATE tblEmailTemplates SET ${quote(mapped.name!)}=@name WHERE ${quote(mapped.id!)}=@id`, [{ name: "name", value: name }, { name: "id", value: existingId }]); });
      clearReadCache(); return NextResponse.json({ ok: true });
    }
    if (action === "move") {
      if (!existingId || !mapped.sort) throw new Error("Select a saved template and confirm the database Sort field before changing order.");
      const ordered = await queryReadOnly<{ id: number }>(`SELECT ${quote(mapped.id!)} id FROM tblEmailTemplates WITH (NOLOCK) ORDER BY TRY_CONVERT(FLOAT,${quote(mapped.sort)}),${quote(mapped.name!)}`);
      const index = ordered.findIndex(row => Number(row.id) === existingId);
      const destination = index + (body.direction === -1 ? -1 : 1);
      if (index < 0) throw new Error("Template no longer exists.");
      if (destination < 0 || destination >= ordered.length) return NextResponse.json({ ok: true, unchanged: true });
      const reordered = [...ordered];
      const [selected] = reordered.splice(index, 1);
      reordered.splice(destination, 0, selected);
      await withTransaction(async run => {
        for (const [position, row] of reordered.entries()) await run(`UPDATE tblEmailTemplates SET ${quote(mapped.sort!)}=@sort WHERE ${quote(mapped.id!)}=@id`, [{ name: "sort", value: (position + 1) * 10 }, { name: "id", value: Number(row.id) }]);
      });
      clearReadCache(); return NextResponse.json({ ok: true });
    }
    const unsupported = [
      ["typeId", mapped.typeId ?? mapped.type, template.typeId], ["sendId", mapped.sendId ?? mapped.send, template.sendId], ["queryName", mapped.queryName, template.queryName], ["sort", mapped.sort, template.sort], ["futureDays", mapped.futureDays, template.futureDays], ["addresses", mapped.addresses, template.addresses], ["cc", mapped.cc, template.cc], ["bcc", mapped.bcc, template.bcc], ["subject", mapped.subject, template.subject], ["body", mapped.body, template.body], ["newsletter", mapped.newsletter, template.newsletter],
    ].find(([, column, value]) => !column && value !== undefined && value !== null && String(value).trim() !== "");
    if (unsupported) throw new Error(`The database does not expose the ${unsupported[0]} field; no template changes were saved.`);
    if (action === "copy") {
      if (!name) throw new Error("Enter a name for the copied template.");
      const entries: [string,string|null|undefined,unknown][] = [
        ["name", mapped.name, name], ["typeId", mapped.typeId ?? mapped.type, template.typeId], ["sendId", mapped.sendId ?? mapped.send, template.sendId], ["queryName", mapped.queryName, template.queryName], ["sort", mapped.sort, template.sort], ["futureDays", mapped.futureDays, template.futureDays], ["addresses", mapped.addresses, template.addresses], ["cc", mapped.cc, template.cc], ["bcc", mapped.bcc, template.bcc], ["subject", mapped.subject, template.subject], ["body", mapped.body, template.body], ["newsletter", mapped.newsletter, template.newsletter],
      ];
      const presentEntries = entries.filter((entry): entry is [string,string,unknown] => Boolean(entry[1]));
      const copyParams = presentEntries.map(([key, , value]) => ({ name: key, value: value ?? null }));
      await withTransaction(async run => { await run(`INSERT INTO tblEmailTemplates (${presentEntries.map(([,column]) => quote(column)).join(",")}) VALUES (${presentEntries.map(([key]) => `@${key}`).join(",")})`, copyParams); });
      clearReadCache(); return NextResponse.json({ ok: true });
    }
    if (action !== "save") throw new Error("Unknown template action.");
    if (!name) throw new Error("Template name is required.");
    const sets: string[] = [];
    for (const [key, column, value] of [
      ["name", mapped.name, name], ["typeId", mapped.typeId ?? mapped.type, template.typeId], ["sendId", mapped.sendId ?? mapped.send, template.sendId], ["queryName", mapped.queryName, template.queryName], ["sort", mapped.sort, template.sort], ["futureDays", mapped.futureDays, template.futureDays], ["addresses", mapped.addresses, template.addresses], ["cc", mapped.cc, template.cc], ["bcc", mapped.bcc, template.bcc], ["subject", mapped.subject, template.subject], ["body", mapped.body, template.body], ["newsletter", mapped.newsletter, template.newsletter],
    ] as [string,string|null,unknown][]) {
      if (!column) continue;
      params.push({ name: key, value: value === undefined ? null : value }); sets.push(`${quote(column)}=@${key}`);
    }
    if (existingId) {
      await withTransaction(async run => { const result = await run(`UPDATE tblEmailTemplates SET ${sets.join(",")} WHERE ${quote(mapped.id!)}=@id`, [...params, { name: "id", value: existingId }]); if (!result.rowsAffected.some(count => count > 0)) throw new Error("Template no longer exists."); });
    } else {
      await withTransaction(async run => { await run(`INSERT INTO tblEmailTemplates (${sets.map(set => set.slice(0, set.indexOf("="))).join(",")}) VALUES (${params.map(parameter => `@${parameter.name}`).join(",")})`, params); });
    }
    clearReadCache();
    return NextResponse.json({ ok: true, user: session.user?.username ?? "" });
  } catch (error) { const message = error instanceof Error ? error.message : "Unable to save template."; const status = message.includes("Write operations are disabled") ? 503 : message.includes("Administrator") ? 403 : 400; return NextResponse.json({ ok: false, error: message }, { status }); }
}
