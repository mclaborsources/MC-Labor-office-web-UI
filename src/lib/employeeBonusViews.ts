export function employeeBonusViewFilters(view: string): Record<string, string> {
  switch (view) {
    case "View 01": return { "Bonus Exp Status": "__unpaid_or_late__" };
    case "View 02": return { "Bonus Exp Status": "Unpaid" };
    case "View 03": return { "Bonus Exp Status": "Paid" };
    case "View 04": return { "Bonus Exp Status": "Review" };
    default: return {};
  }
}

export const EMPLOYEE_BONUS_VIEW_DESCRIPTIONS: Record<string, string> = {
  "View 01": "Unpaid and Late Starter employees (original Access default)",
  "View 02": "All unpaid employees",
  "View 03": "Paid employees",
  "View 04": "Employees awaiting review",
  "View 05": "All employees with bonus settings",
};
