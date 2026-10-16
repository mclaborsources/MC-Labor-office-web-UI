import { queryReadOnly } from "@/lib/db/sql";

export type JobListingKind = "current" | "employees" | "ocip" | "rate" | "shift";

export interface JobListingRow {
  id: string;
  customer: string;
  customerType: string;
  salesman: string;
  job: string;
  street: string;
  city: string;
  state: string;
  ocipJob: boolean;
  rateJob: boolean;
  rateReport: string;
  rateReportUser: string;
  rateReportTimestamp: string;
  shiftDifferential: boolean;
  instructions: string;
  officeNote: string;
  weekEnding: string;
  startDate: string;
  entryUser: string;
  entryDate: string;
  postType: string;
  jobHistory: string;
  age: string;
}

export interface JobListingPage {
  rows: JobListingRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface FieldSearchIndex {
  values: string[];
  rowsByValue: number[][];
  postings: Map<string, number[]>;
  valueIds: Map<string, number>;
}

interface IndexedDataset {
  expiresAt: number;
  rows: JobListingRow[];
  customerIndex: FieldSearchIndex;
  jobIndex: FieldSearchIndex;
}

const DATASET_TTL_MS = 5 * 60 * 1000;
const datasetCache = new Map<JobListingKind, IndexedDataset>();
const pendingDatasets = new Map<JobListingKind, Promise<IndexedDataset>>();

interface SqlRow extends Record<string, unknown> {
  RowId: number | string;
  Customer: string | null;
  CustomerType: string | null;
  Salesman: string | null;
  Job: string | null;
  Street?: string | null;
  OcipJob?: boolean | number | string | null;
  RateJob?: boolean | number | string | null;
  RateReport?: string | null;
  RateReportUser?: string | null;
  RateReportTimestamp?: string | null;
  ShiftDifferential?: boolean | number | string | null;
  City: string | null;
  State: string | null;
  Instructions: string | null;
  OfficeNote: string | null;
  WeekEnding: string | null;
  StartDate: string | null;
  EntryUser: string | null;
  EntryDate: string | null;
  PostType: string | null;
  JobHistory: number | string | null;
  Age: number | string | null;
}

const PROJECT_SOURCE = `
  SELECT p.ProjectID AS RowId, c.CustBusName AS Customer, ct.PullDownCustomerType AS CustomerType,
    LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName,'')+' '+ISNULL(sm.PullDownSalesmanLName,''))) AS Salesman,
    p.SiteName AS Job, p.SiteStreet AS Street, p.OCIPJob AS OcipJob,
    sc.City AS City, st.PullDownState AS State, p.ProjNote AS Instructions,
    p.ProjOfficeNote AS OfficeNote, CAST(NULL AS VARCHAR(30)) AS WeekEnding,
    CONVERT(VARCHAR(10),p.StartDate,101) AS StartDate, p.ProjectEntryUserName AS EntryUser,
    CONVERT(VARCHAR(10),p.ProjectEntryTimestamp,101) AS EntryDate, p.PostType AS PostType,
    ISNULL(ph.HistoryCount,0) AS JobHistory,
    CASE WHEN p.StartDate IS NULL THEN NULL ELSE DATEDIFF(day,p.StartDate,GETDATE()) END AS Age
  FROM tblProject p WITH (NOLOCK)
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
  LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
  LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
  LEFT JOIN (SELECT ProjectID, COUNT_BIG(1) AS HistoryCount FROM tblProjectPostHistory WITH (NOLOCK) GROUP BY ProjectID) ph ON ph.ProjectID=p.ProjectID
`;

const TRACKING_SOURCE = `
  SELECT t.TrackingID AS RowId, COALESCE(NULLIF(t.CustomerBusName,''),c.CustBusName) AS Customer,
    ct.PullDownCustomerType AS CustomerType,
    LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName,'')+' '+ISNULL(sm.PullDownSalesmanLName,''))) AS Salesman,
    COALESCE(NULLIF(t.SiteName,''),p.SiteName) AS Job, p.SiteStreet AS Street, p.OCIPJob AS OcipJob,
    sc.City AS City, st.PullDownState AS State,
    p.ProjNote AS Instructions, p.ProjOfficeNote AS OfficeNote,
    CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS WeekEnding,
    CONVERT(VARCHAR(10),p.StartDate,101) AS StartDate, t.AssignmentUserName AS EntryUser,
    CONVERT(VARCHAR(10),t.AssignmentTimestamp,101) AS EntryDate, p.PostType AS PostType,
    ISNULL(ph.HistoryCount,0) AS JobHistory,
    CASE WHEN p.StartDate IS NULL THEN NULL ELSE DATEDIFF(day,p.StartDate,GETDATE()) END AS Age
  FROM tblTracking t WITH (NOLOCK)
  LEFT JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=t.ProjectID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
  LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
  LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
  LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
  LEFT JOIN (SELECT ProjectID, COUNT_BIG(1) AS HistoryCount FROM tblProjectPostHistory WITH (NOLOCK) GROUP BY ProjectID) ph ON ph.ProjectID=t.ProjectID
`;

// The OCIP Access report is one row per project week (not one row per employee
// assignment), so use tblProjectWeeks to keep the report at the same grain.
const OCIP_SOURCE = `
  SELECT pw.ProjectWeekID AS RowId, c.CustBusName AS Customer,
    ct.PullDownCustomerType AS CustomerType,
    LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName,'')+' '+ISNULL(sm.PullDownSalesmanLName,''))) AS Salesman,
    p.SiteName AS Job, p.SiteStreet AS Street, p.OCIPJob AS OcipJob,
    sc.City AS City, st.PullDownState AS State,
    CONVERT(VARCHAR(10),pw.WeekEndingDate,101) AS WeekEnding,
    p.ProjectEntryUserName AS EntryUser,
    CONVERT(VARCHAR(10),p.ProjectEntryTimestamp,101) AS EntryDate,
    p.PostType AS PostType, ISNULL(ph.HistoryCount,0) AS JobHistory,
    CAST(0 AS INT) AS Age
  FROM tblProjectWeeks pw WITH (NOLOCK)
  JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=pw.ProjectID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
  LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
  LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
  LEFT JOIN (SELECT ProjectID, COUNT_BIG(1) AS HistoryCount FROM tblProjectPostHistory WITH (NOLOCK) GROUP BY ProjectID) ph ON ph.ProjectID=p.ProjectID
  WHERE ISNULL(p.OCIPJob,0)<>0
`;

const RATE_SOURCE = `
  SELECT pw.ProjectWeekID AS RowId, c.CustBusName AS Customer,
    ct.PullDownCustomerType AS CustomerType,
    LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName,'')+' '+ISNULL(sm.PullDownSalesmanLName,''))) AS Salesman,
    p.SiteName AS Job, p.SiteStreet AS Street, p.RateJob AS RateJob,
    sc.City AS City, st.PullDownState AS State,
    CONVERT(VARCHAR(10),pw.WeekEndingDate,101) AS WeekEnding,
    pw.HLinkRateReport AS RateReport,
    CAST(NULL AS VARCHAR(100)) AS RateReportUser,
    CAST(NULL AS VARCHAR(30)) AS RateReportTimestamp,
    p.ProjectEntryUserName AS EntryUser,
    CONVERT(VARCHAR(10),p.ProjectEntryTimestamp,101) AS EntryDate,
    p.PostType AS PostType, ISNULL(ph.HistoryCount,0) AS JobHistory,
    CASE WHEN p.StartDate IS NULL THEN NULL ELSE DATEDIFF(day,p.StartDate,GETDATE()) END AS Age
  FROM tblProjectWeeks pw WITH (NOLOCK)
  JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=pw.ProjectID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
  LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
  LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
  LEFT JOIN (SELECT ProjectID, COUNT_BIG(1) AS HistoryCount FROM tblProjectPostHistory WITH (NOLOCK) GROUP BY ProjectID) ph ON ph.ProjectID=p.ProjectID
  WHERE ISNULL(p.RateJob,0)<>0
`;

const SHIFT_DIFFERENTIAL_SOURCE = `
  SELECT pw.ProjectWeekID AS RowId, c.CustBusName AS Customer,
    ct.PullDownCustomerType AS CustomerType,
    LTRIM(RTRIM(ISNULL(sm.PullDownSalesmanFName,'')+' '+ISNULL(sm.PullDownSalesmanLName,''))) AS Salesman,
    p.SiteName AS Job, p.SiteStreet AS Street, p.ShiftDifferential AS ShiftDifferential,
    sc.City AS City, st.PullDownState AS State,
    CONVERT(VARCHAR(10),pw.WeekEndingDate,101) AS WeekEnding,
    CAST(NULL AS VARCHAR(30)) AS EntryUser,
    CAST(NULL AS VARCHAR(30)) AS EntryDate,
    CAST(NULL AS VARCHAR(30)) AS PostType,
    CAST(NULL AS INT) AS JobHistory,
    CAST(0 AS INT) AS Age
  FROM tblProjectWeeks pw WITH (NOLOCK)
  JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=pw.ProjectID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
  LEFT JOIN tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
  LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
  WHERE ISNULL(p.ShiftDifferential,0)<>0
`;

function grams(value: string): string[] {
  if (value.length < 3) return [];
  const result = new Set<string>();
  for (let offset = 0; offset <= value.length - 3; offset += 1) result.add(value.slice(offset, offset + 3));
  return [...result];
}

function buildFieldIndex(rows: JobListingRow[], key: "customer" | "job"): FieldSearchIndex {
  const values: string[] = [];
  const rowsByValue: number[][] = [];
  const postings = new Map<string, number[]>();
  const valueIds = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    const value = row[key].toLocaleLowerCase();
    let valueId = valueIds.get(value);
    if (valueId === undefined) {
      valueId = values.length;
      valueIds.set(value, valueId);
      values.push(value);
      rowsByValue.push([]);
      for (const gram of grams(value)) {
        const posting = postings.get(gram);
        if (posting) posting.push(valueId);
        else postings.set(gram, [valueId]);
      }
    }
    rowsByValue[valueId].push(rowIndex);
  });

  return { values, rowsByValue, postings, valueIds };
}

