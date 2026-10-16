import { queryReadOnly } from "@/lib/db/sql";

export interface CommissionMainRow {
  id: string;
  weekEnding: string;
  salesman: string;
  salesAfter20: number;
}

/** Sales totals after the 20% reduction, grouped by week and assigned salesman. */
export function getCommissionsMainRows(weekEnding: string) {
  return queryReadOnly<CommissionMainRow>(`SELECT
    CONCAT(CONVERT(varchar(10),CAST(cw.WeekEndingDate AS date),23),'-',ISNULL(CONVERT(varchar(20),c.SalesmanID),'0')) id,
    CONVERT(varchar(10),CAST(cw.WeekEndingDate AS date),23) weekEnding,
    COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(s.PullDownSalesmanFName,''),' ',ISNULL(s.PullDownSalesmanLName,'')))),''),'(Unassigned)') salesman,
    CAST(SUM(ISNULL(cw.InvoiceTotal,0))*0.8 AS DECIMAL(18,2)) salesAfter20
  FROM dbo.tblCustomerWeeks cw WITH (NOLOCK)
  LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
  LEFT JOIN dbo.tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
  WHERE cw.WeekEndingDate>=CONVERT(date,@weekEnding,23)
    AND cw.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
  GROUP BY CAST(cw.WeekEndingDate AS date),c.SalesmanID,s.PullDownSalesmanFName,s.PullDownSalesmanLName
  ORDER BY s.PullDownSalesmanLName,s.PullDownSalesmanFName`, [{ name: "weekEnding", value: weekEnding }]);
}
