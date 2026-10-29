import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { queryReadOnlyUncached, clearReadCache } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  profileTypeId: z.number().int().positive(),
  employeeIds: z.array(z.coerce.number().int().positive()).min(1).max(1000),
});

export async function GET() {
  try {
    await requireSession();
    const profiles = await queryReadOnlyUncached<{ id: number; name: string }>(
      `SELECT PullDownEmployeeProfileTypeID AS id, LTRIM(RTRIM(PullDownEmployeeProfileType)) AS name
       FROM dbo.tblPullDownEmployeeProfileTypes WITH (NOLOCK)
       ORDER BY PullDownEmployeeProfileTypeID`,
    );
    return NextResponse.json({ ok: true, profiles });
  } catch (error) {
    console.error("[api/employees/profile-transfer] Failed to load profiles:", error);
    return NextResponse.json({ ok: false, error: "Employee profiles could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    await requireSession();
    const body = schema.parse(await request.json());
    const employeeIds = [...new Set(body.employeeIds)];
    const [profile] = await queryReadOnlyUncached<{ id: number; name: string }>(
      `SELECT PullDownEmployeeProfileTypeID AS id, LTRIM(RTRIM(PullDownEmployeeProfileType)) AS name
       FROM dbo.tblPullDownEmployeeProfileTypes WHERE PullDownEmployeeProfileTypeID=@id`,
      [{ name: "id", value: body.profileTypeId }],
    );
    if (!profile) return NextResponse.json({ ok: false, error: "The target employee profile is not valid." }, { status: 400 });

    let updated = 0;
    await withTransaction(async run => {
      for (let offset = 0; offset < employeeIds.length; offset += 500) {
        const batch = employeeIds.slice(offset, offset + 500);
        const params = batch.map((id, index) => ({ name: `employeeId${index}`, value: id }));
        const ids = batch.map((_, index) => `@employeeId${index}`).join(",");
        const result = await run(
          `UPDATE dbo.tblEmployee SET EmployeeProfileTypeID=@profileId
           WHERE EmployeeID IN (${ids}) AND ISNULL(EmployeeProfileTypeID,0)<>@profileId`,
          [{ name: "profileId", value: profile.id }, ...params],
        );
        updated += result.rowsAffected.reduce((sum, count) => sum + count, 0);
      }
    });
    clearReadCache();
    return NextResponse.json({ ok: true, updated, profile: profile.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Selected employees could not be transferred.";
    const status = message === "Unauthorized" ? 401
      : error instanceof z.ZodError || error instanceof SyntaxError ? 400
        : error instanceof WritesDisabledError ? 403 : 500;
    if (status === 500) console.error("[api/employees/profile-transfer] Transfer failed:", error);
    return NextResponse.json({ ok: false, error: status === 500 ? "The selected employees could not be transferred." : message }, { status });
  }
}
