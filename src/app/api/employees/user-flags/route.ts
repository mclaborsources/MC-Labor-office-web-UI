import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { getEmployeeUserFlagOptions } from "@/lib/employees";
import { clearReadCache } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const USER_FLAGS_PASSWORD = "3360";

const updateSchema = z.object({
  slot: z.number().int().min(1).max(8),
  value: z.string().trim().max(255),
  password: z.string().max(64),
  employeeIds: z.array(z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)).min(1).max(1000),
});

function updateError(error: unknown) {
  const message = error instanceof Error ? error.message : "The employee user flag could not be updated.";
  const status = message === "Unauthorized" ? 401
    : error instanceof z.ZodError || error instanceof SyntaxError || message.includes("selected employee") ? 400
      : error instanceof WritesDisabledError ? 403 : 500;
  if (status === 500) console.error("[api/employees/user-flags] Failed to update employee user flags:", error);
  return NextResponse.json({ ok: false, error: status === 500 ? "The database could not update the selected employees." : message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, options: await getEmployeeUserFlagOptions() });
  } catch (error) {
    console.error("[api/employees/user-flags] Failed to load employee user flags:", error);
    return NextResponse.json({ ok: false, options: [], error: "Employee user settings could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    await requireSession();
    const body = updateSchema.parse(await request.json());
    if (body.password !== USER_FLAGS_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Incorrect password. No employee records were changed." }, { status: 403 });
    }
    const employeeIds = [...new Set(body.employeeIds)];
    if (!employeeIds.length) throw new Error("Select at least one employee row first.");
    const column = `EmployeeUserFlag${body.slot}`;
    let updated = 0;
    await withTransaction(async run => {
      for (let offset = 0; offset < employeeIds.length; offset += 500) {
        const batch = employeeIds.slice(offset, offset + 500);
        const idParams = batch.map((id, index) => ({ name: `employeeId${index}`, value: id }));
        const placeholders = batch.map((_, index) => `@employeeId${index}`).join(",");
        const result = await run(`UPDATE dbo.tblEmployee SET [${column}]=@value WHERE EmployeeID IN (${placeholders})`, [
          { name: "value", value: body.value },
          ...idParams,
        ]);
        updated += result.rowsAffected.reduce((sum, count) => sum + count, 0);
      }
    });
    if (!updated) throw new Error("No selected employee records were found.");
    clearReadCache();
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return updateError(error);
  }
}
