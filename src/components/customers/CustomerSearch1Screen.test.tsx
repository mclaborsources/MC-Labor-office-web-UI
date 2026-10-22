import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { CustomerSearch1Screen } from "./CustomerSearch1Screen";
import { toCustomerNameMatch } from "@/lib/customerNameSearchData";

test("Customer Search 1 reuses the Customers controls with the 31-column uncapped results", () => {
  const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
  const customers = Array.from({ length: 1000 }, (_, index) => toCustomerNameMatch({
    customerId: index + 1, customerName: `Preview Customer ${index + 1}`, profileType: "Main", ctcFirst: "Test",
  }));
  const html = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router },
    createElement(PathnameContext.Provider, { value: "/customer-search-1" },
      createElement(SearchParamsContext.Provider, { value: new URLSearchParams() },
        createElement(CustomerSearch1Screen, { customers, fetchedCount: 105192, params: {}, loadTimeMs: 123, loadError: "",
          options: { salesmen: [], customerTypes: [], statuses: [], cities: [], states: [] }, lastActionUsers: [] })))));
  assert.match(html, /Customer Search 1/);
  assert.match(html, /ac-customer-search-shell/);
  assert.match(html, /action="\/customer-search-1"/);
  assert.doesNotMatch(html, /action="\/customers"/);
  assert.doesNotMatch(html, /Search loaded customers|Type any part of a customer name/);
  assert.match(html, /Fetched: 105,192 customers/);
  assert.match(html, /Matching: 1,000/);
  assert.match(html, /Search all loaded customer fields/);
  assert.match(html, /aria-label="Date Range"/);
  assert.doesNotMatch(html, /Last week from|All customer type|All customer status|All profile type|All internet sales ready/);
  assert.equal((html.match(/aria-label="Sort or filter /g) ?? []).length, 31);
  assert.equal((html.match(/role="separator"/g) ?? []).length, 31);
  assert.match(html, /aria-label="Resize Name column"/);
  assert.match(html, /Ctc Email/);
  assert.match(html, /ac-customer-search-1-results/);
  assert.ok((html.match(/class="ac-customer-name-search-all-name"/g) ?? []).length < 60);
  assert.doesNotMatch(html, />Load all names</);
});
