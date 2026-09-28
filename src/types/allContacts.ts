export type AllContactProfileType = "Company Contact" | "Employee Contact";

export interface AllContactRow {
  id: string;
  profileType: AllContactProfileType;
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  firstName: string;
  lastName: string;
  cell1: string;
  cell2: string;
  cell3: string;
  cell4: string;
  email: string;
  noCommunication: boolean;
}
