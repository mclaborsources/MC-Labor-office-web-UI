import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db/sql";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireSession(); }
  catch { return NextResponse.json({ ok: false, error: "Sign in to check the database connection." }, { status: 401 }); }
  const result = await testConnection();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Database connection failed." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, database: result.database });
}
