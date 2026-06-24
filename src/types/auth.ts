export type Role = "admin" | "user" | "read_only";

export interface SessionUser {
  userId: string;
  username: string;
  displayName: string;
  active: boolean;
  roles: Role[];
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  active: boolean;
  roles: Role[];
  /** Future: map from tblOfficeStaff.OfficeStaffID */
  officeStaffId?: number;
}

export interface SessionData {
  user?: SessionUser;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
