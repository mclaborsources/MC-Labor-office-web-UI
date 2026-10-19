import { queryReadOnly } from "@/lib/db/sql";

const COMPANY_SUFFIX: Record<string, string> = {
  AMP: "AMP", GS: "GS", HDE: "HDE", HSG: "HSG", IPG: "IPG", ISG: "ISG", MLS: "MLS", "T&R": "T_R",
};

export interface ContractReportCustomer {
  customerId: string;
  customerName: string;
  salesman: string;
  contractLink: string;
  wcDate: string;
  wcLink: string;
  glDate: string;
  glLink: string;
  hasProblem: boolean;
}

export interface ContractReportResult {
  data: ContractReportCustomer[];
  total: number;
  page: number;
  pageSize: number;
}

function column(name: string, available: Set<string>, fallback = "NULL") {
  return available.has(name.toLowerCase()) ? `c.[${name}]` : fallback;
}

function textColumn(name: string, available: Set<string>) {
  return available.has(name.toLowerCase()) ? `CONVERT(NVARCHAR(MAX),c.[${name}])` : "CAST(NULL AS NVARCHAR(MAX))";
}

export async function getContractReportCustomers(options: {
  search?: string;
  company?: string;
  problemsOnly?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<ContractReportResult> {
  const term = (options.search ?? "").trim().slice(0, 100);
  const searchPattern = term ? `%${term.replace(/[~%_[]/g, (character) => `~${character}`)}%` : null;
  const company = options.company && options.company in COMPANY_SUFFIX ? options.company : "IPG";
  const suffix = COMPANY_SUFFIX[company];
  const pageSize = Math.min(250, Math.max(25, Math.trunc(options.pageSize ?? 100)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));

  const schema = await queryReadOnly<{ COLUMN_NAME: string }>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblCustomer'",
  );
  const available = new Set(schema.map((row) => row.COLUMN_NAME.toLowerCase()));

  const contract = `COALESCE(NULLIF(${textColumn(`HLinkSalesContract${suffix}`, available)}, ''), ${textColumn("HLinkSalesContract", available)}, '')`;
  const wcDate = `COALESCE(${column(`WCxDate${suffix}`, available)}, ${column("WCxDate", available)})`;
  const wcLink = `COALESCE(NULLIF(${textColumn(`HLinkWCxDate${suffix}`, available)}, ''), ${textColumn("HLinkWCxDate", available)}, '')`;
  const glDate = `COALESCE(${column(`GLxDate${suffix}`, available)}, ${column("GLxDate", available)})`;
  const glLink = `COALESCE(NULLIF(${textColumn(`HLinkGLxDate${suffix}`, available)}, ''), ${textColumn("HLinkGLxDate", available)}, '')`;
  const salesman = "LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,'')))";
  const trackingJoin = "INNER JOIN (SELECT DISTINCT CustomerID FROM tblTracking WITH (NOLOCK) WHERE CustomerID IS NOT NULL) tr ON tr.CustomerID=c.CustomerID";
  const problemClause = options.problemsOnly
    ? `AND (NULLIF(${contract},'') IS NULL OR (${wcDate} IS NULL AND NULLIF(${wcLink},'') IS NULL) OR (${glDate} IS NULL AND NULLIF(${glLink},'') IS NULL))`
    : "";
  const from = `FROM tblCustomer c WITH (NOLOCK) ${trackingJoin}
    LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
    WHERE LEN(LTRIM(RTRIM(ISNULL(c.CustBusName,''))))>1
      AND c.CustBusName NOT IN ('-', '--', '---')
      AND (@searchPattern IS NULL OR c.CustBusName LIKE @searchPattern ESCAPE '~') ${problemClause}`;
  const params = [{ name: "searchPattern", value: searchPattern }];
  const countRows = await queryReadOnly<{ total: number }>(`SELECT COUNT_BIG(1) AS total ${from}`, params);
  const offset = (page - 1) * pageSize;
  const data = await queryReadOnly<ContractReportCustomer>(`SELECT
    CAST(c.CustomerID AS NVARCHAR(20)) AS customerId,
    ISNULL(c.CustBusName,'') AS customerName,
    ${salesman} AS salesman,
    ${contract} AS contractLink,
    CONVERT(VARCHAR(10),${wcDate},101) AS wcDate,
    ${wcLink} AS wcLink,
    CONVERT(VARCHAR(10),${glDate},101) AS glDate,
    ${glLink} AS glLink,
    CAST(CASE WHEN NULLIF(${contract},'') IS NULL OR (${wcDate} IS NULL AND NULLIF(${wcLink},'') IS NULL) OR (${glDate} IS NULL AND NULLIF(${glLink},'') IS NULL) THEN 1 ELSE 0 END AS BIT) AS hasProblem
    ${from}
    ORDER BY c.CustBusName,c.CustomerID OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`, [
    ...params, { name: "offset", value: offset }, { name: "pageSize", value: pageSize },
  ]);

  return { data, total: Number(countRows[0]?.total ?? 0), page, pageSize };
}
