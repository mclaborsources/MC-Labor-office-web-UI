import { queryReadOnly } from "@/lib/db/sql";

export interface DepositPaymentRow {
  id: number;
  customerId: number;
  customer: string;
  date: string;
  typeId: number;
  type: string;
  checkNumber: string;
  payment: number;
}
export interface DepositCustomerOption { id: number; name: string }
export interface DepositTypeOption { id: number; name: string }

export async function getDepositsToBeMadeData() {
  const [rows, types] = await Promise.all([
    queryReadOnly<DepositPaymentRow>(`SELECT p.CustomerPaymentID id,p.CustomerID customerId,
      ISNULL(c.CustBusName,'') customer,CONVERT(varchar(10),p.CustomerPaymentDate,101) date,
      p.CustomerPaymentTypeID typeId,ISNULL(t.PullDownCustomerPaymentType,'') type,
      ISNULL(p.CustomerPaymentCheckNum,'') checkNumber,ISNULL(p.CustomerPayment,0) payment
      FROM dbo.tblCustomerPayments p WITH (NOLOCK)
      LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
      LEFT JOIN dbo.tblPullDownCustomerPaymentTypes t WITH (NOLOCK) ON t.PullDownCustomerPaymentTypeID=p.CustomerPaymentTypeID
      WHERE p.DepositID IS NULL
      ORDER BY p.CustomerPaymentDate,p.CustomerPaymentID`),
    queryReadOnly<DepositTypeOption>(`SELECT PullDownCustomerPaymentTypeID id,ISNULL(PullDownCustomerPaymentType,'') name
      FROM dbo.tblPullDownCustomerPaymentTypes WITH (NOLOCK)
      WHERE ISNULL(PullDownCustomerPaymentTypeActive,1)=1 ORDER BY ISNULL(PullDownCustomerPaymentTypeSort,999999),PullDownCustomerPaymentType`),
  ]);
  return { rows, types };
}

export async function searchDepositCustomers(search: string) {
  const value = search.trim().slice(0, 100);
  if (value.length < 2) return [];
  return queryReadOnly<DepositCustomerOption>(`SELECT TOP (50) CustomerID id,ISNULL(CustBusName,'') name
    FROM dbo.tblCustomer WITH (NOLOCK)
    WHERE CustBusName LIKE '%' + @search + '%'
    ORDER BY CustBusName`, [{ name: "search", value }]);
}
