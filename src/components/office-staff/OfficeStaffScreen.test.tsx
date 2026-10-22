import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OfficeStaffScreen } from "./OfficeStaffScreen";
import type { OfficeStaffRecord } from "@/lib/admin";

const staff: OfficeStaffRecord[] = [
  { staffId: "1", firstName: "Active", lastName: "Person", initials: "AP", title: "Research", email: "active@example.com", active: true, canDelete: false, profile: true, employeeResearch: false, emailOptions: [true, false, true, false, true, false, true, false] },
  { staffId: "2", firstName: "Inactive", lastName: "Person", initials: "IP", title: "Office", email: "inactive@example.com", active: false, canDelete: false, profile: false, employeeResearch: false, emailOptions: Array(8).fill(false) },
];
const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
function render(initialId?: string) {
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router }, createElement(OfficeStaffScreen, { staff, initialId })));
}

test("Office Staff shows active records and the eight actual email options", () => {
  const html = render();
  assert.match(html, /value="active@example.com"/);
  assert.doesNotMatch(html, /inactive@example.com/);
  assert.match(html, /Email and Report-related Options/);
  assert.equal((html.match(/<select/g) ?? []).length, 12);
  assert.match(html, /1 of 1/);
  assert.match(html, /disabled=""[^>]*>Save/);
});

test("an explicit inactive record opens the inactive list and its details", () => {
  const html = render("2");
  assert.match(html, /value="inactive@example.com"/);
  assert.doesNotMatch(html, /value="active@example.com"/);
});
