import { NextResponse } from "next/server";
import { authenticateOfficeStaff, getOfficeFeatures, matchesAccessPassword } from "@/lib/auth/office-staff";
import { officeFeatureAllowed } from "@/lib/auth/office-permissions";
import { isOfficeStaffMode } from "@/lib/auth/mode";
import { hasSameOrigin } from "@/lib/auth/origin";
import { queryReadOnlyUncached } from "@/lib/db/sql";
import { queryWrite } from "@/lib/db/write";

export async function POST(request: Request) {
  if (!isOfficeStaffMode()) return NextResponse.json({ error: "Office staff login is not enabled." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    const id = Number(body.officeStaffId);
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    if (!Number.isSafeInteger(id) || id <= 0 || !current || current.length > 1024 || !["check", "save"].includes(body.action)) return NextResponse.json({ error: "Select your account and enter your current password." }, { status: 400 });
    const user = await authenticateOfficeStaff(id, current);
    if (!user) return NextResponse.json({ error: "Invalid account or current password." }, { status: 401 });
    if (!officeFeatureAllowed(await getOfficeFeatures(id), "frmChangePassword")) return NextResponse.json({ error: "You do not have permission to change your password. Contact your office administrator." }, { status: 403 });
    if (body.action === "check") return NextResponse.json({ ok: true });
    const password = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmation = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    if (!password.trim() || !confirmation || !matchesAccessPassword(password, confirmation)) return NextResponse.json({ error: "Enter a new password and matching confirmation." }, { status: 400 });
    const [column] = await queryReadOnlyUncached<{ length: number }>(`SELECT CHARACTER_MAXIMUM_LENGTH AS length FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblOfficeStaff' AND COLUMN_NAME='OfficeStaffPassword'`);
    if (!column || password.length > (column.length === -1 ? 1024 : column.length)) return NextResponse.json({ error: `The new password exceeds the database field limit${column && column.length > 0 ? ` of ${column.length} characters` : ""}.` }, { status: 400 });
    const changed = await queryWrite(`UPDATE tblOfficeStaff SET OfficeStaffPassword=@password
      WHERE OfficeStaffID=@id AND OfficeStaffPassword=@current AND OfficeStaffActive=1 AND ISNULL(Profile,0)=0
      AND EXISTS (SELECT 1 FROM tblOfficeStaffPermission p JOIN tblFeature f ON f.FeatureID=p.FeatureID
        WHERE p.OfficeStaffID=@id AND f.ObjectName='frmChangePassword' AND f.FeatureActive=1)`,
    [{ name: "password", value: password }, { name: "current", value: current }, { name: "id", value: id }]);
    if (changed !== 1) return NextResponse.json({ error: "The account or password changed. Enter your current password and try again." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Too many attempts")) return NextResponse.json({ error: error.message }, { status: 429 });
    return NextResponse.json({ error: "Password could not be changed. Please retry or contact your administrator." }, { status: 503 });
  }
}
