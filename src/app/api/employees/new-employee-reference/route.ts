import { NextRequest, NextResponse } from "next/server";
import { queryReadOnly } from "@/lib/db/sql";

export async function GET(request: NextRequest) {
  const first = request.nextUrl.searchParams.get("first")?.trim() ?? "";
  const last = request.nextUrl.searchParams.get("last")?.trim() ?? "";

  try {
    const [grades, trades, referrals, qualifications, similar] = await Promise.all([
      queryReadOnly<{ value: string; label: string }>(`SELECT CAST(PullDownGradeID AS NVARCHAR(20)) value, ISNULL(PullDownGrade,'') label FROM tblPullDownGrades WITH (NOLOCK) ORDER BY PullDownGradeSort, PullDownGrade`),
      queryReadOnly<{ value: string; label: string }>(`SELECT CAST(PullDownTradeID AS NVARCHAR(20)) value, ISNULL(PullDownTrade,'') label FROM tblPullDownTrade WITH (NOLOCK) ORDER BY PullDownTrade`),
      queryReadOnly<{ value: string; label: string }>(`SELECT CAST(PullDownHowReferredID AS NVARCHAR(20)) value, ISNULL(PullDownHowReferred,'') label FROM tblPullDownHowReferred WITH (NOLOCK) WHERE ISNULL(PullDownHowReferredActive,1)=1 ORDER BY PullDownHowReferredSort, PullDownHowReferred`),
      queryReadOnly<{ value: string; label: string }>(`SELECT CAST(PullDownQualificationID AS NVARCHAR(20)) value, ISNULL(PullDownQualification,'') label FROM tblPullDownQualifications WITH (NOLOCK) ORDER BY PullDownQualification`),
      first && last ? queryReadOnly<Record<string, unknown>>(
        `SELECT TOP (50) EmployeeID, ISNULL(EmFirstName,'') firstName, ISNULL(EmLastName,'') lastName,
                ISNULL(EmMiddle,'') middleInitial, ISNULL(EmCity,'') city,
                ISNULL(EmMobilePhone,'') mobilePhone, ISNULL(EmHomePhone,'') homePhone,
                ISNULL(EmEmail,'') email, CONVERT(VARCHAR(10), EmDOB, 101) dateOfBirth,
                CASE WHEN SSNum IS NULL OR LTRIM(RTRIM(SSNum))='' THEN '' ELSE 'On file' END socialSecurity
         FROM tblEmployee WITH (NOLOCK)
         WHERE REPLACE(ISNULL(EmFirstName,''),' ','') = REPLACE(@first,' ','')
           AND REPLACE(ISNULL(EmLastName,''),' ','') = REPLACE(@last,' ','')
         ORDER BY EmployeeID DESC`,
        [{ name: "first", value: first }, { name: "last", value: last }],
      ) : Promise.resolve([]),
    ]);
    return NextResponse.json({ ok: true, grades, trades, referrals, qualifications, similar });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Database lookup failed." }, { status: 500 });
  }
}
