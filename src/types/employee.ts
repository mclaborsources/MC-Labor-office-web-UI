export interface EmployeeSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  cellPhone: string;
  email: string;
  trade: string;
  status: string;
  grade: string;
}

export interface EmployeeDetail extends EmployeeSummary {
  address: string;
  city: string;
  state: string;
  zip: string;
  /** Placeholder — assignment data expanded in Milestone 4 */
  recentAssignments: EmployeeAssignmentRow[];
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
