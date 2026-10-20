import { queryReadOnlyUncached } from "@/lib/db/sql";
import type { EmployeeSummary } from "@/types/employee";

export interface QuickSearchParams { name?: string; cell?: string; search?: string; offset?: number; staffId?: number }
export const QUICK_SEARCH_BATCH_SIZE = 500;
export async function getEmployeeQuickSearch(params: QuickSearchParams = {}) {
  const offset = Math.max(0, Math.trunc(params.offset ?? 0));
  const scope = `FROM tblEmployee e
    LEFT JOIN tblPullDownEmployeeStatus s ON s.PullDownEmployeeStatusID=e.EmEmployeeStatusID
    LEFT JOIN tblPullDownGrades g ON g.PullDownGradeID=e.EmGradeID
    LEFT JOIN tblPullDownEmployeeProfileTypes pt ON pt.PullDownEmployeeProfileTypeID=e.EmployeeProfileTypeID
    LEFT JOIN tblTracking lastWork ON lastWork.TrackingID=e.MaxTrackingID
    WHERE NOT EXISTS (SELECT 1 FROM STRING_SPLIT(@name,' ') word WHERE word.value<>''
      AND CONCAT(e.EmFirstName,' ',e.EmMiddle,' ',e.EmLastName) NOT LIKE '%'+word.value+'%' ESCAPE '~')
    AND (@cell='' OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(e.EmMobilePhone,''),'(',''),')',''),'-',''),' ',''),'.','') LIKE @cell+'%')
    AND (@search='' OR CONCAT(e.EmFirstName,' ',e.EmLastName,' ',e.EmMobilePhone,' ',e.EmCity,' ',e.EmState,' ',s.PullDownEmployeeStatus,' ',g.PullDownGrade,' ',lastWork.CustomerBusName) LIKE '%'+@search+'%' ESCAPE '~')
    AND (@staff IS NULL OR NOT EXISTS (SELECT 1 FROM tblEmployeePayrollCoOnSite pc WHERE pc.EmployeeID=e.EmployeeID)
      OR EXISTS (SELECT 1 FROM tblEmployeePayrollCoOnSite pc JOIN tblOfficeStaffPermission op ON op.OfficeStaffID=@staff
        JOIN tblFeature f ON f.FeatureID=op.FeatureID AND f.FeatureActive=1 AND f.ObjectName='Payroll Company On Site'
        AND f.ControlName=CONVERT(NVARCHAR(20),pc.PayrollCoOnSiteID) WHERE pc.EmployeeID=e.EmployeeID))`;
  const escape = (value = "") => value.trim().slice(0, 150).replace(/[~%_[]/g, char => `~${char}`);
  const inputs = [{ name: "name", value: escape(params.name) }, { name: "cell", value: (params.cell ?? "").replace(/\D/g, "") }, { name: "search", value: escape(params.search) }, { name: "staff", value: params.staffId ?? null }];
  const [count] = await queryReadOnlyUncached<{ total: number }>(`SELECT COUNT_BIG(*) AS total ${scope}`, inputs);
  const rows = await queryReadOnlyUncached<Record<string, string | number | null>>(`SELECT e.EmployeeID,
    e.EmFirstName,e.EmMiddle,e.EmLastName,e.EmMobilePhone,e.EmCity,e.EmState,e.EmLicensedIn,e.BaseSalary,
    s.PullDownEmployeeStatus AS Status,g.PullDownGrade AS Grade,pt.PullDownEmployeeProfileType AS Profile,
    CONVERT(VARCHAR(10),e.MaxWeekEndingDate,101) AS WeekEnding,lastWork.CustomerBusName AS Customer
    ${scope} ORDER BY e.MaxWeekEndingDate DESC,e.EmFirstName,e.EmLastName,e.EmMiddle,e.EmployeeID
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY`, [...inputs, { name: "offset", value: offset }, { name: "size", value: QUICK_SEARCH_BATCH_SIZE }]);
  const data = rows.map(row => {
    const text = (key: string) => String(row[key] ?? "").trim();
    return { employeeId: text("EmployeeID"), firstName: text("EmFirstName"), middleInitial: text("EmMiddle"), lastName: text("EmLastName"), fullName: [text("EmFirstName"),text("EmMiddle"),text("EmLastName")].filter(Boolean).join(" "),
      cellPhone: text("EmMobilePhone"), city: text("EmCity"), state: text("EmState"), status: text("Status"), grade: text("Grade"), profileType: text("Profile"), weekEnding: text("WeekEnding"), currentAssignment: text("Customer"),
      payRate: row.BaseSalary == null ? "" : Number(row.BaseSalary).toFixed(2), payrollCompany: "Payroll Co On Site", accessFields: { LicenseState: text("EmLicensedIn") },
      email: "",trade: "",street: "",userFlag5: "",s1: "",howReferred: "",qualification: "",averageInterview: "",fda: "",thw: "",licenseExpiration: "",
    } satisfies EmployeeSummary;
  });
  return { data, total: Number(count.total), offset, pageSize: QUICK_SEARCH_BATCH_SIZE };
}

export async function getQuickSearchPayroll(employeeId: number, staffId?: number) {
  return queryReadOnlyUncached<Record<string, string | number | boolean | null>>(`SELECT
    ep.EmployeePayrollCoOnSiteID AS id,pc.PullDownPayrollCoOnSiteName AS company,
    ep.EmployeePayrollCoOnSiteDefault AS isDefault,
    CONVERT(VARCHAR(10),ep.EmployeePayrollCoOnSiteJobApplicationDate,101) AS applicationDate,
    CONCAT(js.PullDownJobApplicationStatus,' ',js.PullDownJobApplicationStatusDesc) AS applicationStatus,
    CONVERT(VARCHAR(10),ep.EmployeePayrollCoOnSiteMaxWeekEndingDate,101) AS lastWeek,
    t.CustomerBusName AS customer,ep.EmployeePayrollCoOnSitePayrollInfoSent AS sent,
    ep.EmployeePayrollCoOnSitePayrollInfoSentUserName AS sentUser,
    CONVERT(VARCHAR(10),ep.EmployeePayrollCoOnSitePayrollInfoSentTimestamp,101) AS sentDate,
    ep.EmployeePayrollCoOnSitePayrollInfoSentNotes AS sentNotes
    FROM tblEmployeePayrollCoOnSite ep
    LEFT JOIN tblPullDownPayrollCoOnSite pc ON pc.PullDownPayrollCoOnSiteID=ep.PayrollCoOnSiteID
    LEFT JOIN tblPullDownJobApplicationStatus js ON js.PullDownJobApplicationStatusID=ep.EmployeePayrollCoOnSiteJobApplicationStatusID
    LEFT JOIN tblTracking t ON t.TrackingID=ep.EmployeePayrollCoOnSiteMaxTrackingID
    WHERE ep.EmployeeID=@id AND (@staff IS NULL OR EXISTS (SELECT 1 FROM tblOfficeStaffPermission op
      JOIN tblFeature f ON f.FeatureID=op.FeatureID WHERE op.OfficeStaffID=@staff AND f.FeatureActive=1
      AND f.ObjectName='Payroll Company On Site' AND f.ControlName=CONVERT(NVARCHAR(20),ep.PayrollCoOnSiteID)))
    ORDER BY ep.EmployeePayrollCoOnSiteDefault DESC,pc.PullDownPayrollCoOnSiteName`, [{ name: "id", value: employeeId },{ name: "staff", value: staffId ?? null }]);
}
