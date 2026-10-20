import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "@/lib/auth/constants";
import type { SessionData } from "@/types/auth";
import { defaultSession } from "@/types/auth";
import { getDatabaseSettings } from "@/lib/config/database";
import { redirect } from "next/navigation";
import { needsAccountSetup } from "@/lib/config/env";
import { isLocalMode, isOfficeStaffMode } from "@/lib/auth/mode";
import { officeStaffActive } from "@/lib/auth/office-staff";
import { queryReadOnlyUncached } from "@/lib/db/sql";

export async function getSession() {
  if (needsAccountSetup()) redirect("/welcome");
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions(),
  );
  if (isLocalMode()) {
    session.user = { userId: "local-office", username: "local", displayName: "Local Office", active: true, roles: ["admin"] };
    session.isLoggedIn = true;
  }
  if (isOfficeStaffMode() && session.isLoggedIn) {
    const staffId = session.user?.officeStaffId;
    const validLogin = staffId && session.officeStaffLoginId ? await queryReadOnlyUncached(`SELECT OfficeStaffLoginID FROM tblOfficeStaffLogin
      WHERE OfficeStaffLoginID=@login AND OfficeStaffID=@staff AND OfficeStaffLogoutTimestamp IS NULL
        AND OfficeStaffLoginTimestamp>DATEADD(hour,-8,GETDATE())`,
    [{ name: "login", value: session.officeStaffLoginId }, { name: "staff", value: staffId }]) : [];
    if (!staffId || !validLogin.length || !(await officeStaffActive(staffId))) {
      session.isLoggedIn = false;
      session.user = undefined;
    }
  }
  return session;
}

export async function getSessionOrDefault(checkDatabase = true): Promise<SessionData> {
  const session = await getSession();
  if (isOfficeStaffMode() && session.needsLoginPrompts) redirect("/login");
  if (!session.isLoggedIn) {
    if (isOfficeStaffMode()) redirect("/login");
    return { ...defaultSession };
  }
  if (checkDatabase) {
    let configured = false;
    try { configured = Boolean(getDatabaseSettings()); } catch { /* Recover in setup. */ }
    if (!configured) redirect("/setup");
  }
  return session;
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.active || session.needsLoginPrompts) {
    throw new Error("Unauthorized");
  }
  return session;
}
