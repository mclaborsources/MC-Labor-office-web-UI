import { queryReadOnly } from "@/lib/db/sql";

export interface ManpowerRow {
  id: string;
  customer: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  customerType: string;
  phone: string;
  salesman: string;
  contact: string;
  officePhone: string;
  cell: string;
  email: string;
  inTracking: number;
}

export interface ManpowerContactFilters {
  page: number;
  pageSize: number;
  search: string;
  salesman: string;
  customerType: string;
  tracking: "" | "yes" | "no";
  oneContact: boolean;
  sort: "customer" | "salesman" | "contact";
  descending: boolean;
}

export interface ManpowerContactPage {
  rows: ManpowerRow[];
  total: number;
  salesmen: string[];
  customerTypes: string[];
}

export async function getManpowerContactPage(filters: ManpowerContactFilters): Promise<ManpowerContactPage> {
  const search = filters.search.trim().slice(0, 100);
  const searchPattern = search ? `%${search.replace(/[~%_[]/g, (character) => `~${character}`)}%` : null;
  const offset = (filters.page - 1) * filters.pageSize;
  const sortColumns = { customer: "customer", salesman: "salesman", contact: "contact" } as const;
  const sortColumn = sortColumns[filters.sort];
  const direction = filters.descending ? "DESC" : "ASC";
  const tieBreakers = sortColumn === "customer" ? "id" : "customer,id";

  const [rows, salesmen, customerTypes] = await Promise.all([
    queryReadOnly<ManpowerRow & { totalCount: number | string }>(`WITH base_rows AS (
      SELECT CAST(c.CustomerID AS NVARCHAR(20)) id,
        ISNULL(c.CustBusName,'') customer, ISNULL(c.Street,'') street,
        ISNULL(c.City,'') city, ISNULL(c.State,'') state, ISNULL(c.Zip,'') zip,
        ISNULL(ct.PullDownCustomerType,'') customerType, ISNULL(c.Phone,'') phone,
        LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))) salesman,
        LTRIM(RTRIM(ISNULL(cc.CustomerContactFName,'')+' '+ISNULL(cc.CustomerContactLName,''))) contact,
        ISNULL(cc.CustomerContactOfficePhone,'') officePhone,
        ISNULL(cc.CustomerContactCell,'') cell, ISNULL(cc.CustomerContactEmail,'') email,
        CASE WHEN EXISTS(SELECT 1 FROM tblTracking t WITH (NOLOCK) WHERE t.CustomerID=c.CustomerID) THEN 1 ELSE 0 END inTracking,
        ROW_NUMBER() OVER (PARTITION BY c.CustomerID ORDER BY cc.CustomerContactSort,cc.CustomerContactLName,cc.CustomerContactFName) contactRank
      FROM tblCustomer c WITH (NOLOCK)
      LEFT JOIN tblCustomerContacts cc WITH (NOLOCK) ON cc.CustomerID=c.CustomerID
      LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
      LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
      WHERE LEN(LTRIM(RTRIM(ISNULL(c.CustBusName,''))))>1
        AND c.CustBusName NOT IN ('-', '--', '---')
        AND (@searchPattern IS NULL OR c.CustBusName LIKE @searchPattern ESCAPE '~'
          OR c.Street LIKE @searchPattern ESCAPE '~' OR c.City LIKE @searchPattern ESCAPE '~'
          OR c.State LIKE @searchPattern ESCAPE '~' OR c.Phone LIKE @searchPattern ESCAPE '~'
          OR cc.CustomerContactFName LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactLName LIKE @searchPattern ESCAPE '~'
          OR cc.CustomerContactEmail LIKE @searchPattern ESCAPE '~' OR cc.CustomerContactCell LIKE @searchPattern ESCAPE '~'
          OR cc.CustomerContactOfficePhone LIKE @searchPattern ESCAPE '~')
        AND (@salesman='' OR LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,'')))=@salesman)
        AND (@customerType='' OR ISNULL(ct.PullDownCustomerType,'')=@customerType)
        AND (@tracking='' OR (CASE WHEN EXISTS(SELECT 1 FROM tblTracking th WITH (NOLOCK) WHERE th.CustomerID=c.CustomerID) THEN 'yes' ELSE 'no' END)=@tracking)
    ), filtered_rows AS (
      SELECT * FROM base_rows WHERE @oneContact=0 OR contactRank=1
    )
    SELECT id,customer,street,city,state,zip,customerType,phone,salesman,contact,officePhone,cell,email,inTracking,
      COUNT_BIG(*) OVER() AS totalCount
    FROM filtered_rows
    ORDER BY ${sortColumn} ${direction}, ${tieBreakers}
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`, [
      { name: "searchPattern", value: searchPattern },
      { name: "salesman", value: filters.salesman },
      { name: "customerType", value: filters.customerType },
      { name: "tracking", value: filters.tracking },
      { name: "oneContact", value: filters.oneContact ? 1 : 0 },
      { name: "offset", value: offset },
      { name: "pageSize", value: filters.pageSize },
    ]),
    queryReadOnly<{ label: string }>(`SELECT DISTINCT LTRIM(RTRIM(ISNULL(PullDownSalesmanFName,'')+' '+ISNULL(PullDownSalesmanLName,''))) label FROM tblPullDownSalesman WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(PullDownSalesmanFName,'')+' '+ISNULL(PullDownSalesmanLName,''))))>0 ORDER BY label`),
    queryReadOnly<{ label: string }>(`SELECT DISTINCT PullDownCustomerType label FROM tblPullDownCustomerTypes WITH (NOLOCK) WHERE NULLIF(LTRIM(RTRIM(PullDownCustomerType)),'') IS NOT NULL ORDER BY label`),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id, customer: row.customer, street: row.street, city: row.city,
      state: row.state, zip: row.zip, customerType: row.customerType, phone: row.phone,
      salesman: row.salesman, contact: row.contact, officePhone: row.officePhone,
      cell: row.cell, email: row.email, inTracking: row.inTracking,
    })),
    total: Number(rows[0]?.totalCount ?? 0),
    salesmen: salesmen.map((row) => row.label),
    customerTypes: customerTypes.map((row) => row.label),
  };
}
