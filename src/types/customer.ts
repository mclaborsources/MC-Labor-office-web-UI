export interface CustomerSummary {
  customerId: string;
  customerName: string;
  customerType: string;
  salesman: string;
  status: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface CustomerJobPreview {
  jobId: string;
  jobName: string;
  status: string;
  address: string;
}

export interface CustomerDetail extends CustomerSummary {
  // Physical / mailing address
  fullAddress: string;
  mailStreet: string;
  mailCity: string;
  mailState: string;
  mailZip: string;
  // Contact / web
  fax: string;
  website: string;
  corpWebsite: string;
  // Sales / billing
  creditLimit: string;
  qbCustomerId: string;
  licenseNumber: string;
  // Notes
  customerNote: string;
  invoiceNote: string;
  collectionsNote: string;
  // System fields
  entryUserName: string;
  entryTimestamp: string;
  // Related
  contacts: CustomerContact[];
  foremen: CustomerForeman[];
  jobs: CustomerJobPreview[];
  billRates: CustomerBillRate[];
  weeks: CustomerWeek[];
}

export interface CustomerBillRate {
  billRateId: string;
  grade: string;
  billRate: string;
  note: string;
  active: boolean;
}

export interface CustomerWeek {
  weekId: string;
  weekEnding: string;
  assignWeek: string;
  assignYear: string;
  invoiceNum: string;
  invoiceTotal: string;
  openBalance: string;
  paid: boolean;
  invoiceSent: boolean;
  locked: boolean;
}

export interface CustomerContact {
  contactId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string;
  cellPhone: string;
  officePhone: string;
  notes: string;
}

export interface CustomerForeman {
  foremanId: string;
  foremanName: string;
  phone: string;
  email: string;
  notes: string;
}

export interface CustomerFilters {
  search: string;
  salesmanId: string;
  customerTypeId: string;
  city: string;
  state: string;
}

/** Raw row from tblCustomer — confirmed column names from McLabor schema. */
export interface CustomerRow {
  CustomerID: number | string | null;
  CustBusName: string | null;
  CustomerTypeID: number | string | null;
  SalesmanID: number | string | null;
  CustStatusID: number | string | null;
  Phone: string | null;
  CustEmail: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  Zip: string | null;
}

/** Confirmed column names from tblCustomerBillRates */
export interface CustomerBillRateRow {
  CustomerBillRateID: number | string | null;
  BillRateGrade: string | null;
  BillRate: number | string | null;
  BillRateNote: string | null;
  BillRateActive: boolean | number | null;
}

/** Confirmed column names from tblCustomerWeeks */
export interface CustomerWeekRow {
  CustomerWeekID: number | string | null;
  AssignWeek: number | string | null;
  AssignYear: number | string | null;
  WeekEndingDate: string | null;
  InvoiceNum: string | null;
  InvoiceTotal: number | string | null;
  OpenBalance: number | string | null;
  Paid: boolean | number | null;
  InvoiceSent: boolean | number | null;
  WeekLocked: boolean | number | null;
}

/** Extended raw row from tblCustomer for the detail screen. */
export interface CustomerDetailRow extends CustomerRow {
  Address: string | null;
  MailStreet: string | null;
  MailCity: string | null;
  MailState: string | null;
  MailZip: string | null;
  CustFaxNum: string | null;
  CustWebSiteHLink: string | null;
  CustCorpWebSiteHLink: string | null;
  CreditLimit: number | string | null;
  QBCustomerID: number | string | null;
  CustomerLicenseNumber: string | null;
  CustomerNote: string | null;
  InvoiceNote: string | null;
  CollectionsNote: string | null;
  CustEntryUserName: string | null;
  CustEntryTimestamp: string | null;
}

/** Confirmed column names from tblCustomerContacts */
export interface CustomerContactRow {
  CustomerContactID: number | string | null;
  CustomerID: number | string | null;
  CustomerContactFName: string | null;
  CustomerContactLName: string | null;
  CustomerContactEmail: string | null;
  CustomerContactCell: string | null;
  CustomerContactOfficePhone: string | null;
  CustomerContactNotes: string | null;
}

/** Confirmed column names from tblCustomerForeman */
export interface CustomerForemanRow {
  CustomerForemanID: number | string | null;
  CustomerID: number | string | null;
  CustomerForeman: string | null;
  CustomerForemanPhone: string | null;
  CustomerForemanDefault: boolean | number | null;
}

/** Job preview row from tblProject for a customer */
export interface CustomerJobRow {
  ProjectID: number | string | null;
  SiteName: string | null;
  ProjStatusID: number | string | null;
  SiteStreet: string | null;
  SiteZip: string | null;
}
