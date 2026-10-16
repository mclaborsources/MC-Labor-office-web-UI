import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { clearReadCache } from "@/lib/db/sql";
import { queryWrite } from "@/lib/db/write";
import { getAlertsData } from "@/lib/alerts";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ ok: true, ...(await getAlertsData()) });
  } catch (cause) {
    return NextResponse.json({ ok: false, error: cause instanceof Error ? cause.message : "Unable to load alerts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json() as { action?: string; id?: number; typeId?: number; alert?: string };
    const user = session.user?.displayName || session.user?.username || "Web User";
    if (body.action === "complete") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Select a valid alert.");
      const affected = await queryWrite(`UPDATE dbo.tblAlerts SET AlertCompletedUserName=@user,AlertCompletedTimestamp=GETDATE()
        WHERE AlertID=@id AND AlertCompletedTimestamp IS NULL`, [{ name: "user", value: user }, { name: "id", value: id }]);
      if (!affected) throw new Error("Alert was not found or has already been completed.");
    } else if (body.action === "add") {
      const alert = String(body.alert ?? "").trim();
      const typeId = Number(body.typeId);
      if (!alert || alert.length > 8000 || !Number.isSafeInteger(typeId) || typeId <= 0) throw new Error("Choose a type and enter an alert.");
      const affected = await queryWrite(`INSERT INTO dbo.tblAlerts(Alert,AlertTypeID,AlertUserName,AlertTimestamp)
        SELECT @alert,@typeId,@user,GETDATE() WHERE EXISTS (
          SELECT 1 FROM dbo.tblPullDownAlertTypes WHERE PullDownAlertTypeID=@typeId AND ISNULL(PullDownAlertTypeActive,1)=1)`,
        [{ name: "alert", value: alert }, { name: "typeId", value: typeId }, { name: "user", value: user }]);
      if (!affected) throw new Error("The selected alert type is no longer active.");
    } else if (body.action === "delete") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Select a valid alert.");
      const affected = await queryWrite("DELETE FROM dbo.tblAlerts WHERE AlertID=@id", [{ name: "id", value: id }]);
      if (!affected) throw new Error("Alert was not found.");
    } else {
      throw new Error("Unsupported alert action.");
    }
    clearReadCache();
    return NextResponse.json({ ok: true });
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Unable to save alert.";
    return NextResponse.json({ ok: false, error }, { status: error.includes("Write operations are disabled") ? 503 : 400 });
  }
}
