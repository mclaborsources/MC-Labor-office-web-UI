import assert from "node:assert/strict";
import test from "node:test";
import { staffInputSchema, staffPasswordSchema, staffMutationSchema } from "./officeStaffEditing";

const record = { firstName: "Erika", lastName: "Example", initials: "RA2", title: "Research", email: "staff@example.com", active: true, profile: false, canDelete: false, employeeResearch: false, emailOptions: Array(8).fill(false) };

test("staff updates reject invalid IDs, oversized Access fields, and incomplete flags", () => {
  assert.equal(staffInputSchema.parse({ ...record, staffId: "12" }).staffId, "12");
  for (const staffId of ["0", "-1", "1;DELETE", "2147483648"]) assert.equal(staffInputSchema.safeParse({ ...record, staffId }).success, false);
  assert.equal(staffInputSchema.safeParse({ ...record, firstName: "A".repeat(21) }).success, false);
  assert.equal(staffInputSchema.safeParse({ ...record, initials: "ABCDE" }).success, false);
  assert.equal(staffInputSchema.safeParse({ ...record, emailOptions: [true] }).success, false);
  assert.equal(staffInputSchema.safeParse({ ...record, email: "invalid" }).success, false);
  assert.equal(staffInputSchema.safeParse({ ...record, canDelete: "true" }).success, false);
});

test("ordinary staff saves cannot set a password through extra input fields", () => {
  const parsed = staffInputSchema.parse({ ...record, OfficeStaffPassword: "secret", password: "secret", unexpected: true });
  assert.equal("password" in parsed, false);
  assert.equal("OfficeStaffPassword" in parsed, false);
});

test("password reset respects Access length and case-insensitive confirmation", () => {
  assert.equal(staffPasswordSchema.safeParse({ password: "Example123", confirmation: "example123" }).success, true);
  assert.equal(staffPasswordSchema.safeParse({ password: "a".repeat(21), confirmation: "a".repeat(21) }).success, false);
  assert.equal(staffPasswordSchema.safeParse({ password: " ", confirmation: " " }).success, false);
  assert.equal(staffPasswordSchema.safeParse({ password: "Example", confirmation: "Different" }).success, false);
});

test("permission notes require an original value and respect the Access field size", () => {
  const request = { action: "permissions", id: 12, changes: [], notes: [{ featureId: 299, value: "Updated", original: "Previous" }] };
  assert.equal(staffMutationSchema.safeParse(request).success, true);
  assert.equal(staffMutationSchema.safeParse({ ...request, notes: [{ featureId: 299, value: "Updated" }] }).success, false);
  assert.equal(staffMutationSchema.safeParse({ ...request, notes: [{ featureId: 299, value: "x".repeat(256), original: "" }] }).success, false);
});

test("initial passwords are accepted only on new staff records", () => {
  const request = { action: "save", record, initialPassword: "Example123" };
  assert.equal(staffMutationSchema.safeParse(request).success, true);
  assert.equal(staffMutationSchema.safeParse({ ...request, record: { ...record, staffId: "12" } }).success, false);
  assert.equal(staffMutationSchema.safeParse({ ...request, initialPassword: " " }).success, false);
  assert.equal(staffMutationSchema.safeParse({ ...request, initialPassword: "x".repeat(21) }).success, false);
});
