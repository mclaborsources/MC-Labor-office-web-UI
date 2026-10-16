"use client";

import { useState } from "react";
import type { EmployeeDetail } from "@/types/employee";

export function EmployeeOptionsScreen({ employee }: { employee: EmployeeDetail }) {
  const fields = employee.accessFields;
  const initialChecked = (keys: string[], fallback: boolean) => {
    const found = keys.map(key => fields[key]).find(value => value !== undefined && value !== "");
    return found === undefined ? fallback : ["1", "true", "yes", "checked"].includes(found.toLowerCase());
  };
  const [checks, setChecks] = useState({
    autoText: initialChecked(["EmployeeHoursTimesheetAutoText", "HoursTimesheetAutoText"], true),
    excludeSick: initialChecked(["EmployeeExcludeSickTime", "ExcludeSickTime"], true),
    excludeWorkersComp: initialChecked(["EmployeeExcludeWorkersComp", "ExcludeWorkersComp"], true),
    excludeReports: initialChecked(["EmployeeExcludeFromReports", "ExcludeFromReports"], false),
    adminOnly: initialChecked(["EmployeeAdminOnlyRecord", "AdminOnlyRecord"], false),
  });
  const toggle = (key: keyof typeof checks) => setChecks(current => ({ ...current, [key]: !current[key] }));

  return <div className="er-options-screen">
    <section className="er-option-group er-option-texts"><h2>Texts</h2><div className="er-option-columns"><div className="er-option-labels"><span>• Hours/timesheet texts from dropdown lists</span><label>• Hours/timesheet autotext<input type="checkbox" checked={checks.autoText} onChange={() => toggle("autoText")} /></label><span>• Timesheet hyperlink color autotext</span></div><p>If this is NOT checkmarked, then the employee will never receive hours/timesheet-related texts for jobs.</p></div><p className="er-option-explanation">These are the texts normally sent when:<br />1) The Send Hours/Timesheet Text button is used on the Tracking screen (on the Employees tab).<br />2) The Hrs AutoText button is used on the Tracking screen.<br />3) One of the hyperlink color buttons is used on the Tracking screen (next to the Browse button).<br />4) The Send as Text button is used on the T Sheets Linked screen after an Hours/Timesheet selection is made.</p></section>
    <section className="er-option-group"><h2>Tracking</h2><div className="er-option-columns er-option-tracking"><label>Exclude Sick Time<input type="checkbox" checked={checks.excludeSick} onChange={() => toggle("excludeSick")} /></label><p>When Tracking calculations occur, ignore Sick Time.</p><label>Exclude Workers Comp<input type="checkbox" checked={checks.excludeWorkersComp} onChange={() => toggle("excludeWorkersComp")} /></label><p>In assignments or Tracking refreshes, set WccCode and WccTracking to 1. This excludes Workers Comp as a factor in the Tracking calculations.</p></div></section>
    <section className="er-option-group"><h2>Reports</h2><div className="er-option-columns"><label>Exclude From Reports<input type="checkbox" checked={checks.excludeReports} onChange={() => toggle("excludeReports")} /></label><p>Exclude this employee from the Accounting Reports (Total Payroll Report Search, WCC / Sales Report, etc.).</p></div></section>
    <section className="er-option-group"><h2>Employee Screens</h2><div className="er-option-columns"><label>Admin-Only Record<input type="checkbox" checked={checks.adminOnly} onChange={() => toggle("adminOnly")} /></label><p>Only show this employee if the user has permissions to include Admin-Only Records. Currently, this applies to:<br />• Employee Search 3 screen<br />• All Contacts Search screen<br />• Tracking screen<br />• New Assignment screen</p></div></section>
  </div>;
}
