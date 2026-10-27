import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idsSchema = z.array(z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)).min(1);
const actionSchema = z.object({ action: z.literal("create-action"), actionType: z.coerce.number().int(), customerIds: idsSchema });
const clearFutureSchema = z.object({
  action: z.literal("clear-future-call"),
  customerIds: idsSchema,
  statusChoice: z.enum(["set", "clear", "ignore"]),
  statusId: z.number().int().positive().optional(),
});

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "The utility action failed.";
  const status = message === "Unauthorized" ? 401
    : error instanceof z.ZodError || error instanceof SyntaxError || message.includes("Select") || message.includes("not found") ? 400
      : error instanceof WritesDisabledError ? 403 : 500;
  if (status === 500) console.error("[api/customers/utilities]", error);
  return NextResponse.json({ ok: false, error: status === 500 ? "The database could not complete this utility action." : message }, { status });
}

export async function GET() {
  try {
    await requireSession();
    const [actions, statuses] = await Promise.all([
      queryReadOnly(`SELECT PullDownActionType AS id, PullDownActionTypeDesc AS description
        FROM dbo.tblPullDownActionTypes WITH (NOLOCK)
        WHERE PullDownActionType < -10
        ORDER BY PullDownActionTypeSort, PullDownActionTypeDesc`),
      queryReadOnly(`SELECT PullDownSalesHistoryStatusID AS id, PullDownSalesHistoryStatusDesc AS description
        FROM dbo.tblPullDownSalesHistoryStatus WITH (NOLOCK)
        ORDER BY PullDownSalesHistoryStatusSort, PullDownSalesHistoryStatusDesc`),
    ]);
    return NextResponse.json({ ok: true, actions, statuses });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    const session = await requireSession();
    const body = await request.json() as { action?: string };
    const userName = (session.user?.initials || session.user?.username || session.user?.displayName || "Web User").slice(0, 50);
    const timestamp = new Date();
    let affected = 0;

    if (body.action === "create-action") {
      const input = actionSchema.parse(body);
      const customerIds = [...new Set(input.customerIds)];
      await withTransaction(async run => {
        const action = await run(`SELECT TOP 1 PullDownActionTypeDesc AS description
          FROM dbo.tblPullDownActionTypes WHERE PullDownActionType=@actionType AND PullDownActionType < -10`, [{ name: "actionType", value: input.actionType }]);
        const description = String((action.recordset[0] as { description?: string } | undefined)?.description ?? "");
        if (!description) throw new Error("The selected action was not found.");
        const note = `${description}. ${userName} ${timestamp.toLocaleDateString("en-US")}`;
        for (let offset = 0; offset < customerIds.length; offset += 500) {
          const batch = customerIds.slice(offset, offset + 500);
          const params = batch.map((id, index) => ({ name: `customerId${index}`, value: id }));
          const ids = batch.map((_, index) => `@customerId${index}`).join(",");
          const result = await run(`INSERT INTO dbo.tblCustomerSalesHistory
            (CustomerID, CustomerSalesHistoryActionTypeID, CustomerSalesHistoryUserName, CustomerSalesHistoryTimestamp, CustomerSalesHistoryNote)
            SELECT c.CustomerID,@actionType,@userName,@timestamp,@note FROM dbo.tblCustomer c WHERE c.CustomerID IN (${ids})`, [
            { name: "actionType", value: input.actionType }, { name: "userName", value: userName },
            { name: "timestamp", value: timestamp }, { name: "note", value: note }, ...params,
          ]);
          affected += result.rowsAffected.reduce((sum, value) => sum + value, 0);
        }
      });
    } else if (body.action === "clear-future-call") {
      const input = clearFutureSchema.parse(body);
      const customerIds = [...new Set(input.customerIds)];
      if (input.statusChoice === "set" && !input.statusId) throw new Error("Choose a Sales History Status first.");
      await withTransaction(async run => {
        let statusDescription = "";
        if (input.statusChoice === "set") {
          const status = await run(`SELECT TOP 1 PullDownSalesHistoryStatusDesc AS description FROM dbo.tblPullDownSalesHistoryStatus WHERE PullDownSalesHistoryStatusID=@statusId`, [{ name: "statusId", value: input.statusId }]);
          statusDescription = String((status.recordset[0] as { description?: string } | undefined)?.description ?? "");
          if (!statusDescription) throw new Error("The selected Sales History Status was not found.");
        }
        for (let offset = 0; offset < customerIds.length; offset += 500) {
          const batch = customerIds.slice(offset, offset + 500);
          const params = batch.map((id, index) => ({ name: `customerId${index}`, value: id }));
          const ids = batch.map((_, index) => `@customerId${index}`).join(",");
          const statusId = input.statusChoice === "set" ? input.statusId : null;
          const keepAudit = input.statusChoice === "ignore";
          const update = await run(`UPDATE dbo.tblCustomer SET FutureCall=NULL,
            FutureCallUserName=${keepAudit ? "NULL" : "@userName"},
            FutureCallTimestamp=${keepAudit ? "NULL" : "@timestamp"},
            SalesHistoryStatusID=CASE WHEN @keepAudit=1 THEN SalesHistoryStatusID ELSE @statusId END
            WHERE CustomerID IN (${ids})`, [
            { name: "userName", value: userName }, { name: "timestamp", value: timestamp },
            { name: "statusId", value: statusId }, { name: "keepAudit", value: keepAudit ? 1 : 0 }, ...params,
          ]);
          affected += update.rowsAffected.reduce((sum, value) => sum + value, 0);
          const note = input.statusChoice === "set"
            ? `Cleared Future Call. ${statusDescription} ${userName} ${timestamp.toLocaleDateString("en-US")}`
            : input.statusChoice === "clear"
              ? `Cleared Future Call and Sales History Status. ${userName} ${timestamp.toLocaleDateString("en-US")}`
              : `Cleared Future Call. ${userName} ${timestamp.toLocaleDateString("en-US")}`;
          await run(`INSERT INTO dbo.tblCustomerFutureCallNotes
            (CustomerID, CustomerFutureCallNote, CustomerFutureCallNoteUserName, CustomerFutureCallNoteTimestamp)
            SELECT c.CustomerID,@note,@userName,@timestamp FROM dbo.tblCustomer c WHERE c.CustomerID IN (${ids})`, [
            { name: "note", value: note }, { name: "userName", value: userName }, { name: "timestamp", value: timestamp }, ...params,
          ]);
        }
      });
    } else throw new Error("Choose a supported utility action.");

    if (!affected) throw new Error("No selected customer records were found.");
    clearReadCache();
    return NextResponse.json({ ok: true, affected });
  } catch (error) { return errorResponse(error); }
}
