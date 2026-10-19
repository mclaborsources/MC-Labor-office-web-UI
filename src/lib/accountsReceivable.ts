import { queryReadOnlyUncached } from "@/lib/db/sql";
import type { ReportCustomer } from "@/lib/reportCustomers";
import type { ArSalesman } from "@/components/reports/AccountsReceivableTabs";

export function getAccountsReceivableSalesmen() {
  return queryReadOnlyUncached<ArSalesman>(`SELECT CAST(PullDownSalesmanID AS nvarchar(20)) id,
    LTRIM(RTRIM(CONCAT(PullDownSalesmanFName,' ',PullDownSalesmanLName))) name,
    ISNULL(PullDownSalesmanEmail,'') email FROM tblPullDownSalesman
    WHERE PullDownSalesmanActive<>0 ORDER BY PullDownSalesmanFName,PullDownSalesmanLName`);
}

export interface AccountsReceivableRow extends ReportCustomer {
  credit: string | null; customerSince: string | null; company: string | null;
  legalStatus: string | null; lastAction: string | null; nextAction: string | null;
  smallClaims: string | null; salesman: string | null; terms: string | null;
  aging: number | null; invoiceGroup: string | null; age: number | null;
  totalOwed: number; under30: number; over30: number; over60: number;
  over90: number; over120: number; history: string | null;
  lastArEmail: string | null; lastInvoice: string | null;
}

/** One row per customer with unpaid QB invoices; header/total rows are excluded. */
export function getAccountsReceivableRows() {
  return queryReadOnlyUncached<AccountsReceivableRow>(`WITH invoices AS (
    SELECT q.*, COALESCE(q.Aging,DATEDIFF(day,q.InvoiceDate,GETDATE())) AS InvoiceAge,
      COALESCE('c:'+CAST(q.CustomerID AS nvarchar(20)),
        'qb:'+NULLIF(q.QBCustomerID,''),'name:'+q.QBCustomerName) AS CustomerKey
    FROM tblQBOpenInvoices q
    WHERE q.InvoiceDate IS NOT NULL AND q.OpenBalance > 0
  ), balances AS (
    SELECT CustomerKey, MAX(CustomerID) CustomerID, MAX(QBCustomerName) CustomerName,
      MIN(CustomerSince) CustomerSince, MAX(InvoiceDate) LastInvoiceDate, MAX(InvoiceAge) Aging,
      DATEDIFF(day,MIN(InvoiceDate),GETDATE()) Age,
      MAX(NULLIF(Salesman,'')) Salesman,
      STRING_AGG(CAST(NULLIF(CollectionsNote,'') AS nvarchar(max)),CHAR(10)) History,
      CASE WHEN MIN(AgingFilter)=MAX(AgingFilter) THEN MAX(AgingFilter)
        ELSE 'Mixed' END InvoiceGroup,
      SUM(CAST(OpenBalance AS decimal(18,2))) TotalOwed,
      SUM(CASE WHEN InvoiceAge<=30 THEN CAST(OpenBalance AS decimal(18,2)) ELSE 0 END) Under30,
      SUM(CASE WHEN InvoiceAge>30 THEN CAST(OpenBalance AS decimal(18,2)) ELSE 0 END) Over30,
      SUM(CASE WHEN InvoiceAge>60 THEN CAST(OpenBalance AS decimal(18,2)) ELSE 0 END) Over60,
      SUM(CASE WHEN InvoiceAge>90 THEN CAST(OpenBalance AS decimal(18,2)) ELSE 0 END) Over90,
      SUM(CASE WHEN InvoiceAge>120 THEN CAST(OpenBalance AS decimal(18,2)) ELSE 0 END) Over120
    FROM invoices GROUP BY CustomerKey
  ), weeks AS (
    SELECT CustomerID, MIN(WeekEndingDate) CustomerSince, MAX(WeekEndingDate) LastWeek
    FROM tblCustomerWeeks GROUP BY CustomerID
  )
  SELECT COALESCE(CAST(c.CustomerID AS nvarchar(20)),b.CustomerKey) id,
    COALESCE(NULLIF(c.CustBusName,''),b.CustomerName) customer,
    c.State state,c.CustEmail email,c.Phone phone,
    CONVERT(varchar(10),w.LastWeek,23) lastWeek,
    ps.PullDownCustPaymentStatus credit,
    CONVERT(varchar(10),COALESCE(b.CustomerSince,w.CustomerSince),23) customerSince,
    pc.PullDownContractWith_PayrollCoInitials company,
    ls.PullDownLegalStatus legalStatus,
    CONVERT(varchar(10),ar.CustomerARNextDateNoteLastActionDate,23) lastAction,
    CONVERT(varchar(10),ar.CustomerARNextDateNoteNextActionDate,23) nextAction,
    NULLIF(c.SmallClaimsFolder,'') smallClaims,
    COALESCE(NULLIF(b.Salesman,''),NULLIF(LTRIM(RTRIM(CONCAT(s.PullDownSalesmanFName,' ',s.PullDownSalesmanLName))),'')) salesman,
    ct.PullDownCreditTermLimit terms,b.Aging aging,b.InvoiceGroup invoiceGroup,b.Age age,
    COALESCE(b.TotalOwed,0) totalOwed,COALESCE(b.Under30,0) under30,COALESCE(b.Over30,0) over30,
    COALESCE(b.Over60,0) over60,COALESCE(b.Over90,0) over90,COALESCE(b.Over120,0) over120,
    COALESCE(NULLIF(ar.CustomerARNextDateNote,''),NULLIF(hdr.CollectionsNote,''),NULLIF(b.History,''),NULLIF(c.CollectionsNote,'')) history,
    CONVERT(varchar(19),c.LastAREmailTimestamp,120) lastArEmail,
    CONVERT(varchar(10),b.LastInvoiceDate,23) lastInvoice
  FROM weeks w
  INNER JOIN tblCustomer c ON c.CustomerID=w.CustomerID
  LEFT JOIN balances b ON b.CustomerID=w.CustomerID
  LEFT JOIN tblPullDownCustPaymentStatus ps ON ps.PullDownCustPaymentStatusID=c.CustPaymentStatusID
  LEFT JOIN tblPullDownContractWith_PayrollCo pc ON pc.PullDownContractWith_PayrollCoID=c.CustContractWith_PayrollCoID
  LEFT JOIN tblPullDownLegalStatus ls ON ls.PullDownLegalStatusID=c.LegalStatusID
  LEFT JOIN tblPullDownSalesman s ON s.PullDownSalesmanID=c.SalesmanID
  LEFT JOIN tblPullDownCreditTermLimits ct ON ct.PullDownCreditTermLimitID=c.CreditTermLimitID
  OUTER APPLY (SELECT TOP (1) * FROM tblCustomerARNextDateNotes n WHERE n.CustomerID=c.CustomerID
    ORDER BY n.CustomerARNextDateNoteTimestamp DESC,n.CustomerARNextDateNoteID DESC) ar
  OUTER APPLY (SELECT TOP (1) q.CollectionsNote FROM tblQBOpenInvoices q
    WHERE q.CustomerID=b.CustomerID AND q.InvoiceDate IS NULL ORDER BY q.QBOpenInvoicesID DESC) hdr
  ORDER BY b.Aging DESC,customer`);
}
