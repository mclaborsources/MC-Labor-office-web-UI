import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnlyUncached } from "@/lib/db/sql";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.user?.officeStaffId) return NextResponse.json({ users: [] });
    const users = await queryReadOnlyUncached<{ name: string }>(`SELECT DISTINCT s.OfficeStaffFullName AS name
      FROM tblOfficeStaffLogin l INNER JOIN tblOfficeStaff s ON s.OfficeStaffID=l.OfficeStaffID
      WHERE l.OfficeStaffLogoutTimestamp IS NULL AND l.OfficeStaffID<>@id AND s.OfficeStaffActive=1
        AND l.OfficeStaffLoginTimestamp>=CAST(GETDATE() AS DATE)
        AND (l.NetworkName NOT LIKE 'WEB:%' OR l.OfficeStaffLoginTimestamp>DATEADD(hour,-8,GETDATE()))
      ORDER BY s.OfficeStaffFullName`, [{ name: "id", value: session.user.officeStaffId }]);
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Login activity unavailable." }, { status: 401 });
  }
}
