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

// ---------------------------------------------------------------------------
// Customer base query — no lookup JOINs; lookups merged in app code so
// a wrong lookup column name can never crash the customer list.
//
// Confirmed column names from McLabor tblCustomer:
//   CustomerID, CustBusName, CustomerTypeID, SalesmanID,
//   Phone, CustEmail, Street, City, State, Zip
// ---------------------------------------------------------------------------

const CUSTOMER_LIST_SQL = `
SELECT TOP (200)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  NULL                          AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  NULL                          AS Zip
FROM  tblCustomer c WITH (NOLOCK)
WHERE
  (@searchPat IS NULL
    OR c.CustBusName LIKE @searchPat
    OR CAST(c.CustomerID AS NVARCHAR(20)) LIKE @searchPat
    OR c.Phone       LIKE @searchPat
    OR c.CustEmail   LIKE @searchPat
    OR c.City        LIKE @searchPat)
  AND (@salesmanId     IS NULL OR CAST(c.SalesmanID     AS NVARCHAR(20)) = @salesmanId)
  AND (@customerTypeId IS NULL OR CAST(c.CustomerTypeID AS NVARCHAR(20)) = @customerTypeId)
  AND LEN(LTRIM(RTRIM(ISNULL(c.CustBusName, '')))) > 1
  AND c.CustBusName NOT IN ('-', '--', '---')
ORDER BY c.CustBusName
`;

const CUSTOMER_DETAIL_SQL = `
SELECT TOP (1)
  c.CustomerID,
  ISNULL(c.CustBusName,    '')  AS CustBusName,
  ISNULL(c.CustomerTypeID, 0)   AS CustomerTypeID,
  ISNULL(c.SalesmanID,     0)   AS SalesmanID,
  ISNULL(c.Phone,          '')  AS Phone,
  ISNULL(c.CustEmail,      '')  AS CustEmail,
  ISNULL(c.Street,         '')  AS Street,
  ISNULL(c.City,           '')  AS City,
  ISNULL(c.State,          '')  AS State,
  ISNULL(c.Zip,            '')  AS Zip
FROM  tblCustomer c WITH (NOLOCK)
WHERE c.CustomerID = @customerId
`;

// ---------------------------------------------------------------------------
// Lookup maps — each query is tried independently and falls back to empty.
// PK column names confirmed (SalesmanID, CustomerTypeID worked in JOIN ON).
// Display column names follow the PullDown* pattern used by employee lookups.
// Update column names here if wrong — won't affect the customer list query.
// ---------------------------------------------------------------------------

async function loadCustomerTypeMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{ PullDownCustomerTypeID: unknown; TypeName: string | null }>(
      `SELECT PullDownCustomerTypeID,
              ISNULL(PullDownCustomerType, '') AS TypeName
       FROM   tblPullDownCustomerTypes WITH (NOLOCK)
       ORDER  BY PullDownCustomerType`,
    );
    for (const r of rows) {
      if (r.PullDownCustomerTypeID != null) {
        map.set(String(r.PullDownCustomerTypeID), r.TypeName ?? "");
      }
    }
  } catch {
    // Fail silently — customer list still loads without type names
  }
  return map;
}

async function loadSalesmanMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{
      PullDownSalesmanID: unknown;
      SalesmanLabel: string | null;
    }>(
      `SELECT PullDownSalesmanID,
              LTRIM(RTRIM(
                ISNULL(PullDownSalesmanFName, '') + ' ' + ISNULL(PullDownSalesmanLName, '')
              )) AS SalesmanLabel
       FROM   tblPullDownSalesman WITH (NOLOCK)
       ORDER  BY PullDownSalesmanLName, PullDownSalesmanFName`,
    );
    for (const r of rows) {
      if (r.PullDownSalesmanID != null) {
        map.set(String(r.PullDownSalesmanID), r.SalesmanLabel ?? "");
      }
    }
  } catch {
    // Fail silently — customer list still loads without salesman names
  }
  return map;
}

// ---------------------------------------------------------------------------
// Contacts — wrapped in catch(); column names unconfirmed.
// Common Access pattern used; adjust if wrong.
// ---------------------------------------------------------------------------

