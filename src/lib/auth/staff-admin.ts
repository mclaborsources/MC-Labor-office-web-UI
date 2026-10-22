import { getSession } from "./session";
import { isOfficeStaffMode } from "./mode";
import { getOfficeFeatures } from "./office-staff";
import { officeFeatureAllowed } from "./office-permissions";
import { hasSameOrigin } from "./origin";

export class StaffAdminError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function requireStaffAdmin(request?: Request) {
  if (request && request.method !== "GET" && !hasSameOrigin(request)) throw new StaffAdminError("Invalid request origin.", 403);
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.active || session.needsLoginPrompts) throw new StaffAdminError("Sign in before managing office staff.", 401);
  const allowed = isOfficeStaffMode()
    ? !!session.user.officeStaffId && officeFeatureAllowed(await getOfficeFeatures(session.user.officeStaffId), "frmOfficeStaffPermission")
    : session.user.roles.includes("admin");
  if (!allowed) throw new StaffAdminError("You do not have permission to manage office staff.", 403);
  return session;
}
