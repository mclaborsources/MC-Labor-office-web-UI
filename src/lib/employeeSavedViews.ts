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

/** Checked columns from the Views 2 Default preset's Unhide Columns dialog. */
const EMPLOYEE_SEARCH_VIEWS_2_DEFAULT_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
];

export function employeeSearchViews2DefaultPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_DEFAULT_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Qualifications preset reference. */
const EMPLOYEE_SEARCH_VIEWS_2_QUALIFICATIONS_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "EmExperience",
  "YearsInTrade",
  "EmLicensedIn",
  "OSHA10Status",
  "EmHomePhone",
];

export function employeeSearchViews2QualificationsPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_QUALIFICATIONS_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Sub Trades preset reference. */
const EMPLOYEE_SEARCH_VIEWS_2_SUB_TRADES_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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

export function employeeSearchViews2SubTradesPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_SUB_TRADES_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Age, Lic #, Level preset reference. */
const EMPLOYEE_SEARCH_VIEWS_2_AGE_LICENSE_LEVEL_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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

export function employeeSearchViews2AgeLicenseLevelPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_AGE_LICENSE_LEVEL_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Car, RTS, RIP preset reference. */
const EMPLOYEE_SEARCH_VIEWS_2_CAR_RTS_RIP_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "Car",
  "EmployeeReturnToSender",
  "EmployeeRIP",
  "EmHomePhone",
];

export function employeeSearchViews2CarRtsRipPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_CAR_RTS_RIP_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Visible columns from the Views 2 Resume # preset grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_RESUME_NUMBER_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEntryDate",
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
  "ResumeNumber",
];

export function employeeSearchViews2ResumeNumberPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_RESUME_NUMBER_PRESET_KEYS);
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

/** Focused presets added on the Employee Search Views 2 tab. */
const EMPLOYEE_SEARCH_EMERGENCY_NUMBER_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEntryDate",
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
  "HasEmergencyContact",
];

export function employeeSearchEmergencyNumberPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_EMERGENCY_NUMBER_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

const EMPLOYEE_SEARCH_ID_DRIVER_LICENSE_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmEntryDate",
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
  "IDTitleDriversLicense",
  "IDTitleDriversLicenseOnFile",
];

export function employeeSearchIdDriverLicensePresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_ID_DRIVER_LICENSE_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Email / Text preset reference. */
const EMPLOYEE_SEARCH_VIEWS_2_EMAIL_TEXT_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "EmHomePhone",
];

export function employeeSearchViews2EmailTextPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_EMAIL_TEXT_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Call History preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_CALL_HISTORY_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "CallNumberHistory",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "NumActionsCustomText",
  "EmHomePhone",
  "NumActionsCustomPostcard",
  "LastCallUserName",
  "LastCallDate",
  "InterviewNumber",
];

export function employeeSearchViews2CallHistoryPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_CALL_HISTORY_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Future Call preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_FUTURE_CALL_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "EmployeeFutureCall",
  "NumActionsCustomText",
  "NumActionsCustomPostcard",
];

export function employeeSearchViews2FutureCallPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_FUTURE_CALL_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Customer / Job Info preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_CUSTOMER_JOB_INFO_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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

export function employeeSearchViews2CustomerJobInfoPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_CUSTOMER_JOB_INFO_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Time Sheet Req preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_TIMESHEET_REQUEST_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "EmHomePhone",
  "EmployeeTimesheetRequestText",
  "EmployeeTimesheetRequestUserName",
  "EmployeeTimesheetRequestDate",
  "EmployeeTimesheetRequestHistory",
];

export function employeeSearchViews2TimesheetRequestPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_TIMESHEET_REQUEST_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 Available Man preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_AVAILABLE_MAN_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDUserName_IPG",
  "JobApplicationStatusIDDate_IPG",
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
  "PostEmployeeAsAvailableUserName",
  "EmployeeUserFlag1",
  "PostEmployeeAsAvailableDate",
  "PostEmployeeAsAvailableText",
  "PostEmployeeAsAvailableNotesHistory",
  "EmHomePhone",
];

export function employeeSearchViews2AvailableManPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_AVAILABLE_MAN_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 UI preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_UI_PRESET_KEYS: EmployeeSearchColumnKey[] = [
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
  "EmployeeOnUnemploymentUserName",
  "EmployeeOnUnemploymentDate",
  "EmployeeOnUnemploymentText",
  "EmployeeOnUnemploymentNotesHistory",
  "EmHomePhone",
];

export function employeeSearchViews2UiPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_UI_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Checked columns from the Views 2 EE SEARCH preset references. */
const EMPLOYEE_SEARCH_VIEWS_2_EE_SEARCH_PRESET_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmLastName",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmCity",
  "EmState",
  "EmTrade",
  "FirstDateOnJob",
  "WeekEndingDate",
  "S1",
  "EmployeeProfileType",
  "CallNumberIDUserName",
  "CallNumberIDDate",
  "CallNumber",
  "JobAppAuditNotes",
  "InterviewNumber",
  "EmployeeUserFlag7",
];

