// Enabled by the Windows launcher, which binds the server to loopback only.
export function isLocalMode() {
  return process.env.MC_LABOR_LOCAL_MODE === "1";
}
