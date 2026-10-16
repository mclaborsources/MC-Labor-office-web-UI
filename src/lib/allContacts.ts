import { queryReadOnly } from "@/lib/db/sql";
import type { AllContactRow } from "@/types/allContacts";
import { buildTextSearchIndex, searchTextIndex, type TextSearchIndex } from "@/lib/textSearchIndex";

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
ORDER BY lastName, firstName, customerName, employeeName`;

export interface AllContactFilters {
  search?: string; name?: string; cell?: string; email?: string;
  includeCompanies: boolean; includeEmployees: boolean; includeNoCommunication: boolean;
}

const CONTACT_INDEX_TTL_MS = 5 * 60 * 1000;
let contactIndexCache: { expiresAt: number; rows: AllContactRow[]; index: TextSearchIndex } | null = null;
let contactIndexLoad: Promise<{ expiresAt: number; rows: AllContactRow[]; index: TextSearchIndex }> | null = null;

async function loadContactIndex() {
  if (contactIndexCache && contactIndexCache.expiresAt > Date.now()) return contactIndexCache;
  if (!contactIndexLoad) {
    contactIndexLoad = queryReadOnly<RawContactRow>(ALL_CONTACTS_SQL).then((rawRows) => {
      const rows = rawRows.map((r) => ({
        id: String(r.id ?? ""), profileType: String(r.profileType ?? "Company Contact") as AllContactRow["profileType"],
        customerId: String(r.customerId ?? ""), customerName: String(r.customerName ?? ""),
        employeeId: String(r.employeeId ?? ""), employeeName: String(r.employeeName ?? ""),
        firstName: String(r.firstName ?? ""), lastName: String(r.lastName ?? ""),
        cell1: String(r.cell1 ?? ""), cell2: String(r.cell2 ?? ""), cell3: String(r.cell3 ?? ""), cell4: String(r.cell4 ?? ""),
        email: String(r.email ?? ""), noCommunication: Boolean(r.noCommunication),
      }));
      const index = buildTextSearchIndex(rows.map((r) => [
        r.firstName, r.lastName, r.customerName, r.employeeName, r.cell1, r.cell2, r.cell3, r.cell4, r.email,
      ]));
      const cached = { expiresAt: Date.now() + CONTACT_INDEX_TTL_MS, rows, index };
      contactIndexCache = cached;
      return cached;
    }).finally(() => { contactIndexLoad = null; });
  }
  return contactIndexLoad;
}

export async function getAllContacts(filters: AllContactFilters): Promise<AllContactRow[]> {
  const { rows, index } = await loadContactIndex();
  return searchTextIndex(index, filters.search ?? "")
    .map((rowIndex) => rows[rowIndex])
    .filter((row) => {
      const name = filters.name?.trim().toLocaleLowerCase() ?? "";
      const cell = filters.cell?.trim().toLocaleLowerCase() ?? "";
      const email = filters.email?.trim().toLocaleLowerCase() ?? "";
      const names = [row.firstName, row.lastName, row.firstName + " " + row.lastName].map((value) => value.toLocaleLowerCase());
      const cells = [row.cell1, row.cell2, row.cell3, row.cell4].map((value) => value.toLocaleLowerCase());
      return (!name || names.some((value) => value.includes(name)))
        && (!cell || cells.some((value) => value.includes(cell)))
        && (!email || row.email.toLocaleLowerCase().includes(email))
        && (filters.includeCompanies || row.profileType !== "Company Contact")
        && (filters.includeEmployees || row.profileType !== "Employee Contact")
        && (filters.includeNoCommunication || !row.noCommunication);
    });
}
