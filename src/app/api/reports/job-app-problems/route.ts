import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 });
  }

  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  try {
    const data = await queryReadOnly(`
      SELECT TOP (5000)
        t.TrackingID AS id,
        ISNULL(t.CustomerBusName,'') AS Customer,
        ISNULL(t.AssignmentUserName,'') AS Salesman,
        ISNULL(t.SiteName,'') AS Job,
        ISNULL(p.SiteStreet,'') AS [Job Street],
        ISNULL(sc.City,'') AS [Job City],
        COALESCE(st.PullDownState,t.SiteState,'') AS [Job State],
        ISNULL(t.EmFirstName,'') AS [Em First Name],
        ISNULL(t.EmMiddle,'') AS MI,
        ISNULL(t.EmLastName,'') AS [Em Last Name],
        ISNULL(t.EmMobilePhone,'') AS Cell,
        ISNULL(f.CustomerForeman,'') AS Foreman,
        ISNULL(f.CustomerForemanPhone,'') AS [Foreman Cell],
        CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS [Week Ending],
        ISNULL(t.JobApplicationStatusDesc,'') AS [Job App Status],
        ISNULL(t.PayrollCoOnSiteInitials,'') AS Pay,
        t.TrackMargin AS Margin,
        ISNULL(t.HoursNote,'') AS [Check Note]
      FROM tblTracking t WITH (NOLOCK)
      LEFT JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=t.ProjectID
      LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
      LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
      LEFT JOIN tblCustomerForeman f WITH (NOLOCK) ON f.CustomerForemanID=p.SiteForemanID
      WHERE @search=N'' OR CONCAT(ISNULL(t.EmFirstName,''),' ',ISNULL(t.EmMiddle,''),' ',ISNULL(t.EmLastName,''),' ',ISNULL(t.EmMobilePhone,'')) LIKE N'%' + @search + N'%'
      ORDER BY t.WeekEndingDate DESC,t.CustomerBusName,t.SiteName,t.TrackingID DESC`,
    [{ name: "search", value: search }]);
    return NextResponse.json({ ok: true, data, count: data.length });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load MLS job application records." }, { status: 500 });
  }
}
