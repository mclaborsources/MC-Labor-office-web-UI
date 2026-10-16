import { queryReadOnly } from "@/lib/db/sql";

export interface PayrollCrosscheckRow {
  id: string;
  weekEnding: string;
  payrollCo: string;
  grossPayroll: number;
  companyGrossPayroll: number | null;
  difference: number;
}

export function getPayrollCrosscheckRows(startDate: string, endDate: string, payrollCo: string) {
  return queryReadOnly<PayrollCrosscheckRow>(`WITH weeks AS (
    SELECT CONVERT(date,@startDate,23) WeekEndingDate
    UNION ALL SELECT DATEADD(day,7,WeekEndingDate) FROM weeks
      WHERE DATEADD(day,7,WeekEndingDate)<=CONVERT(date,@endDate,23)
  ), amounts AS (
    SELECT CAST(t.WeekEndingDate AS date) WeekEndingDate,ISNULL(t.PayrollCoOnSiteInitials,'') payrollCo,
      SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll
        ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) grossPayroll
    FROM dbo.tblTracking t WITH (NOLOCK)
    WHERE t.WeekEndingDate>=CONVERT(date,@startDate,23)
      AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@endDate,23))
      AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
      AND (@payrollCo='' OR ISNULL(t.PayrollCoOnSiteInitials,'')=@payrollCo)
    GROUP BY CAST(t.WeekEndingDate AS date),ISNULL(t.PayrollCoOnSiteInitials,'')
    UNION ALL
    SELECT CAST(a.WeekEndingDate AS date),ISNULL(co.PullDownPayrollCoOnSiteInitials,''),SUM(ISNULL(a.PayrollAdjustmentAmount,0))
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK)
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
    WHERE a.WeekEndingDate>=CONVERT(date,@startDate,23)
      AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@endDate,23))
      AND (@payrollCo='' OR ISNULL(co.PullDownPayrollCoOnSiteInitials,'')=@payrollCo)
    GROUP BY CAST(a.WeekEndingDate AS date),ISNULL(co.PullDownPayrollCoOnSiteInitials,'')
  ), weekly AS (
    SELECT WeekEndingDate,payrollCo,SUM(grossPayroll) grossPayroll FROM amounts GROUP BY WeekEndingDate,payrollCo
  ), selectedCompanies AS (
    SELECT DISTINCT payrollCo FROM weekly WHERE @payrollCo=''
    UNION ALL SELECT @payrollCo WHERE @payrollCo<>''
  )
  SELECT CONCAT(CONVERT(char(10),w.WeekEndingDate,23),'-',c.payrollCo) id,
    CONVERT(varchar(10),w.WeekEndingDate,101) weekEnding,c.payrollCo,
    CAST(ISNULL(a.grossPayroll,0) AS DECIMAL(18,2)) grossPayroll,
    CAST(NULL AS DECIMAL(18,2)) companyGrossPayroll,
    CAST(ISNULL(a.grossPayroll,0) AS DECIMAL(18,2)) difference
  FROM weeks w CROSS JOIN selectedCompanies c
  LEFT JOIN weekly a ON a.WeekEndingDate=w.WeekEndingDate AND a.payrollCo=c.payrollCo
  ORDER BY w.WeekEndingDate,c.payrollCo OPTION (MAXRECURSION 100)`, [
    { name: "startDate", value: startDate }, { name: "endDate", value: endDate }, { name: "payrollCo", value: payrollCo },
  ]);
}
