import { NextResponse } from "next/server";
import sql from "mssql";
import { requireSession } from "@/lib/auth/session";
import { databaseSchema, saveDatabaseSettings } from "@/lib/config/database";
import { buildConfig, closePool } from "@/lib/db/sql";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  try {
    const session = await requireSession();
    if (!session.user?.roles.includes("admin")) throw new Error("Unauthorized");
  } catch {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 403 });
  }
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = databaseSchema.safeParse(body?.settings);
  if (!parsed.success || !["test", "save"].includes(body?.action)) {
    return NextResponse.json({ error: "Enter valid connection details. Use a port or an instance name, not both." }, { status: 400 });
  }
  if (!parsed.data.password) {
    const officePassword = process.env.SQL_SETUP_PASSWORD;
    if (!officePassword) {
      return NextResponse.json({ error: "The office password has not been configured for this installation. Enter the SQL password." }, { status: 400 });
    }
    parsed.data.password = officePassword;
  }
  const candidate = new sql.ConnectionPool(buildConfig(parsed.data));
  try {
    await candidate.connect();
    await candidate.request().query("SELECT 1 AS ok");
  } catch {
    return NextResponse.json({ error: "Cannot connect. Check the server, database, credentials, network access and encryption settings." }, { status: 400 });
  } finally {
    await candidate.close().catch(() => undefined);
  }
  if (body.action === "save") {
    try {
      await saveDatabaseSettings(parsed.data);
      await closePool();
    } catch {
      return NextResponse.json({ error: "Could not finish saving the connection. Check local configuration access and try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
