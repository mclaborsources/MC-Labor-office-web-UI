import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { queryReadOnlyUncached, clearReadCache } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";

const schema = z.object({
  employeeIds: z.array(z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)).min(1).max(1000),
});

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    const session = await requireSession();
    const { employeeIds: rawIds } = schema.parse(await request.json());
    const employeeIds = [...new Set(rawIds)];
    const columns = await queryReadOnlyUncached<{ tableName: string; columnName: string }>(
      `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME IN ('tblEmployee','tblEmployeeB')
         AND COLUMN_NAME IN ('EmployeeFutureCall','EmployeeFutureCallUserName','EmployeeFutureCallUserDate')`,
    );
    const futureCallTables = [...new Set(columns.filter(column => column.columnName === "EmployeeFutureCall").map(column => column.tableName))];
    if (!futureCallTables.length) {
      return NextResponse.json({ ok: false, error: "The employee Future Call field was not found in the database." }, { status: 501 });
    }
    let updated = 0;
    await withTransaction(async run => {
      for (const tableName of futureCallTables) {
        const available = new Set(columns.filter(column => column.tableName === tableName).map(column => column.columnName));
        const setters = ["[EmployeeFutureCall]=NULL"];
        const params = [] as Array<{ name: string; value: string }>;
        if (available.has("EmployeeFutureCallUserName")) {
          setters.push("[EmployeeFutureCallUserName]=@username");
          params.push({ name: "username", value: session.user?.username ?? "" });
        }
        if (available.has("EmployeeFutureCallUserDate")) setters.push("[EmployeeFutureCallUserDate]=GETDATE()");
        for (let offset = 0; offset < employeeIds.length; offset += 500) {
          const batch = employeeIds.slice(offset, offset + 500);
          const idParams = batch.map((id, index) => ({ name: `employeeId${index}`, value: id }));
          const ids = batch.map((_, index) => `@employeeId${index}`).join(",");
          const result = await run(
            `UPDATE dbo.[${tableName}] SET ${setters.join(", ")} WHERE EmployeeID IN (${ids}) AND [EmployeeFutureCall] IS NOT NULL`,
            [...params, ...idParams],
          );
          updated += result.rowsAffected.reduce((sum, count) => sum + count, 0);
        }
      }
    });
    clearReadCache();
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Employee Future Call could not be cleared.";
    const status = message === "Unauthorized" ? 401 : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : error instanceof WritesDisabledError ? 403 : 500;
    if (status === 500) console.error("[api/employees/clear-future-call] Failed to clear values:", error);
    return NextResponse.json({ ok: false, error: status === 500 ? "Employee Future Call could not be cleared." : message }, { status });
  }
}
