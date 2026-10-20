import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOfficeFeatures, endOfficeLogin } from "@/lib/auth/office-staff";
import { officeRouteAllowed } from "@/lib/auth/office-permissions";
import { queryReadOnlyUncached } from "@/lib/db/sql";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const id = session.user?.officeStaffId;
    if (!session.isLoggedIn || !id || !session.officeStaffLoginId) return NextResponse.json({ allowed: false }, { status: 401 });
    if (session.needsLoginPrompts) return NextResponse.json({ allowed: false, noticesPending: true }, { status: 409 });
    const login = await queryReadOnlyUncached(`SELECT OfficeStaffLoginID FROM tblOfficeStaffLogin
      WHERE OfficeStaffLoginID=@login AND OfficeStaffID=@staff AND OfficeStaffLogoutTimestamp IS NULL
        AND OfficeStaffLoginTimestamp>DATEADD(hour,-8,GETDATE())`,
    [{ name: "login", value: session.officeStaffLoginId }, { name: "staff", value: id }]);
    if (!login.length) {
      await endOfficeLogin(session.officeStaffLoginId, id, "Timeout");
      return NextResponse.json({ allowed: false }, { status: 401 });
    }
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "/";
    const features = await getOfficeFeatures(id);
    if (!officeRouteAllowed(path, features)) return NextResponse.json({ allowed: false }, { status: 403 });
    if (url.searchParams.get("method") === "DELETE") {
      const staff = await queryReadOnlyUncached(`SELECT OfficeStaffID FROM tblOfficeStaff WHERE OfficeStaffID=@id AND OfficeStaffCanDelete=1`, [{ name: "id", value: id }]);
      if (!staff.length) return NextResponse.json({ allowed: false }, { status: 403 });
    }
    return NextResponse.json({ allowed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ allowed: false }, { status: 503 });
  }
}
