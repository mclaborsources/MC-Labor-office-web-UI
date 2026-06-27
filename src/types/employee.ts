export interface EmployeeSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  fullName: string;
  cellPhone: string;
  email: string;
  trade: string;
  status: string;
  grade: string;
  street: string;
  city: string;
  state: string;
  /** Latest assignment (customer · site) from tblTracking, for the search list */
  currentAssignment: string;
}

export interface EmployeeDetail extends EmployeeSummary {
  address: string;
  zip: string;
  extended: EmployeeExtended;
  rates: EmployeeRate[];
  contacts: EmployeeContact[];
  licenses: EmployeeLicense[];
  /** Placeholder — assignment data expanded in Milestone 4 */
  recentAssignments: EmployeeAssignmentRow[];
}

/** Selected fields from tblEmployeeB (extended employee record) */
export interface EmployeeExtended {
  businessName: string;
  willTravel: string;
  dotNumber: string;
  dotExpiration: string;
  licenseNumber: string;
  licenseIssueDate: string;
  ppe: string[];
}

export interface EmployeeRate {
  rateId: string;
  field: string;
  oldRate: string;
  newRate: string;
  note: string;
  changedBy: string;
  changedOn: string;
}

export interface EmployeeContact {
  contactId: string;
  fullName: string;
  relationship: string;
  phone: string;
  cell: string;
  email: string;
  emergency: boolean;
}

export interface EmployeeLicense {
  licenseId: string;
  state: string;
  type: string;
  number: string;
  expDate: string;
  notes: string;
}

export interface EmployeeAssignmentRow {
  trackingId: string;
  customerName: string;
  jobName: string;
  weekEnding: string;
  assignWeek: number;
  assignYear: number;
}

export interface EmployeeFilters {
  search: string;
  tradeId: string;
  statusId: string;
  gradeId: string;
}

/** Raw row returned from tblEmployee + lookup JOINs — column names confirmed from McLabor schema */
export interface EmployeeRow {
  EmployeeID: number | string | null;
  EmFirstName: string | null;
  EmLastName: string | null;
  EmMiddle: string | null;
  EmMobilePhone: string | null;
  EmEmail: string | null;
  EmTradeID: number | string | null;
  TradeName: string | null;
  EmEmployeeStatusID: number | string | null;
  StatusName: string | null;
  EmGradeID: number | string | null;
  GradeName: string | null;
  EmStreet: string | null;
  EmCity: string | null;
  EmState: string | null;
  EmZip: string | null;
}

/** Selected confirmed columns from tblEmployeeB */
export interface EmployeeBRow {
  BusinessName: string | null;
  WillTravel: string | null;
  DOTNumber: string | null;
  DOTExpirationDate: string | null;
  LicenseNumber: string | null;
  LicenseIssueDate: string | null;
  PPEHardHat: boolean | number | null;
  PPESteelToeBoots: boolean | number | null;
  PPESafetyGlasses: boolean | number | null;
  PPEGloves: boolean | number | null;
  PPEMasks: boolean | number | null;
  PPEHighVisibilityVest: boolean | number | null;
}

/** Confirmed columns from tblEmployeeRates */
export interface EmployeeRateRow {
  EmployeeRateID: number | string | null;
  EmployeeRateField: string | null;
  EmployeeRateOld: number | string | null;
  EmployeeRateNew: number | string | null;
  EmployeeRateNote: string | null;
  EmployeeRateUserName: string | null;
  EmployeeRateTimestamp: string | null;
}

/** Confirmed columns from tblEmployeeContacts */
export interface EmployeeContactRow {
  EmployeeContactID: number | string | null;
  EmployeeContactFName: string | null;
  EmployeeContactLName: string | null;
  EmployeeContactRelationship: string | null;
  EmployeeContactPhone: string | null;
  EmployeeContactCell: string | null;
  EmployeeContactEmail: string | null;
  EmployeeContactEmergency: boolean | number | null;
}

/** Confirmed columns from tblEmployeeLicenses */
export interface EmployeeLicenseRow {
  EmployeeLicenseID: number | string | null;
  EmployeeLicenseStateID: number | string | null;
  EmployeeLicenseTypeID: number | string | null;
  EmployeeLicenseNumber: string | null;
  EmployeeLicenseExpDate: string | null;
  EmployeeLicenseNotes: string | null;
}