export function employeeSearchViews2EeSearchPresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_EE_SEARCH_PRESET_KEYS);
  const base = defaultEmployeeViewLayout();
  return { ...base, hidden: base.order.filter(key => !visible.has(key)) };
}

/** Visible columns and order from the Views 2 View 40 grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_40_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "JobApplicationStatusIDUserName_IPG",
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
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "EmployeeContactHistoryNote",
  "EmployeeDuplicate",
  "Car",
  "CallNumberHistory",
  "CallNumberIDUserName",
  "CallNumber",
  "CallNumberIDDate",
  "CallNumberIDTime",
  "LastCallUserName",
  "LastCallDate",
  "LastCallNote",
  "EmployeeFutureCallUserDate",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCall",
];

export function employeeSearchViews2View40PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_40_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_40_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns from the Views 2 View 45 grid references. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_45_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
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
  "Car",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "CallNumberHistory",
  "NumActionsCustomText",
  "NumActionsCustomPostcard",
  "EmHomePhone",
  "LastCallUserName",
  "LastCallDate",
  "InterviewNumber",
];

export function employeeSearchViews2View45PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_45_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_45_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 46 grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_46_KEYS: EmployeeSearchColumnKey[] = [
  "AvgHrsWorked",
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCallUserDate",
  "EmHomePhone",
  "EmployeeFutureCall",
  "NumActionsCustomText",
  "NumActionsCustomPostcard",
];

export function employeeSearchViews2View46PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_46_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_46_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 47 grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_47_KEYS: EmployeeSearchColumnKey[] = [
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

export function employeeSearchViews2View47PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_47_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_47_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 48 grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_48_KEYS: EmployeeSearchColumnKey[] = [
  "FirstDateOnJob",
  "TotalHoursWorked",
  "LicenseExpDateFlag",
  "WeekEndingDate",
  "EmployeeNotesHistory",
  "EmHomePhone",
  "EmployeeTimesheetRequestText",
  "EmployeeTimesheetRequestUserName",
  "EmployeeTimesheetRequestDate",
  "EmployeeTimesheetRequestHistory",
];

export function employeeSearchViews2View48PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_48_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_48_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 49 grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_49_KEYS: EmployeeSearchColumnKey[] = [
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
];

export function employeeSearchViews2View49PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_49_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_49_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Blank grid from the Views 2 View 50 reference: only empty spacer columns show. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_50_KEYS: EmployeeSearchColumnKey[] = [
  "Spare1", "Spare2", "Spare3", "Spare4", "Spare5", "Spare6", "Spare7",
];

export function employeeSearchViews2View50PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_50_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_50_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
    widths: { ...base.widths, ...Object.fromEntries(EMPLOYEE_SEARCH_VIEWS_2_VIEW_50_KEYS.map(key => [key, 96])) },
  };
}

/** Visible columns and order from the Views 2 View 55 grid reference. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_55_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmployeeProfileType",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmTrade",
  "WeekEndingDate",
  "Car",
  "CallNumberIDDate",
  "CallNumber",
  "InterviewedByDate",
  "JobAppAuditNotes",
  "ResumeNumber",
  "InterviewNumberID",
  "InterviewedByIDUserName",
  "InterviewedBy",
  "InterviewedByLocation",
  "InterviewNumber",
  "EmployeeUserFlag7",
];

export function employeeSearchViews2View55PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_55_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_55_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 56 grid references. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_56_KEYS: EmployeeSearchColumnKey[] = [
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
  "EmLicensedIn",
  "OSHA10Status",
  "InterviewNumber",
];

export function employeeSearchViews2View56PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_56_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_56_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 58 grid references. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_58_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "S1",
  "EmployeeProfileType",
  "EmFirstName",
  "EmMiddle",
  "EmLastName",
  "EmMobilePhone",
  "EmCity",
  "EmState",
  "EmTrade",
  "FirstDateOnJob",
  "WeekEndingDate",
  "Car",
  "CallNumberIDDate",
  "CallNumber",
  "TotalHoursWorked",
  "AvgHrsWorked",
  "ResumeNumber",
  "InterviewedByDate",
  "JobAppAuditNotes",
  "InterviewNumber",
  "EmployeeUserFlag7",
];

export function employeeSearchViews2View58PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_58_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_58_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 59 grid references. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_59_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
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
  "EmExperience",
  "YearsInTrade",
  "Car",
  "OSHA10Status",
  "EmReferredBy",
  "Spare10",
  "NumActionsCustomPostcard",
  "NumActionsCustomText",
  "EmployeeReturnToSender",
  "EmployeeRIP",
  "LicenseAge",
  "LicenseIssueDate",
  "LicenseIssueDateYear",
  "LicenseNumber",
  "LicenseIssueDateUserName",
  "EmployeeContactHistoryUserName",
  "EmployeeContactHistoryDate",
  "EmployeeContactHistoryActionType",
  "LastCallUserName",
  "LastCallDate",
  "CallNumberIDDate",
  "CallNumber",
  "LastCallNote",
  "CallNumberHistory",
  "EmployeeFutureCallUserDate",
  "EmployeeFutureCallUserName",
  "EmployeeFutureCall",
  "PostEmployeeAsAvailableUserName",
  "PostEmployeeAsAvailableDate",
  "PostEmployeeAsAvailableText",
  "PostEmployeeAsAvailableNotesHistory",
  "InterviewNumber",
];

export function employeeSearchViews2View59PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_59_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_59_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
}

/** Visible columns and order from the Views 2 View 60 grid references. */
const EMPLOYEE_SEARCH_VIEWS_2_VIEW_60_KEYS: EmployeeSearchColumnKey[] = [
  "ActionSelect",
  "EmEntryUserName",
  "EmEntryDate",
  "PayrollCoOnSiteInitials_IPG",
  "JobApplicationStatus_IPG",
  "EmFirstName",
  "EmLastName",
  "EmCity",
  "EmState",
  "EmTrade",
  "WeekEndingDate",
  "EmployeeNoCommunicationText",
  "EmMobilePhone",
  "EmployeeNoCommUserName",
  "EmployeeNoCommDate",
  "EmployeeNoCommText",
  "EmMobilePhone2",
  "EmployeeNoCommUserName2",
  "EmployeeNoCommDate2",
  "EmployeeNoComm2Text",
  "EmMobilePhone3",
  "EmployeeNoCommUserName3",
  "EmployeeNoCommDate3",
  "EmployeeNoComm3Text",
  "EmMobilePhone4",
  "EmployeeNoCommUserName4",
  "EmployeeNoCommDate4",
  "EmployeeNoComm4Text",
  "NumActionsCustomText",
  "NumActionsCustomPostcard",
  "InterviewNumber",
];

