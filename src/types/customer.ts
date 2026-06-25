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

/** Raw row from tblCustomer — confirmed column names from McLabor schema.
 *  Type and salesman names are resolved separately via app-level lookup maps. */
export interface CustomerRow {
  CustomerID: number | string | null;
  CustBusName: string | null;
  CustomerTypeID: number | string | null;
  SalesmanID: number | string | null;
  Phone: string | null;
  CustEmail: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  Zip: string | null;
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
