import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessReferenceMenu } from "./AccessReferenceMenu";

test("reference main menu retains all eight policy views, live documents and working navigation", () => {
  const noop = () => {};
  const html = renderToStaticMarkup(createElement(AccessReferenceMenu, {
    activeView: "01", policy: "<p>Current company policy</p>", notes: "<p>Company history from SQL</p>",
    trackingHref: "/tracking?week=42&year=2026", today: "10/21/2026", serverLabel: "Test SQL Server",
    resourceSizeMb: 123, onPolicies: noop, onNotes: noop, onPdf: noop, onSql: noop,
  }));
  for (let n = 1; n <= 8; n++) assert.ok(html.includes(`View 0${n}`));
  for (const href of ["/customers", "/employees", "/customer-search-1", "/customers/name-search", "/employee-licenses"]) {
    assert.ok(html.includes(`href="${href}"`));
  }
  assert.match(html, /Current company policy/);
  assert.match(html, /Company history from SQL/);
  assert.match(html, /10\/21\/2026/);
  assert.match(html, /week=42&amp;year=2026/);
  assert.match(html, /ac-access-menu-work-canvas/);
  assert.match(html, /logo_dashboard/);
  assert.match(html, /MC Labor eagle with American and Irish flags/);
  assert.doesNotMatch(html, /ac-main-menu-hero/);
  assert.doesNotMatch(html, /Delete Blank Employees|Lock Weeks|Update Chrome Driver|Fix System Resource|Show Alerts screen/);
});
