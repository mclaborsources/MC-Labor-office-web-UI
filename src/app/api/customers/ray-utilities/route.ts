import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const selectedIds = z.array(z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)).min(1);
const typeSchema = z.object({ action: z.literal("change-customer-type"), customerIds: selectedIds, customerTypeId: z.coerce.number().int().positive() });
const titleSchema = z.object({ action: z.literal("change-contact-title"), customerIds: selectedIds, titleId: z.coerce.number().int().positive() });
const deleteContactsSchema = z.object({ action: z.literal("delete-contacts"), customerIds: selectedIds });
const setFlag4Schema = z.object({ action: z.literal("set-flag4-do-not-email") });
const zipSchema = z.object({ action: z.literal("fix-zips") });

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "The Ray action failed.";
  const status = message === "Unauthorized" ? 401 : error instanceof z.ZodError ? 400 : error instanceof WritesDisabledError ? 403 : message.includes("not found") || message.includes("no primary contacts") ? 400 : 500;
  if (status === 500) console.error("[api/customers/ray-utilities]", error);
  return NextResponse.json({ ok: false, error: status === 500 ? "The database could not complete the Ray action." : message }, { status });
}

export async function GET() {
  try {
    await requireSession();
    const [types, titles] = await Promise.all([
      queryReadOnly(`SELECT PullDownCustomerTypeID AS id, PullDownCustomerType AS label,
        PullDownCustomerTypeContractWith_PayrollCoID AS contractWithId
        FROM dbo.tblPullDownCustomerTypes WITH (NOLOCK)
        ORDER BY PullDownCustomerTypeSort, PullDownCustomerType`),
      queryReadOnly(`SELECT PullDownCustomerContactTitleID AS id, PullDownCustomerContactTitle AS label
        FROM dbo.tblPullDownCustomerContactTitles WITH (NOLOCK)
        ORDER BY PullDownCustomerContactTitle`),
    ]);
    return NextResponse.json({ ok: true, types, titles });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    const session = await requireSession();
    const userName = String(session.user?.initials || session.user?.username || session.user?.displayName || "Web User").slice(0, 50);
    const body = await request.json() as { action?: string };
    let affected = 0;
    if (body.action === "change-customer-type") {
      const input = typeSchema.parse(body);
      const ids = [...new Set(input.customerIds)];
      await withTransaction(async run => {
        const found = await run(`SELECT TOP 1 PullDownCustomerType AS label, PullDownCustomerTypeContractWith_PayrollCoID AS contractWithId
          FROM dbo.tblPullDownCustomerTypes WHERE PullDownCustomerTypeID=@id`, [{ name: "id", value: input.customerTypeId }]);
        const type = found.recordset[0] as { label?: string; contractWithId?: number | null } | undefined;
        if (!type?.label) throw new Error("Customer type not found.");
        for (let offset = 0; offset < ids.length; offset += 500) {
          const batch = ids.slice(offset, offset + 500);
          const updated = await run(`UPDATE c SET CustomerTypeID=@typeId, AllowContractWith_PayrollCoID=@contractWithId,
            CustomerNoCommunication=CASE WHEN @typeId=13 THEN 1 ELSE CustomerNoCommunication END,
            CustomerNoCommunicationUserName=CASE WHEN @typeId=13 THEN @userName ELSE CustomerNoCommunicationUserName END,
            CustomerNoCommunicationTimestamp=CASE WHEN @typeId=13 THEN @timestamp ELSE CustomerNoCommunicationTimestamp END
            FROM dbo.tblCustomer c WHERE c.CustomerID IN (${batch.map((_, i) => `@id${i}`).join(",")})`, [
            { name: "typeId", value: input.customerTypeId }, { name: "contractWithId", value: type.contractWithId ?? null },
            { name: "userName", value: userName }, { name: "timestamp", value: new Date() },
            ...batch.map((id, i) => ({ name: `id${i}`, value: id })),
          ]);
          affected += updated.rowsAffected.reduce((sum, count) => sum + count, 0);
        }
      });
    } else if (body.action === "fix-zips") {
      zipSchema.parse(body);
      await withTransaction(async run => {
        const result = await run(`UPDATE dbo.tblCustomer SET
          Zip=CASE WHEN Zip IS NOT NULL AND LEN(Zip)<5 THEN RIGHT('00000'+Zip,5) ELSE Zip END,
          MailZip=CASE WHEN MailZip IS NOT NULL AND LEN(MailZip)<5 THEN RIGHT('00000'+MailZip,5) ELSE MailZip END
          WHERE (Zip IS NOT NULL AND LEN(Zip)<5) OR (MailZip IS NOT NULL AND LEN(MailZip)<5)`);
        affected = result.rowsAffected.reduce((sum, count) => sum + count, 0);
      });
    } else if (body.action === "change-contact-title") {
      const input = titleSchema.parse(body);
      const ids = [...new Set(input.customerIds)];
      await withTransaction(async run => {
        const found = await run(`SELECT TOP 1 PullDownCustomerContactTitleID FROM dbo.tblPullDownCustomerContactTitles WHERE PullDownCustomerContactTitleID=@id`, [{ name: "id", value: input.titleId }]);
        if (!found.recordset.length) throw new Error("Contact title not found.");
        for (let offset = 0; offset < ids.length; offset += 500) {
          const batch = ids.slice(offset, offset + 500);
          const updated = await run(`UPDATE cc SET CustomerContactTitleID=@titleId, CustomerContactUserName=@userName, CustomerContactTimestamp=@timestamp
            FROM dbo.tblCustomerContacts cc
            WHERE cc.CustomerContactSort=1 AND cc.CustomerID IN (${batch.map((_, i) => `@id${i}`).join(",")})`, [
            { name: "titleId", value: input.titleId }, { name: "userName", value: userName }, { name: "timestamp", value: new Date() },
            ...batch.map((id, i) => ({ name: `id${i}`, value: id })),
          ]);
          affected += updated.rowsAffected.reduce((sum, count) => sum + count, 0);
          await run(`UPDATE c SET
              InternetSalesReadyID=CASE WHEN ISNULL(c.CustomerNoCommunication,0)=1 THEN 8 ELSE primaryReady.readyId END,
              InternetSalesReadyTimestamp=CASE WHEN ISNULL(c.CustomerNoCommunication,0)=1 OR primaryReady.readyId IS NOT NULL THEN @timestamp ELSE NULL END,
              InternetSalesReadyUserName=CASE WHEN ISNULL(c.CustomerNoCommunication,0)=1 OR primaryReady.readyId IS NOT NULL THEN @userName ELSE NULL END
            FROM dbo.tblCustomer c
            OUTER APPLY (
              SELECT TOP (1) CASE cc.CustomerContactTitleID WHEN 8 THEN 9 WHEN 26 THEN 10 WHEN 22 THEN 1 WHEN 31 THEN 24 WHEN 34 THEN 26 WHEN 32 THEN 25 END AS readyId
              FROM dbo.tblCustomerContacts cc WHERE cc.CustomerID=c.CustomerID
                AND cc.CustomerContactTitleID IN (8,26,22,31,34,32)
              ORDER BY CASE cc.CustomerContactTitleID WHEN 8 THEN 1 WHEN 26 THEN 2 WHEN 22 THEN 3 WHEN 31 THEN 4 WHEN 34 THEN 5 WHEN 32 THEN 6 ELSE 99 END,
                cc.CustomerContactID
            ) primaryReady
            WHERE c.CustomerID IN (${batch.map((_, i) => `@id${i}`).join(",")})`, [
            { name: "timestamp", value: new Date() }, { name: "userName", value: userName },
            ...batch.map((id, i) => ({ name: `id${i}`, value: id })),
          ]);
        }
        if (!affected) throw new Error("The selected customers have no primary contacts to update.");
      });
    } else if (body.action === "delete-contacts") {
      const input = deleteContactsSchema.parse(body);
      const ids = [...new Set(input.customerIds)];
      await withTransaction(async run => {
        for (let offset = 0; offset < ids.length; offset += 500) {
          const batch = ids.slice(offset, offset + 500);
          const args = batch.map((id, i) => ({ name: `id${i}`, value: id }));
          await run(`UPDATE laterContact SET CustomerContactSort=CustomerContactSort-1
            FROM dbo.tblCustomerContacts laterContact
            INNER JOIN dbo.tblCustomerContacts selectedContact ON selectedContact.CustomerID=laterContact.CustomerID
            WHERE selectedContact.CustomerContactSort=1 AND laterContact.CustomerContactSort>selectedContact.CustomerContactSort
              AND selectedContact.CustomerID IN (${batch.map((_, i) => `@id${i}`).join(",")})`, args);
          const deleted = await run(`DELETE cc FROM dbo.tblCustomerContacts cc
            WHERE cc.CustomerContactSort=1 AND cc.CustomerID IN (${batch.map((_, i) => `@id${i}`).join(",")})`, args);
          affected += deleted.rowsAffected.reduce((sum, count) => sum + count, 0);
        }
        if (!affected) throw new Error("The selected customers have no primary contacts to delete.");
      });
    } else if (body.action === "set-flag4-do-not-email") {
      setFlag4Schema.parse(body);
      await withTransaction(async run => {
        const updated = await run(`;WITH CurrentWeek AS (
            SELECT cw.CustomerID, MAX(cw.WeekEndingDate) AS LastWeekEndingDate
            FROM dbo.tblCustomerWeeks cw WITH (NOLOCK) GROUP BY cw.CustomerID
          ), DuplicateGroups AS (
            SELECT c.Street, c.City, w.LastWeekEndingDate
            FROM dbo.tblCustomer c WITH (NOLOCK)
            INNER JOIN CurrentWeek w ON w.CustomerID=c.CustomerID
            WHERE c.Street IS NOT NULL AND c.City IS NOT NULL AND w.LastWeekEndingDate IS NOT NULL
            GROUP BY c.Street, c.City, w.LastWeekEndingDate
            HAVING COUNT_BIG(*)>1 AND MAX(CASE WHEN c.SalesmanID IN (5,6,7,9) THEN 1 ELSE 0 END)=1
          )
          UPDATE c SET CustomerUserFlag4='Do not Email'
          FROM dbo.tblCustomer c
          INNER JOIN CurrentWeek w ON w.CustomerID=c.CustomerID
          INNER JOIN DuplicateGroups d ON d.Street=c.Street AND d.City=c.City AND d.LastWeekEndingDate=w.LastWeekEndingDate
          WHERE ISNULL(c.CustomerUserFlag4,'')<>'Do not Email'`);
        affected = updated.rowsAffected.reduce((sum, count) => sum + count, 0);
      });
    } else throw new Error("Choose a supported Ray action.");
    clearReadCache();
    return NextResponse.json({ ok: true, affected });
  } catch (error) { return fail(error); }
}
