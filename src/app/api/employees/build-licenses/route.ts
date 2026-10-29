import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnlyUncached } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ howReferredId: z.number().int().positive(), confirm: z.boolean().optional() });

export async function GET() {
  try {
    await requireSession();
    const boards = await queryReadOnlyUncached<{ value: string; label: string }>(
      `SELECT CAST(PullDownHowReferredID AS NVARCHAR(20)) AS value,
              LTRIM(RTRIM(PullDownHowReferred)) AS label
       FROM dbo.tblPullDownHowReferred WITH (NOLOCK)
       WHERE ISNULL(PullDownHowReferredActive,1)=1
         AND PullDownHowReferredStateID IS NOT NULL
       ORDER BY PullDownHowReferredSort, PullDownHowReferred`,
    );
    return NextResponse.json({ ok: true, boards });
  } catch (error) {
    console.error("[api/employees/build-licenses] Could not load license boards:", error);
    return NextResponse.json({ ok: false, error: "License boards could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    await requireSession();
    const body = bodySchema.parse(await request.json());
    const [board] = await queryReadOnlyUncached<{ id: number; name: string }>(
      `SELECT PullDownHowReferredID AS id, LTRIM(RTRIM(PullDownHowReferred)) AS name
       FROM dbo.tblPullDownHowReferred WITH (NOLOCK)
       WHERE PullDownHowReferredID=@id AND ISNULL(PullDownHowReferredActive,1)=1
         AND PullDownHowReferredStateID IS NOT NULL`,
      [{ name: "id", value: body.howReferredId }],
    );
    if (!board) return NextResponse.json({ ok: false, error: "Choose a valid license board." }, { status: 400 });

    const stage = `
      IF OBJECT_ID('tempdb..#RayEmployeeLicenses') IS NOT NULL DROP TABLE #RayEmployeeLicenses;
      CREATE TABLE #RayEmployeeLicenses (
        EmployeeID INT NOT NULL,
        EmployeeLicenseStateID INT NOT NULL,
        EmployeeLicenseTradeID INT NOT NULL,
        EmployeeLicenseTypeID INT NOT NULL,
        EmployeeLicenseNumber NVARCHAR(255) NULL,
        MatchFound BIT NOT NULL DEFAULT(0)
      );
      INSERT INTO #RayEmployeeLicenses (EmployeeID,EmployeeLicenseStateID,EmployeeLicenseTradeID,EmployeeLicenseTypeID,EmployeeLicenseNumber)
      SELECT e.EmployeeID, hr.PullDownHowReferredStateID, e.EmTradeID, lt.PullDownLicenseTypeID, eb.LicenseNumber
      FROM dbo.tblEmployee e
      INNER JOIN dbo.tblPullDownHowReferred hr ON hr.PullDownHowReferredID=e.EmHowReferredID
      INNER JOIN dbo.tblPullDownQualifications q ON q.PullDownQualificationID=e.EmQualificationID
      INNER JOIN dbo.tblPullDownLicenseTypes lt ON lt.PullDownLicenseType=q.PullDownLicenseType
      INNER JOIN dbo.tblEmployeeB eb ON eb.EmployeeID=e.EmployeeID
      WHERE hr.PullDownHowReferredID=@id AND hr.PullDownHowReferredStateID IS NOT NULL AND e.EmTradeID IS NOT NULL;`;

    if (!body.confirm) {
      const [preview] = await queryReadOnlyUncached<{ count: number }>(
        `SELECT COUNT(1) AS count
         FROM dbo.tblEmployee e
         INNER JOIN dbo.tblPullDownHowReferred hr ON hr.PullDownHowReferredID=e.EmHowReferredID
         INNER JOIN dbo.tblPullDownQualifications q ON q.PullDownQualificationID=e.EmQualificationID
         INNER JOIN dbo.tblPullDownLicenseTypes lt ON lt.PullDownLicenseType=q.PullDownLicenseType
         INNER JOIN dbo.tblEmployeeB eb ON eb.EmployeeID=e.EmployeeID
         WHERE hr.PullDownHowReferredID=@id AND hr.PullDownHowReferredStateID IS NOT NULL AND e.EmTradeID IS NOT NULL`,
        [{ name: "id", value: body.howReferredId }],
      );
      const count = Number(preview?.count ?? 0);
      return NextResponse.json({ ok: true, preview: true, count, board: board.name });
    }

    let counts = { matched: 0, added: 0, removedStateOnly: 0, updatedEmployees: 0 };
    await withTransaction(async run => {
      await run(stage, [{ name: "id", value: body.howReferredId }]);
      const matched = await run(`UPDATE s SET MatchFound=1 FROM #RayEmployeeLicenses s
        INNER JOIN dbo.tblEmployeeLicenses l ON l.EmployeeID=s.EmployeeID
         AND l.EmployeeLicenseStateID=s.EmployeeLicenseStateID
         AND l.EmployeeLicenseTradeID=s.EmployeeLicenseTradeID
         AND l.EmployeeLicenseTypeID=s.EmployeeLicenseTypeID`);
      counts.matched = matched.rowsAffected.reduce((a, b) => a + b, 0);
      const added = await run(`INSERT INTO dbo.tblEmployeeLicenses
        (EmployeeID,EmployeeLicenseStateID,EmployeeLicenseTradeID,EmployeeLicenseTypeID,EmployeeLicenseNumber)
        SELECT s.EmployeeID,s.EmployeeLicenseStateID,s.EmployeeLicenseTradeID,s.EmployeeLicenseTypeID,s.EmployeeLicenseNumber
        FROM #RayEmployeeLicenses s WHERE s.MatchFound=0`);
      counts.added = added.rowsAffected.reduce((a, b) => a + b, 0);
      const removed = await run(`DELETE l FROM dbo.tblEmployeeLicenses l
        INNER JOIN dbo.tblPullDownHowReferred h ON h.PullDownHowReferredStateID=l.EmployeeLicenseStateID
        WHERE h.PullDownHowReferredID=@id AND l.EmployeeLicenseExpDate IS NULL
          AND l.EmployeeLicenseCopyOnFile IS NULL AND l.EmployeeLicenseNotes IS NULL
          AND l.EmployeeLicenseTradeID IS NULL AND l.EmployeeLicenseTypeID IS NULL
          AND l.EmployeeLicenseNumber IS NULL`, [{ name: "id", value: body.howReferredId }]);
      counts.removedStateOnly = removed.rowsAffected.reduce((a, b) => a + b, 0);
      const updated = await run(`UPDATE e SET EmLicensedIn = NULLIF(STUFF((
          SELECT ', ' + s.PullDownState
            + CASE WHEN t.PullDownTradeSwitch IS NULL THEN '' ELSE '-' + t.PullDownTradeSwitch END
            + CASE WHEN lt.PullDownLicenseTypeSwitch IS NULL THEN '' ELSE '-' + lt.PullDownLicenseTypeSwitch END
          FROM dbo.tblEmployeeLicenses l
          INNER JOIN dbo.tblPullDownStates s ON s.PullDownStateID=l.EmployeeLicenseStateID
          LEFT JOIN dbo.tblPullDownTrade t ON t.PullDownTradeID=l.EmployeeLicenseTradeID
          LEFT JOIN dbo.tblPullDownLicenseTypes lt ON lt.PullDownLicenseTypeID=l.EmployeeLicenseTypeID
          WHERE l.EmployeeID=e.EmployeeID
          ORDER BY s.PullDownState,t.PullDownTradeSwitch,lt.PullDownLicenseTypeSwitch
          FOR XML PATH(''), TYPE).value('.','nvarchar(max)'),1,2,''), '')
        FROM dbo.tblEmployee e WHERE EXISTS (SELECT 1 FROM #RayEmployeeLicenses x WHERE x.EmployeeID=e.EmployeeID)`);
      counts.updatedEmployees = updated.rowsAffected.reduce((a, b) => a + b, 0);
    });
    clearReadCache();
    return NextResponse.json({ ok: true, board: board.name, ...counts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "License records could not be built.";
    const status = message === "Unauthorized" ? 401 : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : error instanceof WritesDisabledError ? 403 : 500;
    if (status === 500) console.error("[api/employees/build-licenses] Build failed:", error);
    return NextResponse.json({ ok: false, error: status === 500 ? "License records could not be built." : message }, { status });
  }
}
