export interface CustomerSummary {
  customerId: string;
  customerName: string;
  customerType: string;
  salesman: string;
  phone: string;
  email: string;
  city: string;
  state: string;
}

export interface CustomerDetail extends CustomerSummary {
  street: string;
  zip: string;
  contacts: CustomerContact[];
  foremen: CustomerForeman[];
  /** Placeholder — jobs expanded in Milestone 3 */
  jobsPlaceholder: boolean;
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
}

/** Raw row from tblCustomer + lookup JOINs — column names confirmed from McLabor schema */
export interface CustomerRow {
  CustomerID: number | string | null;
  CustBusName: string | null;
  CustomerType: string | null;        // aliased from lookup
  CustomerTypeID: number | string | null;
  SalesmanName: string | null;        // aliased from lookup
  SalesmanID: number | string | null;
  Phone: string | null;
  CustEmail: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  Zip: string | null;
}

export interface CustomerContactRow {
  ContactID: number | string | null;
  CustomerID: number | string | null;
  FirstName: string | null;
  LastName: string | null;
  Title: string | null;
  Email: string | null;
  CellPhone: string | null;
  OfficePhone: string | null;
  Notes: string | null;
}

export interface CustomerForemanRow {
  ForemanID: number | string | null;
  CustomerID: number | string | null;
  ForemanName: string | null;
  Phone: string | null;
  Email: string | null;
  Notes: string | null;
}
