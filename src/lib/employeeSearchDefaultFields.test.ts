import assert from "node:assert/strict";
import test from "node:test";
import { formatEmployeeDefaultFields } from "./employeeSearchDefaultFields";
import { EMPLOYEE_SEARCH_DEFAULT_COLUMNS } from "./employeeSearchColumns";

test("default columns retain the Access screenshot order including payroll and application status", () => {
  assert.deepEqual(EMPLOYEE_SEARCH_DEFAULT_COLUMNS.map(column => column.key), [
    "ActionSelect", "PayrollCoOnSiteInitials_IPG", "JobApplicationStatus_IPG", "EmployeeUserFlag5",
    "OnlineJobAppFolder", "S1", "EmEmployeeStatus", "EmployeeProfileType", "EmFirstName", "EmMiddle",
    "EmLastName", "EmStreet", "EmCity", "EmState", "EmployeeNoCommunicationText", "EmMobilePhone",
    "EmMobilePhoneVerifyText", "EmGrade", "EmHowReferred", "EmTrade", "EmQualification", "AvgHrsWorked",
    "FirstDateOnJob", "TotalHoursWorked", "LicenseExpDateFlag", "WeekEndingDate", "PayRate", "EmployeeID",
  ]);
});

test("display formatting preserves blanks and zero pay while formatting hours and money", () => {
  assert.deepEqual(formatEmployeeDefaultFields({ EmployeeID: 42, FirstDateOnJob: "08/15/2026",
    TotalHoursWorked: 4138.75, AvgHrsWorked: 36.2, PayRate: 0, LicenseExpDateFlag: null,
    S1: undefined, EmployeeNoCommunicationText: "X", EmQualification: " Licensed " }), {
    EmployeeID: "42", FirstDateOnJob: "08/15/2026", TotalHoursWorked: "4,138.75",
    AvgHrsWorked: "36.20", PayRate: "0.00", LicenseExpDateFlag: "", S1: "",
    EmployeeNoCommunicationText: "X", EmQualification: "Licensed",
  });
});
