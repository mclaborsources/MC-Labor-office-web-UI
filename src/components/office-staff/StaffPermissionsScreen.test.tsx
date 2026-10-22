import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { StaffPermissionsScreen } from "./StaffPermissionsScreen";

test("Modify Permissions uses the full-page Access grid and controls", () => {
  const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
  const html = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router }, createElement(StaffPermissionsScreen, { staffId: "12" })));
  assert.match(html, /staff-permissions-screen/);
  assert.doesNotMatch(html, /role="dialog"/);
  for (const heading of ["Feature", "Title", "Description", "My Note", "Level", "Matt", "Ryan", "Sharon", "Joe N"]) assert.ok(html.includes(heading));
  for (const control of ["Find", "Clear Sort", "Clear Filter", "Select all visible features", "Apply profile", "Search features"]) assert.ok(html.includes(control));
});