function matchingRowIndexes(index: FieldSearchIndex, queryText: string): number[] {
  const query = queryText.trim().toLocaleLowerCase();
  if (!query) return [];

  const queryGrams = grams(query);
  let possibleValues: number[];
  if (!queryGrams.length) {
    possibleValues = index.values.map((_, valueId) => valueId);
  } else {
    const postings = queryGrams.map((gram) => index.postings.get(gram));
    if (postings.some((posting) => !posting)) return [];
    const availablePostings = postings.filter((posting): posting is number[] => posting !== undefined);
    const shortest = availablePostings.reduce((smallest, posting) => posting.length < smallest.length ? posting : smallest, availablePostings[0]!);
    const otherPostingSets = availablePostings.filter((posting) => posting !== shortest).map((posting) => new Set(posting));
    possibleValues = shortest.filter((valueId) => otherPostingSets.every((set) => set.has(valueId)));
  }

  const matches: number[] = [];
  for (const valueId of possibleValues) {
    if (index.values[valueId].includes(query)) matches.push(...index.rowsByValue[valueId]);
  }
  matches.sort((a, b) => a - b);
  return matches;
}

async function loadIndexedDataset(kind: JobListingKind): Promise<IndexedDataset> {
  const cached = datasetCache.get(kind);
  if (cached && cached.expiresAt > Date.now()) return cached;
  const pending = pendingDatasets.get(kind);
  if (pending) return pending;

  const source = kind === "employees" ? TRACKING_SOURCE : kind === "ocip" ? OCIP_SOURCE : kind === "rate" ? RATE_SOURCE : kind === "shift" ? SHIFT_DIFFERENTIAL_SOURCE : PROJECT_SOURCE;
  const ordering = kind === "ocip" || kind === "shift"
    ? "ORDER BY Customer, Job, TRY_CONVERT(date, WeekEnding, 101), RowId"
    : kind === "rate"
      ? "ORDER BY TRY_CONVERT(date, WeekEnding, 101) DESC, Customer, Job, RowId DESC"
    : "ORDER BY Customer, Job, RowId DESC";
  const load = queryReadOnly<SqlRow>(`SELECT * FROM (${source}) SourceRows ${ordering}`).then((rawRows) => {
    const rows = rawRows.map((row) => ({
      id: String(row.RowId ?? ""), customer: row.Customer?.trim() ?? "", customerType: row.CustomerType?.trim() ?? "",
      salesman: row.Salesman?.trim() ?? "", job: row.Job?.trim() ?? "", street: row.Street?.trim() ?? "",
      city: row.City?.trim() ?? "", state: row.State?.trim() ?? "", ocipJob: Boolean(row.OcipJob && row.OcipJob !== "0"),
      rateJob: Boolean(row.RateJob && row.RateJob !== "0"), rateReport: row.RateReport?.trim() ?? "",
      rateReportUser: row.RateReportUser?.trim() ?? "", rateReportTimestamp: row.RateReportTimestamp?.trim() ?? "",
      shiftDifferential: Boolean(row.ShiftDifferential && row.ShiftDifferential !== "0"),
      instructions: row.Instructions?.trim() ?? "", officeNote: row.OfficeNote?.trim() ?? "", weekEnding: row.WeekEnding?.trim() ?? "",
      startDate: row.StartDate?.trim() ?? "", entryUser: row.EntryUser?.trim() ?? "", entryDate: row.EntryDate?.trim() ?? "",
      postType: row.PostType?.trim() ?? "", jobHistory: String(row.JobHistory ?? ""), age: String(row.Age ?? ""),
    }));
    const dataset = {
      expiresAt: Date.now() + DATASET_TTL_MS,
      rows,
      customerIndex: buildFieldIndex(rows, "customer"),
      jobIndex: buildFieldIndex(rows, "job"),
    };
    datasetCache.set(kind, dataset);
    return dataset;
  });
  pendingDatasets.set(kind, load);
  try { return await load; }
  finally { pendingDatasets.delete(kind); }
}

