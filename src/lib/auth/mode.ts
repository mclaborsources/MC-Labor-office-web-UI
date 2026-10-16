// This office app runs locally without an account-login flow by default.
// Set MC_LABOR_AUTH_ENABLED=1 to opt into the administrator login flow.
export function isLocalMode() {
  return process.env.MC_LABOR_AUTH_ENABLED !== "1";
}
