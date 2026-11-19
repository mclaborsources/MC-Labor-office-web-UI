import {checkDatabaseCompatibility,type CompatibilityReport} from "@/lib/db/compatibility";
import {ensureAccountingSavedViewsTable,verifyAccountingSavedViewsAccess} from "@/lib/accountingSavedViewsDb";
import {sqlRecoverySession} from "@/lib/auth/sql-recovery-session";
import {isSqlDisconnected,setSqlDisconnected} from "@/lib/db/connection-state";
import {getIronSession} from "iron-session";
import {cookies} from "next/headers";
import {getSessionOptions} from "@/lib/auth/constants";
import type {SessionData} from "@/types/auth";
import { NextResponse } from "next/server";
import sql from "mssql";
import { requireSession } from "@/lib/auth/session";
import { databaseSchema, saveDatabaseSettings } from "@/lib/config/database";
import { buildConfig, closePool } from "@/lib/db/sql";
import { hasSameOrigin } from "@/lib/auth/origin";
import { connectionErrorMessage } from "@/lib/db/connectionError";
import { ensureCustomerSavedViewsTable, verifyCustomerSavedViewsAccess } from "@/lib/customerSavedViewsDb";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const reconnecting = isSqlDisconnected();
  // Explicitly disconnected installations reconnect with SQL credentials.
  // Changing an active connection still requires an office administrator.
  try {
    if (!reconnecting) {
      const session = await requireSession();
      if (!session.user?.roles.includes("admin")) throw new Error("Unauthorized");
    }
  } catch {
    return NextResponse.json({ error: "An office administrator login is required to change an active SQL connection.",code:"ADMIN_REQUIRED" }, { status: 403 });
  }
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = databaseSchema.safeParse(body?.settings);
  if (!parsed.success || !["test", "save"].includes(body?.action)) {
    return NextResponse.json({ error: "Enter valid connection details. Use a port or an instance name, not both." }, { status: 400 });
  }
  if (!parsed.data.password && isSqlDisconnected())return NextResponse.json({error:"Enter the SQL password to reconnect."},{status:400});
  if (!parsed.data.password) {
    const officePassword = process.env.SQL_SETUP_PASSWORD;
    if (!officePassword) {
      return NextResponse.json({ error: "The office password has not been configured for this installation. Enter the SQL password." }, { status: 400 });
    }
    parsed.data.password = officePassword;
  }
  let compatibility:CompatibilityReport|undefined;
  const candidate = new sql.ConnectionPool(buildConfig(parsed.data));
  try {
    await candidate.connect();
    await candidate.request().query("SELECT 1 AS ok");
    compatibility=await checkDatabaseCompatibility(candidate);
    if(!compatibility.ok)return NextResponse.json({error:"This database is not ready for all app features. Ask its database administrator to resolve the listed tables, columns, or permissions.",compatibility},{status:400});
    if (body.action === "save") {
      // Install the per-user view preferences table as part of first-run/relink
      // setup so staff do not need a separate manual SQL step.
      await ensureCustomerSavedViewsTable(candidate);
      // Verify the configured SQL account can read, insert, update, and delete
      // saved preferences. The probe is rolled back and leaves no row behind.
      await verifyCustomerSavedViewsAccess(candidate);
      await ensureAccountingSavedViewsTable(candidate);
      await verifyAccountingSavedViewsAccess(candidate);
    }
  } catch (error) {
    if(body.action === "save") {
      console.error("[database-setup] saved-view table initialization failed", error);
      return NextResponse.json({ error: "Could not enable saved views for this SQL connection. The app account needs SELECT, INSERT, UPDATE, and DELETE access to dbo.WebCustomerSavedView (and CREATE TABLE on first setup). Ask a database administrator to grant the missing database access, then save the connection again." }, { status: 400 });
    }
    return NextResponse.json({ error: connectionErrorMessage(error) }, { status: 400 });
  } finally {
    await candidate.close().catch(() => undefined);
  }
  if (body.action === "save") {
    try {
      await saveDatabaseSettings(parsed.data);
      await closePool();
      setSqlDisconnected(false);
      (await sqlRecoverySession()).destroy();
      const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
      session.destroy();
    } catch {
      return NextResponse.json({ error: "Could not finish saving the connection. Check local configuration access and try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true,compatibility });
}