const CUSTOMER_CONTACTS_SQL = `
SELECT
  ISNULL(CustomerContactID,         0)   AS CustomerContactID,
  ISNULL(CustomerID,                0)   AS CustomerID,
  ISNULL(CustomerContactFName,      '')  AS CustomerContactFName,
  ISNULL(CustomerContactLName,      '')  AS CustomerContactLName,
  ISNULL(CustomerContactEmail,      '')  AS CustomerContactEmail,
  ISNULL(CustomerContactCell,       '')  AS CustomerContactCell,
  ISNULL(CustomerContactOfficePhone,'')  AS CustomerContactOfficePhone,
  ISNULL(CustomerContactNotes,      '')  AS CustomerContactNotes
FROM tblCustomerContacts WITH (NOLOCK)
WHERE CustomerID = @customerId
ORDER BY CustomerContactSort, CustomerContactLName, CustomerContactFName
`;

const CUSTOMER_FOREMEN_SQL = `
SELECT
  ISNULL(CustomerForemanID,    0)   AS CustomerForemanID,
  ISNULL(CustomerID,           0)   AS CustomerID,
  ISNULL(CustomerForeman,      '')  AS CustomerForeman,
  ISNULL(CustomerForemanPhone, '')  AS CustomerForemanPhone,
  CustomerForemanDefault
FROM tblCustomerForeman WITH (NOLOCK)
WHERE CustomerID = @customerId
ORDER BY CustomerForemanDefault DESC, CustomerForeman
`;

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toCustomerBase(row: CustomerRow): Omit<CustomerSummary, "customerType" | "salesman"> {
  return {
    customerId: safeStr(row.CustomerID),
    customerName: safeStr(row.CustBusName),
    phone: safeStr(row.Phone),
    email: safeStr(row.CustEmail),
    city: safeStr(row.City),
    state: safeStr(row.State),
  };
}

function toCustomerContact(row: CustomerContactRow): CustomerContact {
  const firstName = safeStr(row.CustomerContactFName);
  const lastName = safeStr(row.CustomerContactLName);
  return {
    contactId: safeStr(row.CustomerContactID),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || "—",
    title: "",  // CustomerContactTitleID is a lookup ID — expanded in a later milestone if needed
    email: safeStr(row.CustomerContactEmail),
    cellPhone: safeStr(row.CustomerContactCell),
    officePhone: safeStr(row.CustomerContactOfficePhone),
    notes: safeStr(row.CustomerContactNotes),
  };
}

function toCustomerForeman(row: CustomerForemanRow): CustomerForeman {
  return {
    foremanId: safeStr(row.CustomerForemanID),
    foremanName: safeStr(row.CustomerForeman) || "—",
    phone: safeStr(row.CustomerForemanPhone),
    email: "",   // no email column in tblCustomerForeman
    notes: row.CustomerForemanDefault ? "Default" : "",
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

  const [rows, typeMap, salesmanMap] = await Promise.all([
    queryReadOnly<CustomerRow>(CUSTOMER_LIST_SQL, [
      { name: "searchPat", value: searchPat },
      { name: "salesmanId", value: salesmanId },
      { name: "customerTypeId", value: customerTypeId },
    ]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
  ]);

  const data = rows.map((row) => ({
    ...toCustomerBase(row),
    customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
    salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
  }));

  return { data, total: data.length, page: 1, pageSize: 200, hasMore: false };
}

export async function getCustomerById(
  customerId: string,
): Promise<CustomerDetail | null> {
  const [customerRows, typeMap, salesmanMap, contactRows, foremanRows] = await Promise.all([
    queryReadOnly<CustomerRow>(CUSTOMER_DETAIL_SQL, [
      { name: "customerId", value: customerId },
    ]),
    loadCustomerTypeMap(),
    loadSalesmanMap(),
    queryReadOnly<CustomerContactRow>(CUSTOMER_CONTACTS_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerContactRow[]),
    queryReadOnly<CustomerForemanRow>(CUSTOMER_FOREMEN_SQL, [
      { name: "customerId", value: customerId },
    ]).catch(() => [] as CustomerForemanRow[]),
  ]);

  const row = customerRows[0];
  if (!row) return null;

  return {
    ...toCustomerBase(row),
    customerType: typeMap.get(String(row.CustomerTypeID ?? "")) ?? "",
    salesman: salesmanMap.get(String(row.SalesmanID ?? "")) ?? "",
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
  const [typeMap, salesmanMap] = await Promise.all([
    loadCustomerTypeMap(),
    loadSalesmanMap(),
  ]);

  return {
    // Sort alphabetically by label for the dropdowns
    salesmen: Array.from(salesmanMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    customerTypes: Array.from(typeMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
