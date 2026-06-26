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
  foremanPhone: string;
  notes: string;
  customerPhone: string;
  customerEmail: string;
  customerStreet: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  /** Expanded in Milestone 4 */
  recentAssignments: JobAssignmentPreview[];
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
  // City/State stored as SiteStateCityID — no direct text columns on tblProject
  ProjStatusID: number | string | null;
  SiteForemanID: number | string | null; // FK to tblCustomerForeman.CustomerForemanID
  StartDate: string | null;
  EndDate: string | null;
  ProjNote: string | null;          // notes (was Notes)
  // Denormalized customer contact info stored directly on tblProject
  CustomerPhone: string | null;
  CustomerEmail: string | null;
}
