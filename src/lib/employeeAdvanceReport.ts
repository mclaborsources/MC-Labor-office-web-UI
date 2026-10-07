import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

/** Rows prepared for the Access Employee Advance Report, including its balance and up-to-date fields. */
export function getEmployeeAdvanceReportRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(EmployeeAdvanceReportSearchHoldingID AS NVARCHAR(20)) AS id,
    ISNULL(EmFirstName,'') AS [First Name],
    ISNULL(EmLastName,'') AS [Last Name],
    ISNULL(EmMiddle,'') AS MI,
    EmployeeAdvanceDate AS [Advance Date],
    EmployeeAdvanceAmount AS [Advance Amount],
    EmployeeAdvanceRepaymentAmount AS [Repayment Amount],
    EmployeeAdvanceStartRepaymentWeekEnding AS [Start Week Ending],
    ISNULL(EmployeeAdvanceNote,'') AS [Advance Note],
    ISNULL(EmployeeAdvanceUserName,'') AS [User Name],
    EmployeeAdvanceTimestamp AS Timestamp,
    Balance AS Balance,
    UpToWeekEndingDate AS [Up To Date]
  FROM tblEmployeeAdvanceReportSearchHolding WITH (NOLOCK)
  ORDER BY EmFirstName,EmLastName,EmployeeAdvanceDate,EmployeeAdvanceReportSearchHoldingID`);
}
