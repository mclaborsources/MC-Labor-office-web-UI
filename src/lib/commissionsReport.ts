import { queryReadOnly } from "@/lib/db/sql";

export interface CommissionsReportSummary { weekEnding: string; grossPayroll: number; totalInvoices: number; xcelHrPayroll: number; }

/** Weekly payroll and customer invoice summary shown by the Access Commissions Report. */
export function getCommissionsReportSummary(weekEnding: string) {
  return queryReadOnly<CommissionsReportSummary>(`WITH payroll_parts AS (
    SELECT SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll
      ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) amount
    FROM dbo.tblTracking t WITH (NOLOCK)
    WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23)
      AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
    UNION ALL
    SELECT SUM(ISNULL(a.PayrollAdjustmentAmount,0))
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK)
    WHERE a.WeekEndingDate>=CONVERT(date,@weekEnding,23)
      AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
  )
  SELECT CONVERT(varchar(10),CONVERT(date,@weekEnding,23),101) weekEnding,
    CAST(ISNULL((SELECT SUM(amount) FROM payroll_parts),0) AS DECIMAL(18,2)) grossPayroll,
    CAST(ISNULL((SELECT SUM(ISNULL(cw.InvoiceTotal,0)) FROM dbo.tblCustomerWeeks cw WITH (NOLOCK)
      WHERE cw.WeekEndingDate>=CONVERT(date,@weekEnding,23)
        AND cw.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))),0) AS DECIMAL(18,2)) totalInvoices,
    CAST(ISNULL((SELECT SUM(amount) FROM payroll_parts),0) AS DECIMAL(18,2)) xcelHrPayroll`, [
    { name: "weekEnding", value: weekEnding },
  ]).then((rows) => rows[0] ?? { weekEnding: "", grossPayroll: 0, totalInvoices: 0, xcelHrPayroll: 0 });
}
