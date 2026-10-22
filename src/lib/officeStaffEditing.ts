import { z } from "zod";

export const staffInputSchema = z.object({
  staffId: z.string().regex(/^[1-9]\d*$/).refine(value => Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647, "Invalid staff ID.").optional(),
  firstName: z.string().trim().min(1).max(20),
  lastName: z.string().trim().min(1).max(20),
  initials: z.string().trim().min(1).max(4),
  title: z.string().trim().max(255),
  email: z.union([z.literal(""), z.string().email().max(255)]),
  active: z.boolean(), profile: z.boolean(), canDelete: z.boolean(), employeeResearch: z.boolean(),
  emailOptions: z.array(z.boolean()).length(8),
});

export const staffColumnMap = {
  firstName: "OfficeStaffFirstName", lastName: "OfficeStaffLastName", initials: "Initials",
  title: "OfficeStaffTitle", email: "OfficeStaffEmail", active: "OfficeStaffActive",
  profile: "Profile", canDelete: "OfficeStaffCanDelete", employeeResearch: "OfficeStaffEmployeeResearch",
} as const;
export const staffEmailColumns = ["OfficeStaffEmployeeHealthInsuranceAlarmEmail", "OfficeStaffARReportBCCEmail", "OfficeStaffTrackingReportEmailSend", "OfficeStaffTrackingReportEmailSendLogout", "OfficeStaffTrackingReportEmailReceive", "OfficeStaffSalesmanRecordsCustomersLogout", "OfficeStaffMOReminderEmailSend", "OfficeStaffMOReminderEmailReceive"] as const;

export const staffPasswordSchema = z.object({
  password: z.string().min(1).max(20).refine(value => !!value.trim(), "Enter a password."),
  confirmation: z.string(),
}).refine(value => value.password.toLowerCase() === value.confirmation.toLowerCase(), "Passwords must match.");

const targetId = z.coerce.number().int().positive().max(2147483647);
export const staffMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), record: staffInputSchema, initialPassword: z.string().min(1).max(20).refine(value => !!value.trim(), "Enter a password.").optional() }),
  z.object({ action: z.literal("delete"), id: targetId }),
  z.object({ action: z.literal("password"), id: targetId, password: z.string(), confirmation: z.string() }),
  z.object({ action: z.literal("permissions"), id: targetId, notes: z.array(z.object({ featureId: targetId, value: z.string().max(255), original: z.string().max(255) })).max(5000).optional(), changes: z.array(z.object({ featureId: targetId, enabled: z.boolean(), staffId: targetId.optional() })).max(5000) }),
]).superRefine((value, context) => {
  if (value.action === "save" && value.record.staffId && value.initialPassword !== undefined) context.addIssue({ code: "custom", message: "Use New/Reset to change an existing account password.", path: ["initialPassword"] });
  if (value.action !== "password") return;
  const parsed = staffPasswordSchema.safeParse(value);
  if (!parsed.success) parsed.error.issues.forEach(issue => context.addIssue(issue));
});
