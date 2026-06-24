import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db/sql";

export async function GET() {
  const result = await testConnection();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Database connection failed." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, database: result.database });
}
