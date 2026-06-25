import { queryReadOnly } from "@/lib/db/sql";
import type {
  CustomerSummary,
  CustomerDetail,
  CustomerContact,
  CustomerForeman,
  CustomerRow,
  CustomerContactRow,
  CustomerForemanRow,
} from "@/types/customer";
import type { FilterOption, PaginatedResult } from "@/types/search";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toCustomerSummary(row: CustomerRow): CustomerSummary {
  return {
    customerId: safeStr(row.CustomerID),
    customerName: safeStr(row.CustBusName),
    customerType: safeStr(row.CustomerType),
    salesman: safeStr(row.SalesmanName),
    phone: safeStr(row.Phone),
    email: safeStr(row.CustEmail),
    city: safeStr(row.City),
    state: safeStr(row.State),
  };
}

// ---------------------------------------------------------------------------
// SQL queries — confirmed from McLabor tblCustomer schema
//
// tblCustomer:           CustomerID, CustBusName, CustomerTypeID, SalesmanID,
//                        Phone, CustEmail, Street, City, State, Zip
// tblPullDownCustomerTypes: CustomerTypeID, CustomerType  (guessed — update if wrong)
// tblPullDownSalesman:   SalesmanID, SalesmanName         (guessed — update if wrong)
// tblCustomerContacts:   column names not yet confirmed — query wrapped in catch()
// tblCustomerForeman:    column names not yet confirmed — query wrapped in catch()
// ---------------------------------------------------------------------------

const CUSTOMER_LIST_SQL = `
SELECT TOP (200)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ''                            AS CustomerType,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ''                            AS SalesmanName,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  NULL                          AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  NULL                          AS Zip
FROM  tblCustomer c
WHERE
  (@searchPat IS NULL
    OR c.CustBusName LIKE @searchPat
    OR CAST(c.CustomerID AS NVARCHAR(20)) LIKE @searchPat
    OR c.Phone       LIKE @searchPat
    OR c.CustEmail   LIKE @searchPat
    OR c.City        LIKE @searchPat)
  AND (@salesmanId     IS NULL OR CAST(c.SalesmanID     AS NVARCHAR(20)) = @salesmanId)
  AND (@customerTypeId IS NULL OR CAST(c.CustomerTypeID AS NVARCHAR(20)) = @customerTypeId)
  AND c.CustBusName NOT IN ('', '-', '--', '---')
  AND LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
ORDER BY c.CustBusName
`;

const CUSTOMER_DETAIL_SQL = `
SELECT TOP (1)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ''                            AS CustomerType,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ''                            AS SalesmanName,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  ISNULL(c.Street,         '')  AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  ISNULL(c.Zip,            '')  AS Zip
FROM  tblCustomer c
WHERE c.CustomerID = @customerId
`;

// Contacts and foremen wrapped in catch() — column names unconfirmed
const CUSTOMER_CONTACTS_SQL = `
SELECT
  ISNULL(ContactID,   0)   AS ContactID,
  ISNULL(CustomerID,  0)   AS CustomerID,
  ISNULL(FirstName,   '')  AS FirstName,
  ISNULL(LastName,    '')  AS LastName,
  ISNULL(Title,       '')  AS Title,
  ISNULL(Email,       '')  AS Email,
  ISNULL(CellPhone,   '')  AS CellPhone,
  ISNULL(OfficePhone, '')  AS OfficePhone,
  ISNULL(Notes,       '')  AS Notes
FROM tblCustomerContacts
WHERE CustomerID = @customerId
ORDER BY LastName, FirstName
`;

const CUSTOMER_FOREMEN_SQL = `
SELECT
  ISNULL(ForemanID,   0)   AS ForemanID,
  ISNULL(CustomerID,  0)   AS CustomerID,
  ISNULL(ForemanName, '')  AS ForemanName,
  ISNULL(Phone,       '')  AS Phone,
  ISNULL(Email,       '')  AS Email,
  ISNULL(Notes,       '')  AS Notes
FROM tblCustomerForeman
WHERE CustomerID = @customerId
ORDER BY ForemanName
`;

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toCustomerContact(row: CustomerContactRow): CustomerContact {
  const firstName = safeStr(row.FirstName);
  const lastName = safeStr(row.LastName);
  return {
    contactId: safeStr(row.ContactID),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || "—",
    title: safeStr(row.Title),
    email: safeStr(row.Email),
    cellPhone: safeStr(row.CellPhone),
    officePhone: safeStr(row.OfficePhone),
    notes: safeStr(row.Notes),
  };
}

function toCustomerForeman(row: CustomerForemanRow): CustomerForeman {
  return {
    foremanId: safeStr(row.ForemanID),
    foremanName: safeStr(row.ForemanName) || "—",
    phone: safeStr(row.Phone),
    email: safeStr(row.Email),
    notes: safeStr(row.Notes),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetCustomersParams {
  search?: string;
  salesmanId?: string;
  customerTypeId?: string;
}

export async function getCustomers(
  params: GetCustomersParams = {},
): Promise<PaginatedResult<CustomerSummary>> {
  const searchPat = params.search ? `%${params.search}%` : null;
  const salesmanId = params.salesmanId || null;
  const customerTypeId = params.customerTypeId || null;

  const rows = await queryReadOnly<CustomerRow>(CUSTOMER_LIST_SQL, [
    { name: "searchPat", value: searchPat },
    { name: "salesmanId", value: salesmanId },
    { name: "customerTypeId", value: customerTypeId },
  ]);

  const data = rows.map(toCustomerSummary);
  return { data, total: data.length, page: 1, pageSize: 200, hasMore: false };
}

export async function getCustomerById(
  customerId: string,
): Promise<CustomerDetail | null> {
  const [customerRows, contactRows, foremanRows] = await Promise.all([
    queryReadOnly<CustomerRow>(CUSTOMER_DETAIL_SQL, [
      { name: "customerId", value: customerId },
    ]),
    queryReadOnly<CustomerContactRow>(CUSTOMER_CONTACTS_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerContactRow[]),
    queryReadOnly<CustomerForemanRow>(CUSTOMER_FOREMEN_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerForemanRow[]),
  ]);

  const row = customerRows[0];
  if (!row) return null;

  const summary = toCustomerSummary(row);
  return {
    ...summary,
    street: safeStr(row.Street),
    zip: safeStr(row.Zip),
    contacts: contactRows.map(toCustomerContact),
    foremen: foremanRows.map(toCustomerForeman),
    jobsPlaceholder: true,
  };
}

export async function getCustomerFilterOptions(): Promise<{
  salesmen: FilterOption[];
  customerTypes: FilterOption[];
}> {
  const [salesmanRows, typeRows] = await Promise.all([
    queryReadOnly<{ SalesmanID: unknown; SalesmanName: string | null }>(
      "SELECT SalesmanID, ISNULL(SalesmanName, '') AS SalesmanName FROM tblPullDownSalesman ORDER BY SalesmanName",
    ).catch(() => []),
    queryReadOnly<{ CustomerTypeID: unknown; CustomerType: string | null }>(
      "SELECT CustomerTypeID, ISNULL(CustomerType, '') AS CustomerType FROM tblPullDownCustomerTypes ORDER BY CustomerType",
    ).catch(() => []),
  ]);

  return {
    salesmen: salesmanRows.map((r) => ({
      value: String(r.SalesmanID ?? ""),
      label: r.SalesmanName ?? "",
    })),
    customerTypes: typeRows.map((r) => ({
      value: String(r.CustomerTypeID ?? ""),
      label: r.CustomerType ?? "",
    })),
  };
}
