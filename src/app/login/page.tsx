import { redirect } from "next/navigation";
import { needsAccountSetup } from "@/lib/config/env";
import LoginForm from "@/components/LoginForm";
import { isLocalMode, isOfficeStaffMode } from "@/lib/auth/mode";
import { listOfficeStaff, type OfficeStaffOption } from "@/lib/auth/office-staff";
import { getSession } from "@/lib/auth/session";
import { readLoginPrompts } from "@/lib/auth/login-prompts";
import { LoginNotices } from "@/components/LoginNotices";

export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (isLocalMode()) redirect("/");
  if (needsAccountSetup()) redirect("/welcome");
  if (isOfficeStaffMode()) {
    const session = await getSession();
    if (session.isLoggedIn) {
      if (!session.needsLoginPrompts) redirect("/dashboard");
      return <LoginNotices initial={await readLoginPrompts(session)} />;
    }
  }
  let staff: OfficeStaffOption[] = [];
  let error = "";
  if (isOfficeStaffMode()) {
    try { staff = await listOfficeStaff(); }
    catch { error = "Office accounts could not be loaded. Check the office database connection."; }
  }
  return <LoginForm officeStaff={isOfficeStaffMode() ? staff : undefined} initialError={error} />;
}
