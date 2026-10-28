import { z } from "zod";
import { EMPLOYEE_SEARCH_COLUMNS, EMPLOYEE_SEARCH_PRESET_GRID, EMPLOYEE_SEARCH_VIEWS_2_GRID, type EmployeeSearchColumnKey } from "./employeeSearchColumns";

const keys = new Set<string>(EMPLOYEE_SEARCH_COLUMNS.map(column => column.key));
const columnKey = z.custom<EmployeeSearchColumnKey>(value => typeof value === "string" && keys.has(value));

export const employeeViewLayoutSchema = z.object({
  order: z.array(columnKey).max(keys.size).refine(order => order.length === keys.size && new Set(order).size === keys.size, "Every employee column must appear once."),
  hidden: z.array(columnKey).max(keys.size - 1),
  widths: z.record(columnKey, z.number().int().min(48).max(1600)),
  filters: z.record(columnKey, z.array(z.string().max(5000)).max(20000)),
  sort: z.object({ key: columnKey, direction: z.enum(["asc", "desc"]) }).nullable(),
});
export type EmployeeViewLayout = z.infer<typeof employeeViewLayoutSchema>;

export const employeeSavedViewSchema = z.object({
  slot: z.number().int().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  layout: employeeViewLayoutSchema,
});
export type EmployeeSavedView = z.infer<typeof employeeSavedViewSchema>;

export const employeeSearchPresetSchema = z.object({
  slot: z.number().int().min(1).max(60),
  name: z.string().trim().min(1).max(80),
  layout: employeeViewLayoutSchema,
});
export type EmployeeSearchPreset = z.infer<typeof employeeSearchPresetSchema>;

export function defaultEmployeeViewLayout(): EmployeeViewLayout {
  return {
    order: EMPLOYEE_SEARCH_COLUMNS.map(column => column.key),
    hidden: [],
    widths: {},
    filters: {},
    sort: null,
  };
}

/** Columns checked in the Employee Search 3 Default preset shown in the reference screenshots. */
const EMPLOYEE_SEARCH_DEFAULT_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmployeeUserFlag5",
  "OnlineJobAppFolder",
  "S1",
  "EmEmployeeStatus",
  "EmployeeProfileType",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "PayRate",
  "SiteName",
  "WeeksAway",
  "CustomerBusName",
  "EmHomePhone",
  "EmEmail2",
  "EmEmail3",
  "EmEmail4",
  "EmEmail5",
  "EmEmail6",
  "SchoolCompleted",
  "IDTitleDriversLicense",
  "IDTitleDriversLicenseOnFile",
  "Vonage",
];

export function employeeSearchDefaultPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_DEFAULT_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_QUALIFICATIONS_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmployeeUserFlag5",
  "OnlineJobAppFolder",
  "S1",
  "EmEmployeeStatus",
  "EmployeeProfileType",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "PayRate",
  "EmployeeNotesHistory",
  "SiteName",
  "WeeksAway",
  "CustomerBusName",
  "EmHomePhone",
  "EmEmail2",
  "EmEmail3",
  "EmEmail4",
  "EmEmail5",
  "EmEmail6",
  "SchoolCompleted",
  "IDTitleDriversLicense",
  "IDTitleDriversLicenseOnFile",
  "Vonage",
];

export function employeeSearchQualificationsPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_QUALIFICATIONS_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_SUB_TRADES_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "SubTrade1",
  "SubTrade2",
  "SubTrade3",
  "SubTrade4",
  "EmHomePhone",
];

export function employeeSearchSubTradesPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_SUB_TRADES_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_AGE_LICENSE_LEVEL_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "LicenseAge",
  "LicenseIssueDate",
  "LicenseNumber",
  "CTLevel",
  "EmHomePhone",
];

export function employeeSearchAgeLicenseLevelPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_AGE_LICENSE_LEVEL_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_CAR_RTS_RIP_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "Car",
  "EmployeeReturnToSender",
  "EmployeeRIP",
  "EmHomePhone",
];

export function employeeSearchCarRtsRipPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_CAR_RTS_RIP_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_EMAIL_TEXT_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmEmail",
  "TextMsgAddress",
];

export function employeeSearchEmailTextPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_EMAIL_TEXT_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_LAST_ACTION_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeContactHistoryUserName",
  "EmHomePhone",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "NumActionsCustomText",
  "NumActionsCustomPostcard",
  "InterviewNumber",
];

export function employeeSearchLastActionPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_LAST_ACTION_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_CALL_HISTORY_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumberIDTime",
  "CallNumber",
  "LastCallNote",
  "CallNumberHistory",
  "NumActionsCustomText",
  "EmHomePhone",
  "NumActionsCustomPostcard",
];

export function employeeSearchCallHistoryPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_CALL_HISTORY_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_FUTURE_CALL_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeFutureCall",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCallUserDate",
  "NumActionsCustomText",
  "NumActionsCustomPostcard",
];

export function employeeSearchFutureCallPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_FUTURE_CALL_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_LA_CH_FC_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDDate_IPG",
  "WhereEmployeeFound",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmLastName",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "CallNumberHistory",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "EmployeeFutureCall",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCallUserDate",
  "NumActionsCustomPostcard",
];

export function employeeSearchLaChFcPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_LA_CH_FC_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_AVAILABLE_MAN_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDUserName_IPG",
  "JobApplicationStatusIDDate_IPG",
  "EmFirstName",
  "EmLastName",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "EmployeeContactHistoryNote",
  "CallNumberHistory",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "PostEmployeeAsAvailableUserName",
  "EmployeeUserFlag1",
  "PostEmployeeAsAvailableDate",
  "PostEmployeeAsAvailableText",
  "PostEmployeeAsAvailableNotesHistory",
  "EmHomePhone",
];

export function employeeSearchAvailableManPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_AVAILABLE_MAN_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_UI_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeOnUnemploymentText",
  "EmployeeOnUnemploymentUserName",
  "EmployeeOnUnemploymentDate",
  "EmployeeOnUnemploymentNotesHistory",
  "EmHomePhone",
];

export function employeeSearchUiPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_UI_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_REF_BY_BUS_NAME_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmReferredBy",
  "BusinessName",
  "EmHomePhone",
];

export function employeeSearchRefByBusNamePresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_REF_BY_BUS_NAME_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_CUSTOMER_JOB_INFO_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "WeeksAway",
  "CustomerBusName",
  "SiteName",
  "SiteState",
  "EmHomePhone",
];

export function employeeSearchCustomerJobInfoPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_CUSTOMER_JOB_INFO_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_TIMESHEET_REQUEST_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeTimesheetRequestText",
  "EmHomePhone",
  "EmployeeTimesheetRequestUserName",
  "EmployeeTimesheetRequestDate",
  "EmployeeTimesheetRequestHistory",
];

export function employeeSearchTimesheetRequestPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_TIMESHEET_REQUEST_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_RESUME_NUMBER_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmHomePhone",
  "HLinkResume",
  "Resume",
  "ResumeNumberIDUserName",
  "ResumeNumberIDDate",
  "ResumeNumber",
  "JobAppAuditNotes",
];

export function employeeSearchResumeNumberPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_RESUME_NUMBER_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_RESUME_NUMBER_FOCUSED_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmLastName",
  "EmployeeUserFlag7",
  "HLinkResume",
  "Resume",
  "ResumeNumberIDUserName",
  "ResumeNumberIDDate",
  "ResumeNumber",
];

export function employeeSearchResumeNumberFocusedPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_RESUME_NUMBER_FOCUSED_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

export function employeeSearchBlankPresetLayout(): EmployeeViewLayout {
  const base = defaultEmployeeViewLayout();
  const visible = new Set<EmployeeSearchColumnKey>(["EmHomePhone"]);
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_FIRST_CALL_NUMBER_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmHomePhone",
  "EmployeeFirstCallNumberIDUserName",
  "EmployeeFirstCallNumberIDDate",
  "EmployeeFirstCallNumber",
  "JobAppAuditNotes",
];

export function employeeSearchFirstCallNumberPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_FIRST_CALL_NUMBER_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_INTERVIEW_DATE_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "InterviewedByDate",
  "JobAppAuditNotes",
  "EmHomePhone",
];

export function employeeSearchInterviewDatePresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_INTERVIEW_DATE_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_MAKE_CALL_LIST_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryDate",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmTrade",
  "EmQualification",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "AvgHrsWorked",
  "WeekEndingDate",
  "EmHowReferred",
  "ResumeNumber",
  "CallNumberHistory",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "InterviewNumber",
  "EmployeeUserFlag7",
  "TruePeopleMatchIDUserName",
  "TruePeopleMatchIDDate",
  "TruePeopleMatch",
  "InterviewedByDate",
];

export function employeeSearchMakeCallListPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_MAKE_CALL_LIST_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_IP_VAX_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "Covid19VaccinationStatus",
  "Covid19VaccinationStatusIDUserName",
  "Covid19VaccinationStatusIDDate",
  "Covid19VaccinationStatusHistory",
  "InterviewNumber",
];

