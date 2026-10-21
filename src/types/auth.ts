export type Role = "admin" | "user" | "read_only";

export interface SessionUser {
  officeStaffId?: number;
  initials?: string;
  title?: string;
  email?: string;
  canDelete?: boolean;
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
  loginGeneration?: string;
  loginNoteDate?: string;
  loginRemindersPending?: boolean;
  needsLoginPrompts?: boolean;
  officeStaffLoginId?: number;
  user?: SessionUser;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
