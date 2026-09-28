import { queryReadOnly } from "@/lib/db/sql";
import type { AllContactRow } from "@/types/allContacts";

interface RawContactRow {
  id: unknown; profileType: unknown; customerId: unknown; customerName: unknown;
  employeeId: unknown; employeeName: unknown; firstName: unknown; lastName: unknown;
  cell1: unknown; cell2: unknown; cell3: unknown; cell4: unknown; email: unknown;
  noCommunication: unknown;
}

const ALL_CONTACTS_SQL = `
SELECT * FROM (
  SELECT CONCAT('C:', cc.CustomerContactID) AS id, 'Company Contact' AS profileType,
    CAST(c.CustomerID AS NVARCHAR(30)) AS customerId, ISNULL(c.CustBusName, '') AS customerName,
    '' AS employeeId, '' AS employeeName,
    ISNULL(cc.CustomerContactFName, '') AS firstName, ISNULL(cc.CustomerContactLName, '') AS lastName,
    ISNULL(cc.CustomerContactCell, '') AS cell1, '' AS cell2, '' AS cell3, '' AS cell4,
    ISNULL(cc.CustomerContactEmail, '') AS email, ISNULL(c.CustomerNoCommunication, 0) AS noCommunication
  FROM tblCustomerContacts cc WITH (NOLOCK)
  INNER JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = cc.CustomerID
  UNION ALL
  SELECT CONCAT('E:', ec.EmployeeContactID), 'Employee Contact', '', '',
    CAST(e.EmployeeID AS NVARCHAR(30)), LTRIM(RTRIM(ISNULL(e.EmFName, '') + ' ' + ISNULL(e.EmLName, ''))),
    ISNULL(ec.EmployeeContactFName, ''), ISNULL(ec.EmployeeContactLName, ''),
    ISNULL(ec.EmployeeContactCell, ''), ISNULL(ec.EmployeeContactPhone, ''), '', '',
    ISNULL(ec.EmployeeContactEmail, ''), CAST(0 AS bit)
  FROM tblEmployeeContacts ec WITH (NOLOCK)
  INNER JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID = ec.EmployeeID
) contacts
WHERE (@search IS NULL OR firstName LIKE @search OR lastName LIKE @search OR customerName LIKE @search OR employeeName LIKE @search OR cell1 LIKE @search OR cell2 LIKE @search OR cell3 LIKE @search OR cell4 LIKE @search OR email LIKE @search)
  AND (@name IS NULL OR firstName LIKE @name OR lastName LIKE @name OR (firstName + ' ' + lastName) LIKE @name)
  AND (@cell IS NULL OR cell1 LIKE @cell OR cell2 LIKE @cell OR cell3 LIKE @cell OR cell4 LIKE @cell)
  AND (@email IS NULL OR email LIKE @email)
  AND (@includeCompanies = 1 OR profileType <> 'Company Contact')
  AND (@includeEmployees = 1 OR profileType <> 'Employee Contact')
  AND (@includeNoCommunication = 1 OR noCommunication = 0)
ORDER BY lastName, firstName, customerName, employeeName`;

export interface AllContactFilters {
  search?: string; name?: string; cell?: string; email?: string;
  includeCompanies: boolean; includeEmployees: boolean; includeNoCommunication: boolean;
}

export async function getAllContacts(filters: AllContactFilters): Promise<AllContactRow[]> {
  const pat = (s?: string) => s?.trim() ? `%${s.trim()}%` : null;
  const rows = await queryReadOnly<RawContactRow>(ALL_CONTACTS_SQL, [
    { name: "search", value: pat(filters.search) }, { name: "name", value: pat(filters.name) },
    { name: "cell", value: pat(filters.cell) }, { name: "email", value: pat(filters.email) },
    { name: "includeCompanies", value: filters.includeCompanies ? 1 : 0 },
    { name: "includeEmployees", value: filters.includeEmployees ? 1 : 0 },
    { name: "includeNoCommunication", value: filters.includeNoCommunication ? 1 : 0 },
  ]);
  return rows.map((r) => ({
    id: String(r.id ?? ""), profileType: String(r.profileType ?? "Company Contact") as AllContactRow["profileType"],
    customerId: String(r.customerId ?? ""), customerName: String(r.customerName ?? ""),
    employeeId: String(r.employeeId ?? ""), employeeName: String(r.employeeName ?? ""),
    firstName: String(r.firstName ?? ""), lastName: String(r.lastName ?? ""),
    cell1: String(r.cell1 ?? ""), cell2: String(r.cell2 ?? ""), cell3: String(r.cell3 ?? ""), cell4: String(r.cell4 ?? ""),
    email: String(r.email ?? ""), noCommunication: Boolean(r.noCommunication),
  }));
}