export async function getJobListingPage(options: {
  kind: JobListingKind;
  page?: number;
  pageSize?: number;
  customer?: string;
  job?: string;
}): Promise<JobListingPage> {
  const pageSize = Math.min(250, Math.max(1, Math.trunc(options.pageSize ?? 100)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const dataset = await loadIndexedDataset(options.kind);
  const customer = options.customer?.trim() ?? "";
  const job = options.job?.trim() ?? "";
  let filteredIndexes: number[] | null = null;
  if (customer) filteredIndexes = matchingRowIndexes(dataset.customerIndex, customer);
  if (job) {
    const jobIndexes = matchingRowIndexes(dataset.jobIndex, job);
    if (!filteredIndexes) filteredIndexes = jobIndexes;
    else {
      const candidateSet = new Set(jobIndexes);
      filteredIndexes = filteredIndexes.filter((rowIndex) => candidateSet.has(rowIndex));
    }
  }
  const total = filteredIndexes?.length ?? dataset.rows.length;
  const offset = (page - 1) * pageSize;
  const rows = filteredIndexes
    ? filteredIndexes.slice(offset, offset + pageSize).map((rowIndex) => dataset.rows[rowIndex])
    : dataset.rows.slice(offset, offset + pageSize);
  return {
    rows, total, page, pageSize,
  };
}
