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
  for (const href of ["/customers", "/employees", "/employee-licenses"]) {
    assert.ok(html.includes(`href="${href}"`));
  }
  assert.match(html, /Current company policy/);
  assert.match(html, /Company history from SQL/);
  assert.match(html, /10\/21\/2026/);
  assert.match(html, /week=42&amp;year=2026/);
  assert.match(html, /ac-access-menu-work-canvas/);
  assert.match(html, /aria-label="Open shortcuts"/);
  assert.equal((html.match(/class="ac-shortcuts-row/g) ?? []).length, 91);
  assert.equal((html.match(/class="ac-shortcuts-inactive"/g) ?? []).length, 90);
  assert.match(html, /href="\/admin\/office-staff"[^>]*>Office Staff<\/a>/);
  assert.match(html, /Company Settings: Acc Ref Hours Limit/);
  assert.match(html, /logo_dashboard/);
  assert.match(html, /MC Labor eagle with American and Irish flags/);
  assert.match(html, /ac-access-menu-exit[^>]*>Exit Database<\/button>/);
  assert.doesNotMatch(html, /ac-main-menu-hero/);
  for (const label of ["Lock Weeks", "Knowledge Base", "Delete Blank Employees", "Delete Week", "Reminders", "Current Logins"]) {
    assert.ok(html.includes(label));
  }
  assert.doesNotMatch(html, /Disconnect SQL/);
  for (const name of ["ac-menu-referral", "ac-menu-chrome", "ac-menu-email", "ac-menu-customers", "ac-menu-employees", "ac-menu-licenses"]) assert.ok(html.includes(name));
  assert.match(html, /Show Alerts screen when opening the Customer Menu screen/);
});
