import { queryReadOnly } from "@/lib/db/sql";

export interface AllEmployeesOnJobRow {
  id: string;
  employeeId: string;
  customer: string;
  job: string;
  city: string;
  state: string;
  first: string;
  middle: string;
  last: string;
  trade: string;
  cell: string;
  status: string;
  weekEnding: string;
  firstWeek: string;
  lastWeek: string;
}

/** All recorded employee/job assignments, with first/last assignment weeks. */
export function getAllEmployeesOnJobRows(): Promise<AllEmployeesOnJobRow[]> {
  return queryReadOnly<AllEmployeesOnJobRow>(`WITH history AS (
    SELECT t.TrackingID,t.EmployeeID,t.CustomerBusName,t.SiteName,
      ISNULL(siteCity.City,'') AS JobCity,ISNULL(siteState.PullDownState,'') AS JobState,
      t.EmFirstName,t.EmMiddle,t.EmLastName,t.EmMobilePhone,t.WeekEndingDate,
      e.EmEmployeeStatusID,e.EmTradeID,
      MIN(t.WeekEndingDate) OVER (PARTITION BY t.EmployeeID) AS FirstWeek,
      MAX(t.WeekEndingDate) OVER (PARTITION BY t.EmployeeID) AS LastWeek
    FROM dbo.tblTracking t WITH (NOLOCK)
    LEFT JOIN dbo.tblProject p WITH (NOLOCK) ON p.ProjectID=t.ProjectID
    LEFT JOIN dbo.tblPullDownStateCities siteCity WITH (NOLOCK) ON siteCity.PullDownStateCityID=p.SiteStateCityID
    LEFT JOIN dbo.tblPullDownStates siteState WITH (NOLOCK) ON siteState.PullDownStateID=siteCity.StateID
    LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
    WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL AND t.WeekEndingDate IS NOT NULL
  )
  SELECT TOP (10000) CAST(h.TrackingID AS NVARCHAR(30)) id,
    CAST(h.EmployeeID AS NVARCHAR(30)) employeeId,
    ISNULL(h.CustomerBusName,'') customer,ISNULL(h.SiteName,'') job,
    ISNULL(h.JobCity,'') city,ISNULL(h.JobState,'') state,
    ISNULL(h.EmFirstName,'') first,ISNULL(h.EmMiddle,'') middle,ISNULL(h.EmLastName,'') last,
    ISNULL(tr.PullDownTrade,'') trade,ISNULL(h.EmMobilePhone,'') cell,
    ISNULL(es.PullDownEmployeeStatus,'') status,
    CONVERT(VARCHAR(10),h.WeekEndingDate,101) weekEnding,
    CONVERT(VARCHAR(10),h.FirstWeek,101) firstWeek,
    CONVERT(VARCHAR(10),h.LastWeek,101) lastWeek
  FROM history h
  LEFT JOIN dbo.tblPullDownTrade tr WITH (NOLOCK) ON tr.PullDownTradeID=h.EmTradeID
  LEFT JOIN dbo.tblPullDownEmployeeStatus es WITH (NOLOCK) ON es.PullDownEmployeeStatusID=h.EmEmployeeStatusID
  ORDER BY h.EmLastName,h.EmFirstName,h.WeekEndingDate DESC,h.TrackingID DESC`);
}
