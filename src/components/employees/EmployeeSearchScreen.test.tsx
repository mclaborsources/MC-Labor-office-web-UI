import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmployeeSearchScreen } from "./EmployeeSearchScreen";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

test("Employee Search renders its loading results without an undefined variable", () => {
  const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
  const html = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router },
    createElement(PathnameContext.Provider, { value: "/employees" },
      createElement(SearchParamsContext.Provider, { value: new URLSearchParams() },
        createElement(EmployeeSearchScreen, {
          employees: [], trades: [], statuses: [], grades: [], cities: [], states: [],
          currentSearch: "", currentTradeId: "", currentStatusId: "", currentGradeId: "", currentCity: "", currentState: "",
          results: createElement("div", { role: "status" }, "Loading employee records"),
        })))));
  assert.match(html, /Loading employee records/);
  assert.match(html, /Employee Search 3/);
});
