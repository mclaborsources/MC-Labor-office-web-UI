export interface JobSummary {
  jobId: string;
  customerId: string;
  customerName: string;
  customerType: string;
  salesman: string;
  jobName: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  foremanName: string;
  startDate: string;
  endDate: string;
}

export interface JobDetail extends JobSummary {
  street: string;
  projectWeeks: ProjectWeek[];
  foremanPhone: string;
  notes: string;
  officeNote: string;
  jobNote: string;
  customerContact: string;
  customerPhone: string;
  customerEmail: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  customerNotes: string;
  // Contract / financial
  contractAmount: string;
  contractTotalPayments: string;
  contractBalanceOwed: string;
  numberOfEmployees: string;
  gcOnSite: string;
  // System
  entryUserName: string;
  entryTimestamp: string;
  /** Expanded in Milestone 4 */
  recentAssignments: JobAssignmentPreview[];
}

/** Extended raw row from tblProject for the detail screen. */
export interface JobDetailRow extends JobRow {
  ProjOfficeNote: string | null;
  JobNote: string | null;
  CustomerContact: string | null;
  CustomerNotes: string | null;
  ContractAmount: number | string | null;
  ContractTotalPayments: number | string | null;
  ContractBalanceOwed: number | string | null;
  NumberOfEmployees: number | string | null;
  GCOnSite: string | null;
  ProjectEntryUserName: string | null;
  ProjectEntryTimestamp: string | null;
}

export interface JobAssignmentPreview {
  trackingId: string;
  employeeId: string;
  employeeName: string;
  weekEnding: string;
  assignWeek: number;
  assignYear: number;
  payRate: string;
  billRate: string;
}

export interface ProjectWeek {
  weekId: string;
  weekEnding: string;
  assignWeek: string;
  assignYear: string;
  rateReportLink: string;
}

export interface JobFilters {
  search: string;
  customerId: string;
  salesmanId: string;
  customerTypeId: string;
  statusId: string;
  city: string;
  state: string;
}

/** Raw row from tblProject + tblCustomer JOIN — confirmed column names */
export interface JobRow {
  ProjectID: number | string | null;
  CustomerID: number | string | null;
  CustBusName: string | null;
  CustomerTypeID: number | string | null;
  SalesmanID: number | string | null;
  SiteName: string | null;          // job/site name (was ProjName)
  SiteStreet: string | null;        // site street (was Street)
  SiteZip: string | null;           // site zip (was Zip)
  SiteStateCityID: number | string | null; // FK → tblPullDownStateCities
  ProjStatusID: number | string | null;
  SiteForemanID: number | string | null; // FK to tblCustomerForeman.CustomerForemanID
  StartDate: string | null;
  EndDate: string | null;
  ProjNote: string | null;          // notes (was Notes)
  // Denormalized customer contact info stored directly on tblProject
  CustomerPhone: string | null;
  CustomerEmail: string | null;
}

/** Confirmed columns from tblProjectWeeks */
export interface ProjectWeekRow {
  ProjectWeekID: number | string | null;
  AssignWeek: number | string | null;
  AssignYear: number | string | null;
  WeekEndingDate: string | null;
  HLinkRateReport: string | null;
}