export function employeeSearchIpVaxPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_IP_VAX_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_RECRUITER_M_SCREEN_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmHowReferred",
  "EmReferredBy",
  "LicenseAge",
  "EmTrade",
  "EmQualification",
  "PayRate",
  "TotalHoursWorked",
  "EmExperience",
  "YearsInTrade",
  "EmLicensedIn",
  "LicenseNumber",
  "EmployeeNotesHistory",
  "FirstDateOnJob",
  "AvgHrsWorked",
  "WeekEndingDate",
  "Spare1",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryActionType",
  "EmployeeContactHistoryDate",
  "CallNumberHistory",
  "CallNumberNoteCount",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "ResumeNumber",
  "InterviewNumber",
  "HLinkResume",
  "Resume",
  "EmployeeProfileType",
  "InterviewedByDate",
  "JobAppAuditNotes",
  "InterviewedBy",
  "Snapshot",
  "HasEmergencyContact",
  "IDTitleDriversLicense",
  "IDTitleDriversLicenseOnFile",
  "EmployeeOnUnemploymentUserName",
  "EmployeeOnUnemploymentDate",
  "EmployeeOnUnemploymentText",
  "EmployeeOnUnemploymentNotesHistory",
  "PostEmployeeAsAvailableUserName",
  "EmployeeUserFlag1",
  "PostEmployeeAsAvailableDate",
  "PostEmployeeAsAvailableText",
  "PostEmployeeAsAvailableNotesHistory",
  "Spare2",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCallUserDate",
  "EmployeeFutureCall",
  "TruePeopleMatch",
  "TruePeopleMatchIDUserName",
  "TruePeopleMatchIDDate",
  "EmEmail",
  "TextMsgAddress",
  "CustomerBusName",
  "SiteName",
  "EmployeeUserFlag7",
  "EmHomePhone",
];

export function employeeSearchRecruiterMScreenPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_RECRUITER_M_SCREEN_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_CALL_LIST_TEMPLATE_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDUserName_IPG",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmZip",
  "EmState",
  "LicenseAge",
  "EmployeeNoCommunicationText",
  "EmHomePhone",
  "EmEmail",
  "EmMobilePhone",
  "EmTrade",
  "EmLicensedIn",
  "EmQualification",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "AvgHrsWorked",
  "WeekEndingDate",
  "EmReferredBy",
  "EmHowReferred",
  "ResumeNumber",
  "Spare1",
  "EmployeeFirstCallNumber",
  "CallNumberHistory",
  "CallNumberNoteCount",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "CallNumberIDTime",
  "TruePeopleMatchIDUserName",
  "TruePeopleMatchIDDate",
  "TruePeopleMatch",
  "Spare2",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "EmployeeContactHistoryNote",
  "EmployeeUserFlag1",
  "EmployeeUserFlag2",
  "EmployeeUserFlag3",
  "EmployeeUserFlag4",
  "EmployeeUserFlag5",
  "EmployeeUserFlag6",
  "EmployeeUserFlag7",
  "EmployeeUserFlag8",
  "Spare3",
];

export function employeeSearchCallListTemplatePresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_CALL_LIST_TEMPLATE_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_EXPERIENCE_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEntryDate",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmCity",
  "EmState",
  "EmMobilePhone",
  "EmGrade",
  "EmHomePhone",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "WeekEndingDate",
  "WeeksAway",
  "CustomerBusName",
];

export function employeeSearchExperiencePresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_EXPERIENCE_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_REMOVE_IDS_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDUserName_IPG",
  "JobApplicationStatusIDDate_IPG",
  "EmployeeUserFlag5",
  "OnlineJobAppFolder",
  "S1",
  "S1IDUserName",
  "S1IDDate",
  "S1History",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "WeekEndingDate",
  "EmployeeUserFlag2",
];

export function employeeSearchRemoveIdsPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_REMOVE_IDS_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_GET_HIRED_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDUserName_IPG",
  "JobApplicationStatusIDDate_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "WeeksAway",
  "CustomerBusName",
  "Spare1",
  "EmployeeProfileType",
  "PhoneNeedsValidation",
];

export function employeeSearchGetHiredPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_GET_HIRED_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_RESEARCH_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "EmployeeProfileType",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmMobilePhone",
  "EmMobilePhone2",
  "EmMobilePhone3",
  "EmMobilePhone4",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmZip",
  "EmTrade",
  "EmQualification",
  "EmHowReferred",
  "WeekEndingDate",
  "LicenseAge",
  "LicenseIssueDate",
  "TruePeopleMatchIDUserName",
  "TruePeopleMatch",
  "TruePeopleMatchIDDate",
];

