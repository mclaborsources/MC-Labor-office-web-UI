/** Compare to the browser-facing Host, not Next's internal listen address. */
export function hasSameOrigin(request: Request): boolean {
  const raw = request.headers.get("origin");
  if (!raw || raw === "null") return false;
  try {
    const origin = new URL(raw);
    const target = new URL(request.url);
    const host = request.headers.get("host") ?? target.host;
    return origin.origin === raw && origin.protocol === target.protocol && origin.host === host;
  } catch { return false; }
}
