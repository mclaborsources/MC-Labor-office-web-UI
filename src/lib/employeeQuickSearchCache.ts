import { createHash } from "node:crypto";
import { employeeQuickSearchCache } from "@/lib/boundedQueryCache";
import { getEmployeeQuickSearch, getQuickSearchPayroll, type QuickSearchParams } from "@/lib/employeeQuickSearch";
import { getOfficeFeatures } from "@/lib/auth/office-staff";
import { getDatabaseSettings } from "@/lib/config/database";
import type { SessionData } from "@/types/auth";

export async function quickSearchCacheScope(session: SessionData) {
  // These checks remain live. Revoking a company permission changes the cache key.
  const features = session.user?.officeStaffId ? await getOfficeFeatures(session.user.officeStaffId) : [];
  const permissions = features.map(feature => [feature.objectName, feature.controlName]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return createHash("sha256").update(JSON.stringify([getDatabaseSettings(), session.user?.userId, session.officeStaffLoginId, permissions, employeeQuickSearchCache.version()])).digest("hex");
}
export function cachedQuickSearch(scope: string, params: QuickSearchParams, refresh = false) {
  if (refresh) employeeQuickSearchCache.clear();
  return employeeQuickSearchCache.get(JSON.stringify([scope, "employees", params.name ?? "", params.cell ?? "", params.search ?? "", params.offset ?? 0, params.staffId]), () => getEmployeeQuickSearch(params));
}
export function cachedQuickSearchPayroll(scope: string, id: number, staffId?: number) {
  return employeeQuickSearchCache.get(JSON.stringify([scope, "payroll", id]), () => getQuickSearchPayroll(id, staffId));
}