export function employeeSearchResearchPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_RESEARCH_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_TEST_2_SCREEN_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEmployeeStatus",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmStreet",
  "EmCity",
  "EmState",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmMobilePhoneVerifyText",
  "EmGrade",
  "EmHowReferred",
  "EmTrade",
  "EmQualification",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmExperience",
  "YearsInTrade",
  "Car",
  "OSHA10Status",
  "EmReferredBy",
  "Spare1",
  "NumActionsCustomPostcard",
  "NumActionsCustomText",
  "EmployeeReturnToSender",
  "EmployeeRIP",
  "LicenseAge",
  "LicenseIssueDate",
  "LicenseIssueDateYear",
  "LicenseNumber",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "CallNumberHistory",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCallUserDate",
  "EmployeeFutureCall",
  "PostEmployeeAsAvailableUserName",
  "PostEmployeeAsAvailableDate",
  "PostEmployeeAsAvailableText",
  "PostEmployeeAsAvailableNotesHistory",
];

export function employeeSearchTest2ScreenPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_TEST_2_SCREEN_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_EE_SEARCH_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "S1",
  "EmployeeProfileType",
  "EmFirstName",
  "EmLastName",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmCity",
  "EmState",
  "EmTrade",
  "EmQualification",
  "FirstDateOnJob",
  "WeekEndingDate",
  "TotalHoursWorked",
  "AvgHrsWorked",
  "CallNumberHistory",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "ResumeNumber",
  "InterviewedByDate",
  "JobAppAuditNotes",
  "InterviewNumber",
  "EmployeeUserFlag7",
];

export function employeeSearchEeSearchPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_EE_SEARCH_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

export function employeeSearchPresetLayoutForName(name: string): EmployeeViewLayout {
  switch (name) {
    case "Default": return employeeSearchDefaultPresetLayout();
    case "Qualifications": return employeeSearchQualificationsPresetLayout();
    case "Sub Trades": return employeeSearchSubTradesPresetLayout();
    case "Age, Lic #, Level": return employeeSearchAgeLicenseLevelPresetLayout();
    case "Car, RTS, RIP": return employeeSearchCarRtsRipPresetLayout();
    case "Email / Text": return employeeSearchEmailTextPresetLayout();
    case "Last Action": return employeeSearchLastActionPresetLayout();
    case "Call History": return employeeSearchCallHistoryPresetLayout();
    case "Future Call": return employeeSearchFutureCallPresetLayout();
    case "LA - CH - FC": return employeeSearchLaChFcPresetLayout();
    case "Available Man": return employeeSearchAvailableManPresetLayout();
    case "UI": return employeeSearchUiPresetLayout();
    case "Ref By / Bus Name": return employeeSearchRefByBusNamePresetLayout();
    case "Customer / Job Info": return employeeSearchCustomerJobInfoPresetLayout();
    case "Time Sheet Req": return employeeSearchTimesheetRequestPresetLayout();
    case "Resume #": return employeeSearchResumeNumberPresetLayout();
    case "RESUME #": return employeeSearchResumeNumberFocusedPresetLayout();
    case "1st Call #": return employeeSearchFirstCallNumberPresetLayout();
    case "Blank": return employeeSearchBlankPresetLayout();
    case "Interview Date": return employeeSearchInterviewDatePresetLayout();
    case "Make Call List": return employeeSearchMakeCallListPresetLayout();
    case "I-P [Vax]": return employeeSearchIpVaxPresetLayout();
    case "Recruiter. M Screen": return employeeSearchRecruiterMScreenPresetLayout();
    case "Call List Template": return employeeSearchCallListTemplatePresetLayout();
    case "Experience": return employeeSearchExperiencePresetLayout();
    case "Remove ID's": return employeeSearchRemoveIdsPresetLayout();
    case "Get-Hired": return employeeSearchGetHiredPresetLayout();
    case "Research": return employeeSearchResearchPresetLayout();
    case "TEST 2 Screen": return employeeSearchTest2ScreenPresetLayout();
    case "EE SEARCH": return employeeSearchEeSearchPresetLayout();
    default: return defaultEmployeeViewLayout();
  }
}

export function employeeSearchPresetSeeds(): EmployeeSearchPreset[] {
  return [
    ...EMPLOYEE_SEARCH_PRESET_GRID.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => {
      const slot = rowIndex * 10 + colIndex + 1;
      if (cell) return [{ slot, name: cell.label, layout: employeeSearchPresetLayoutForName(cell.label) }];
      return slot === 19 ? [{ slot, name: "Blank", layout: employeeSearchBlankPresetLayout() }] : [];
    })),
    ...EMPLOYEE_SEARCH_VIEWS_2_GRID.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => cell ? [{
      slot: 30 + rowIndex * 10 + colIndex + 1,
      name: cell.label,
      layout: employeeSearchPresetLayoutForName(cell.label),
    }] : [])),
  ];
}

export function normalizeEmployeeSavedView(value: unknown): EmployeeSavedView {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return employeeSavedViewSchema.parse({
    ...raw,
    layout: raw.layout && typeof raw.layout === "object" ? raw.layout : defaultEmployeeViewLayout(),
  });
}
