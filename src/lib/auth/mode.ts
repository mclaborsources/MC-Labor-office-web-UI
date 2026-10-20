// This office app runs locally without an account-login flow by default.
// Set MC_LABOR_AUTH_ENABLED=1 to opt into the administrator login flow.
export function isLocalMode() {
  if (isOfficeStaffMode()) return false;
  return process.env.MC_LABOR_AUTH_ENABLED !== "1";
}

export function isOfficeStaffMode() {
  return process.env.MC_LABOR_AUTH_PROVIDER === "office-staff";
}
