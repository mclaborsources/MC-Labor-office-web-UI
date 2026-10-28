import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { getPool, queryReadOnlyUncached } from "@/lib/db/sql";
import { deleteEmployeeSavedView, ensureEmployeeSavedViewsTable, saveEmployeeSavedView } from "@/lib/employeeSavedViewsDb";
import { employeeSavedViewSchema, employeeViewLayoutSchema, normalizeEmployeeSavedView } from "@/lib/employeeSavedViews";

export const runtime = "nodejs";

async function userKey() {
  const session = await requireSession();
  return session.user!.officeStaffId ? `staff:${session.user!.officeStaffId}` : session.user!.userId;
}

function failure(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Sign in to save employee views." }, { status: 401 });
  if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "The employee view settings are invalid." }, { status: 400 });
  if (error instanceof Error && error.message === "You do not have permission to delete data.") return NextResponse.json({ error: "Your account cannot delete saved views." }, { status: 403 });
  const sqlError = error as { number?: number; originalError?: { info?: { number?: number } }; precedingErrors?: Array<{ number?: number }> };
  const number = sqlError?.number ?? sqlError?.originalError?.info?.number ?? sqlError?.precedingErrors?.[0]?.number;
  if (number === 208) return NextResponse.json({ error: "The employee saved-views table is missing. It will be created when the database account has CREATE TABLE permission." }, { status: 503 });
  if (number === 229 || number === 230) return NextResponse.json({ error: "The app’s SQL account needs SELECT, INSERT, UPDATE, and DELETE access to dbo.WebEmployeeSavedView." }, { status: 503 });
  if (number === 916) return NextResponse.json({ error: "The app’s SQL account cannot access the configured database." }, { status: 503 });
  if (number === 1205 || number === 2601 || number === 2627) return NextResponse.json({ error: "This view changed in another session. Reload the employee views and try again." }, { status: 409 });
  console.error("[employee-saved-views]", error);
  return NextResponse.json({ error: "The database could not save or load employee views. Please retry." }, { status: 500 });
}

export async function GET() {
  try {
    const user = await userKey();
    await ensureEmployeeSavedViewsTable(await getPool());
    const rows = await queryReadOnlyUncached<{ slot: number; name: string; layout: string }>(
      "SELECT Slot AS slot, ViewName AS name, LayoutJson AS layout FROM dbo.WebEmployeeSavedView WHERE UserKey=@user ORDER BY Slot",
      [{ name: "user", value: user }],
    );
    return NextResponse.json({ views: rows.map(row => normalizeEmployeeSavedView({ ...row, layout: JSON.parse(row.layout) })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function PUT(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await userKey();
    const text = await request.text();
    if (text.length > 1_000_000) return NextResponse.json({ error: "Employee view settings are too large." }, { status: 413 });
    const view = employeeSavedViewSchema.parse(JSON.parse(text));
    const pool = await getPool();
    await ensureEmployeeSavedViewsTable(pool);
    await saveEmployeeSavedView(pool, user, view.slot, view.name, JSON.stringify(employeeViewLayoutSchema.parse(view.layout)));
    return NextResponse.json({ view });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await userKey();
    const { slot } = z.object({ slot: z.number().int().min(1).max(64) }).parse(await request.json());
    const pool = await getPool();
    await ensureEmployeeSavedViewsTable(pool);
    await deleteEmployeeSavedView(pool, user, slot);
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}
