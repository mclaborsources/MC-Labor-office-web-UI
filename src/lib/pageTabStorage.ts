export const PAGE_TABS_STORAGE_KEY = "mc-open-page-tabs-v2";

export function clearSavedPageTabs() {
  try { localStorage.removeItem(PAGE_TABS_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
}
