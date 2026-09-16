import { queryReadOnly } from "@/lib/db/sql";

export interface HealthInsuranceRow {
  id: string;
  employeeId: string;
  customer: string;
  salesman: string;
  job: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  cell: string;
  weekEnding: string;
  healthInsurance: string;
  margin: number | null;
}

export function getHealthInsuranceRows(minWeekEndingDate: string) {
  return queryReadOnly<HealthInsuranceRow>(
    `SELECT TOP (2000)
       CAST(t.TrackingID AS NVARCHAR(20)) AS id,
       CAST(ISNULL(t.EmployeeID, 0) AS NVARCHAR(20)) AS employeeId,
       ISNULL(t.CustomerBusName, '') AS customer,
       ISNULL(t.AssignmentUserName, '') AS salesman,
       ISNULL(t.SiteName, '') AS job,
       ISNULL(t.EmFirstName, '') AS firstName,
       ISNULL(t.EmMiddle, '') AS middleInitial,
       ISNULL(t.EmLastName, '') AS lastName,
       ISNULL(t.EmMobilePhone, '') AS cell,
       CONVERT(VARCHAR(10), t.WeekEndingDate, 101) AS weekEnding,
       ISNULL(t.HealthInsuranceDesc, '') AS healthInsurance,
       t.TrackMargin AS margin
     FROM tblTracking t WITH (NOLOCK)
     WHERE CAST(t.WeekEndingDate AS DATE) >= CAST(@minWeekEndingDate AS DATE)
     ORDER BY t.WeekEndingDate, t.CustomerBusName, t.SiteName, t.EmFirstName, t.EmLastName`,
    [{ name: "minWeekEndingDate", value: minWeekEndingDate }],
  );
}
