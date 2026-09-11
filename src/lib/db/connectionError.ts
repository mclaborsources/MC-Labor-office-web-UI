/** Classify driver errors without returning raw messages or credentials. */
export function connectionErrorMessage(error: unknown): string {
  const codes: string[] = [];
  const messages: string[] = [];
  const seen = new Set<unknown>();
  function inspect(value: unknown, depth = 0) {
    if (!value || typeof value !== "object" || seen.has(value) || depth > 5) return;
    seen.add(value);
    const item = value as Record<string, unknown>;
    if (typeof item.code === "string") codes.push(item.code.toUpperCase());
    if (typeof item.number === "number") codes.push(String(item.number));
    if (typeof item.message === "string") messages.push(item.message.toLowerCase());
    for (const key of ["cause", "originalError", "info"]) inspect(item[key], depth + 1);
    for (const key of ["errors", "precedingErrors"]) {
      if (Array.isArray(item[key])) for (const child of item[key]) inspect(child, depth + 1);
    }
  }
  inspect(error);
  const detail = messages.join(" ");
  if (codes.includes("4060") || detail.includes("cannot open database")) return "SQL Server could not open the database. Check the Database name and that this SQL login has access to it.";
  if (/certificate|self.signed|unable to verify/.test(detail) || codes.some(code => /CERT|SELF_SIGNED/.test(code))) return "SQL Server certificate validation failed. For a known office server using a self-signed certificate, open Advanced connection settings and enable Trust server certificate, then retry.";
  if (codes.includes("ELOGIN") || codes.includes("18456")) return "SQL Server rejected the login. Check the SQL Login and Password and confirm that SQL authentication is enabled on the server.";
  if (codes.includes("EINSTLOOKUP")) return "The SQL Server instance could not be found. Check the instance name and SQL Server Browser service, or enter the instance's TCP port instead.";
  if (codes.some(code => ["ETIMEOUT", "ESOCKET", "ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "ETIMEDOUT"].includes(code))) return "Could not reach SQL Server. Check the server address, office network or VPN, and SQL TCP port. Under Advanced, enter the actual port or instance name. Also check that SQL Server is running with TCP/IP enabled and its firewall allows the connection.";
  return "SQL Server connection failed. Check the server, database, SQL credentials, and Advanced connection settings. The driver did not provide a recognized error category.";
}
