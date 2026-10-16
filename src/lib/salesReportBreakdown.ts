import { queryReadOnly } from "@/lib/db/sql";

export interface SalesReportBreakdownRow {
  id: string; contractWith: string; companyName: string; salesman: string; margin: number | null; totalInvoice: number;
}
export interface TwentyPercentRuleRow extends SalesReportBreakdownRow { adjustedMargin: number | null; adjustedInvoice: number; }

/** Customer invoice totals compared with tracked payroll for the chosen period. */
export function getSalesReportBreakdown(startDate: string, endDate: string) {
  return queryReadOnly<SalesReportBreakdownRow>(`WITH payroll AS (
    SELECT t.CustomerID,CAST(t.WeekEndingDate AS date) WeekEndingDate,
      SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll
        ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) GrossPayroll
    FROM dbo.tblTracking t WITH (NOLOCK)
    WHERE t.WeekEndingDate>=CONVERT(date,@startDate,23)
      AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@endDate,23))
      AND t.CustomerID IS NOT NULL AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
    GROUP BY t.CustomerID,CAST(t.WeekEndingDate AS date)
  ), weekly AS (
    SELECT cw.CustomerID,CAST(cw.WeekEndingDate AS date) WeekEndingDate,
      ISNULL(cw.InvoiceTotal,0) InvoiceTotal,
      COALESCE(cw.CustomerWeekContractWith_PayrollCoID,c.CustContractWith_PayrollCoID) ContractWithID,
      c.CustBusName CompanyName,c.SalesmanID,ISNULL(p.GrossPayroll,0) GrossPayroll
    FROM dbo.tblCustomerWeeks cw WITH (NOLOCK)
    JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
    LEFT JOIN payroll p ON p.CustomerID=cw.CustomerID AND p.WeekEndingDate=CAST(cw.WeekEndingDate AS date)
    WHERE cw.WeekEndingDate>=CONVERT(date,@startDate,23)
      AND cw.WeekEndingDate<DATEADD(day,1,CONVERT(date,@endDate,23))
  ), grouped AS (
    SELECT ContractWithID,CompanyName,SalesmanID,SUM(InvoiceTotal) TotalInvoice,
      SUM(InvoiceTotal-GrossPayroll) Profit
    FROM weekly GROUP BY ContractWithID,CompanyName,SalesmanID
  )
  SELECT CONCAT(ISNULL(CONVERT(varchar(20),g.ContractWithID),'0'),'-',ISNULL(g.CompanyName,''),'-',ISNULL(CONVERT(varchar(20),g.SalesmanID),'0')) id,
    ISNULL(co.PullDownContractWith_PayrollCoName,'') contractWith,ISNULL(g.CompanyName,'') companyName,
    LTRIM(RTRIM(CONCAT(ISNULL(s.PullDownSalesmanFName,''),' ',ISNULL(s.PullDownSalesmanLName,'')))) salesman,
    CASE WHEN g.TotalInvoice=0 THEN NULL ELSE CAST(g.Profit*100.0/g.TotalInvoice AS DECIMAL(10,2)) END margin,
    CAST(g.TotalInvoice AS DECIMAL(18,2)) totalInvoice
  FROM grouped g
  LEFT JOIN dbo.tblPullDownContractWith_PayrollCo co WITH (NOLOCK) ON co.PullDownContractWith_PayrollCoID=g.ContractWithID
  LEFT JOIN dbo.tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=g.SalesmanID
  ORDER BY co.PullDownContractWith_PayrollCoName,g.CompanyName,s.PullDownSalesmanLName,s.PullDownSalesmanFName`, [
    { name: "startDate", value: startDate }, { name: "endDate", value: endDate },
  ]);
}

/** Apply the 20% invoice reduction and recompute margin against tracked payroll. */
export async function getTwentyPercentRuleRows(startDate: string, endDate: string): Promise<TwentyPercentRuleRow[]> {
  const rows = await getSalesReportBreakdown(startDate, endDate);
  return rows.map((row) => {
    const adjustedInvoice = Number((row.totalInvoice * 0.8).toFixed(2));
    const payrollCost = row.margin == null ? 0 : row.totalInvoice * (1 - row.margin / 100);
    const adjustedMargin = adjustedInvoice === 0 ? null : Number(((adjustedInvoice - payrollCost) * 100 / adjustedInvoice).toFixed(2));
    return { ...row, adjustedInvoice, adjustedMargin };
  });
}