export function employeeSearchViews2View60PresetLayout(): EmployeeViewLayout {
  const visible = new Set<EmployeeSearchColumnKey>(EMPLOYEE_SEARCH_VIEWS_2_VIEW_60_KEYS);
  const base = defaultEmployeeViewLayout();
  return {
    ...base,
    order: [...EMPLOYEE_SEARCH_VIEWS_2_VIEW_60_KEYS, ...base.order.filter(key => !visible.has(key))],
    hidden: base.order.filter(key => !visible.has(key)),
  };
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
    case "Emergency #": return employeeSearchEmergencyNumberPresetLayout();
    case "ID - Driver Lic": return employeeSearchIdDriverLicensePresetLayout();
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

/** Resolve layouts by slot where Views 1 and Views 2 use the same button name. */
export function employeeSearchPresetLayoutForSlot(slot: number, name: string): EmployeeViewLayout {
  if (slot === 40) return employeeSearchViews2View40PresetLayout();
  if (slot === 45) return employeeSearchViews2View45PresetLayout();
  if (slot === 46) return employeeSearchViews2View46PresetLayout();
  if (slot === 47) return employeeSearchViews2View47PresetLayout();
  if (slot === 48) return employeeSearchViews2View48PresetLayout();
  if (slot === 49) return employeeSearchViews2View49PresetLayout();
  if (slot === 50) return employeeSearchViews2View50PresetLayout();
  if (slot === 53) return employeeSearchViews2View50PresetLayout();
  if (slot === 55) return employeeSearchViews2View55PresetLayout();
  if (slot === 56) return employeeSearchViews2View56PresetLayout();
  if (slot === 57) return employeeSearchViews2View55PresetLayout();
  if (slot === 58) return employeeSearchViews2View58PresetLayout();
  if (slot === 59) return employeeSearchViews2View59PresetLayout();
  if (slot === 60) return employeeSearchViews2View60PresetLayout();
  if (slot === 31) return employeeSearchViews2DefaultPresetLayout();
  if (slot === 32) return employeeSearchViews2QualificationsPresetLayout();
  if (slot === 33) return employeeSearchViews2SubTradesPresetLayout();
  if (slot === 34) return employeeSearchViews2AgeLicenseLevelPresetLayout();
  if (slot === 35) return employeeSearchViews2CarRtsRipPresetLayout();
  if (slot === 36) return employeeSearchViews2ResumeNumberPresetLayout();
  if (slot === 37) return employeeSearchEmergencyNumberPresetLayout();
  if (slot === 38) return employeeSearchIdDriverLicensePresetLayout();
  if (slot === 39) return employeeSearchViews2EmailTextPresetLayout();
  if (slot === 41) return employeeSearchViews2CallHistoryPresetLayout();
  if (slot === 42) return employeeSearchViews2FutureCallPresetLayout();
  if (slot === 43) return employeeSearchViews2CustomerJobInfoPresetLayout();
  if (slot === 44) return employeeSearchViews2TimesheetRequestPresetLayout();
  if (slot === 51) return employeeSearchViews2AvailableManPresetLayout();
  if (slot === 52) return employeeSearchViews2UiPresetLayout();
  if (slot === 54) return employeeSearchViews2EeSearchPresetLayout();
  return employeeSearchPresetLayoutForName(name);
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
      layout: employeeSearchPresetLayoutForSlot(30 + rowIndex * 10 + colIndex + 1, cell.label),
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
