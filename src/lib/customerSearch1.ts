import { queryReadOnly } from "@/lib/db/sql";
import type { QueryParam } from "@/types/db";

/** Apply the standard Customers controls without loading the paginated customer query. */
export async function getCustomerSearch1Ids(params: Record<string, string | undefined>): Promise<Set<string> | null> {
  const where: string[] = [];
  const inputs: QueryParam[] = [];
  const contains = (key: string, expression: string) => {
    const value = params[key]?.trim();
    if (!value) return;
    inputs.push({ name: key, value: `%${value.replace(/[~%_[]/g, char => `~${char}`)}%` });
    where.push(`${expression} LIKE @${key} ESCAPE '~'`);
  };
  const phone = (key: string, expressions: string[]) => {
    if (!params[key]?.trim()) return;
    const digits = params[key]!.replace(/\D/g, "");
    if (!digits) { where.push("1 = 0"); return; }
    inputs.push({ name: key, value: `%${digits}%` });
    const normalized = (expression: string) => `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(${expression}, ''), ' ', ''), '(', ''), ')', ''), '-', ''), '.', ''), '+', '')`;
    where.push(`(${expressions.map(expression => `${normalized(expression)} LIKE @${key}`).join(" OR ")})`);
  };
  contains("customerName", "c.CustBusName");
  phone("customerPhone", ["c.Phone"]);
  if (params.contactPhone?.trim()) {
    const previousLength = where.length;
    phone("contactPhone", ["cc.CustomerContactCell", "cc.CustomerContactOfficePhone"]);
    if (where.length > previousLength) {
      const phoneClause = where.pop()!;
      where.push(`EXISTS (SELECT 1 FROM tblCustomerContacts cc WITH (NOLOCK) WHERE cc.CustomerID = c.CustomerID AND ${phoneClause})`);
    }
  }
  contains("city", "c.City");
  if (params.state) {
    inputs.push({ name: "state", value: params.state });
    where.push("c.State = @state");
  }
  for (const [key, column] of [["salesmanId", "SalesmanID"], ["customerTypeId", "CustomerTypeID"], ["statusId", "CustStatusID"]]) {
    if (!params[key]) continue;
    const id = Number(params[key]);
    if (!Number.isSafeInteger(id)) { where.push("1 = 0"); continue; }
    inputs.push({ name: key, value: id });
    where.push(`c.${column} = @${key}`);
  }
  if (params.search?.trim()) {
    const value = params.search.trim().replace(/[~%_[]/g, char => `~${char}`);
    inputs.push({ name: "search", value: `%${value}%` });
    where.push("(c.CustBusName LIKE @search ESCAPE '~' OR CONVERT(varchar(20), c.CustomerID) LIKE @search ESCAPE '~' OR c.Phone LIKE @search ESCAPE '~' OR c.CustEmail LIKE @search ESCAPE '~' OR c.Street LIKE @search ESCAPE '~' OR c.City LIKE @search ESCAPE '~')");
  }
  for (const [key, expression] of [
    ["contactName", "CONCAT(cc.CustomerContactFName, ' ', cc.CustomerContactLName)"],
    ["contactEmail", "cc.CustomerContactEmail"], ["contactText", "cc.CustomerContactTextMsgAddress"],
  ]) {
    const value = params[key]?.trim();
    if (!value) continue;
    inputs.push({ name: key, value: `%${value.replace(/[~%_[]/g, char => `~${char}`)}%` });
    where.push(`EXISTS (SELECT 1 FROM tblCustomerContacts cc WITH (NOLOCK) WHERE cc.CustomerID = c.CustomerID AND ${expression} LIKE @${key} ESCAPE '~')`);
  }
  if (!where.length) return null;
  const rows = await queryReadOnly<{ CustomerID: unknown }>(`SELECT c.CustomerID FROM tblCustomer c WITH (NOLOCK) WHERE ${where.map(clause => `(${clause})`).join(" AND ")} OPTION (RECOMPILE)`, inputs);
  return new Set(rows.map(row => String(row.CustomerID)));
}
