import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SAdminTabPanel } from "./TrackingJobTabPanels";

test("S Admin recognizes navigation handled by the enclosing tracking panel", () => {
  const html = renderToStaticMarkup(createElement(SAdminTabPanel));
  const statuses = new Map([...html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/g)].map((match) => [
    match[2].replace(/&amp;/g, "&").trim(),
    /data-action-status="([^"]+)"/.exec(match[1])?.[1],
  ]));
  for (const label of ["Cust Contact Kickbacks", "Employee Email Kickbacks", "Employee Text Kickbacks", "Import Employees", "Import Customers", "MLS Job App Problems", "Wcc Rates", "Edit Salesman Report", "Email/Text Templates"]) {
    assert.equal(statuses.get(label), "linked", label);
  }
  assert.equal(statuses.get("Update Unassigned to Available"), "partial");
  assert.equal(statuses.get("Copy Forward History"), "partial");
  assert.equal(statuses.get("Import to Update Hunter"), "partial");
  assert.equal(statuses.get("Save View"), "missing");
  assert.equal(statuses.get("Delete View"), "missing");
});
