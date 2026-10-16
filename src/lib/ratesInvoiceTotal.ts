import { queryReadOnly } from "@/lib/db/sql";

export interface RatesInvoiceTotalRow {
  id: string;
  customer: string;
  job: string;
  weekEnding: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  payRate: number | null;
  otPayRate: number | null;
  billRate: number | null;
  otBillRate: number | null;
  regularHours: number;
  otHours: number;
  totalHours: number;
  invoiceTotal: number | null;
  calcInvoiceTotal: number;
  payRateProblem: boolean;
  otPayRateProblem: boolean;
  billRateProblem: boolean;
  otBillRateProblem: boolean;
  invoiceTotalProblem: boolean;
}

/** Rate and invoice audit for the selected work week. */
export function getRatesInvoiceTotalRows(weekEnding: string) {
  return queryReadOnly<RatesInvoiceTotalRow>(`WITH tracked AS (
    SELECT t.TrackingID,t.CustomerID,t.ProjectID,t.CustomerBusName,t.SiteName,t.WeekEndingDate,
      t.EmFirstName,t.EmMiddle,t.EmLastName,t.PayRate,t.OTPayRate,t.BillRate,t.BillRateOT,
      ISNULL(t.RegularHours,0) RegularHours,ISNULL(t.OvertimeHours,0) OvertimeHours,
      ISNULL(t.TotalHours,ISNULL(t.RegularHours,0)+ISNULL(t.OvertimeHours,0)) TotalHours
    FROM dbo.tblTracking t WITH (NOLOCK)
    WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23)
      AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
  ), billed AS (
    SELECT CustomerID,CAST(WeekEndingDate AS date) WeekEndingDate,
      SUM(RegularHours*ISNULL(BillRate,0)+OvertimeHours*ISNULL(BillRateOT,0)) CalcInvoiceTotal
    FROM tracked GROUP BY CustomerID,CAST(WeekEndingDate AS date)
  ), invoices AS (
    SELECT CustomerID,CAST(WeekEndingDate AS date) WeekEndingDate,
      SUM(ISNULL(InvoiceTotal,0)) InvoiceTotal
    FROM dbo.tblCustomerWeeks WITH (NOLOCK)
    WHERE WeekEndingDate>=CONVERT(date,@weekEnding,23)
      AND WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
    GROUP BY CustomerID,CAST(WeekEndingDate AS date)
  )
  SELECT CAST(t.TrackingID AS NVARCHAR(20)) id,ISNULL(t.CustomerBusName,'') customer,
    ISNULL(t.SiteName,'') job,CONVERT(varchar(10),CAST(t.WeekEndingDate AS date),101) weekEnding,
    ISNULL(t.EmFirstName,'') firstName,ISNULL(t.EmLastName,'') lastName,ISNULL(t.EmMiddle,'') middleInitial,
    t.PayRate payRate,t.OTPayRate otPayRate,t.BillRate billRate,t.BillRateOT otBillRate,
    t.RegularHours regularHours,t.OvertimeHours otHours,t.TotalHours totalHours,
    i.InvoiceTotal invoiceTotal,CAST(ISNULL(b.CalcInvoiceTotal,0) AS DECIMAL(18,2)) calcInvoiceTotal,
    CAST(CASE WHEN t.RegularHours>0 AND ISNULL(t.PayRate,0)=0 THEN 1 ELSE 0 END AS bit) payRateProblem,
    CAST(CASE WHEN t.OvertimeHours>0 AND ISNULL(t.OTPayRate,0)=0 THEN 1 ELSE 0 END AS bit) otPayRateProblem,
    CAST(CASE WHEN t.RegularHours>0 AND ISNULL(t.BillRate,0)=0 THEN 1 ELSE 0 END AS bit) billRateProblem,
    CAST(CASE WHEN t.OvertimeHours>0 AND ISNULL(t.BillRateOT,0)=0 THEN 1 ELSE 0 END AS bit) otBillRateProblem,
    CAST(CASE WHEN i.InvoiceTotal IS NOT NULL AND ABS(i.InvoiceTotal-ISNULL(b.CalcInvoiceTotal,0))>0.01 THEN 1 ELSE 0 END AS bit) invoiceTotalProblem
  FROM tracked t
  LEFT JOIN billed b ON b.CustomerID=t.CustomerID AND b.WeekEndingDate=CAST(t.WeekEndingDate AS date)
  LEFT JOIN invoices i ON i.CustomerID=t.CustomerID AND i.WeekEndingDate=CAST(t.WeekEndingDate AS date)
  ORDER BY t.CustomerBusName,t.SiteName,t.EmLastName,t.EmFirstName,t.TrackingID`,[
    { name: "weekEnding", value: weekEnding },
  ]);
}
