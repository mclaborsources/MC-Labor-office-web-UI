import {totalPayrollByJobColumns} from "../src/lib/totalPayrollByJobColumns";
import React from "react";
import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {AccountingReportTable,remapReportCells,tableElements} from "../src/components/tables/AccountingReportTable";
const row=<tr><td>Selector</td><td>A</td><td>B</td><td>C</td></tr>;
const moved=remapReportCells(row as any,[0,3,1]);
assert.deepEqual(tableElements(moved.props.children).map(c=>c.props.children),["Selector","C","A"]);
const total=<tr><td/><td colSpan={2}>Total</td><td>123</td></tr>;
const hidden=remapReportCells(total as any,[0,1,3]);
assert.deepEqual(tableElements(hidden.props.children).map(c=>[c.props.children,c.props.colSpan]),[[undefined,1],["Total",1],["123",1]]);
const split=remapReportCells(total as any,[0,1,3,2]);
assert.deepEqual(tableElements(split.props.children).map(c=>c.props.children),[undefined,"Total","123","Total"]);
const html=renderToStaticMarkup(<AccountingReportTable columnLayoutKey="test"><colgroup><col style={{width:20}}/><col style={{width:100}}/><col style={{width:100}}/></colgroup><thead><tr><th/><th>Customer</th><th>Amount</th></tr></thead><tbody><tr><td/><td>Example</td><td>42</td></tr></tbody></AccountingReportTable>);
assert.ok(html.includes("Resize Customer column"));
assert.ok(html.includes("Resize Amount column"));
assert.ok(html.includes("Example"));
assert.ok(html.includes("accounting-report-table"));
console.log("Passed: resize controls, source-column mapping, hiding, reordering, merged totals, and table rendering.");


assert.equal(totalPayrollByJobColumns.filter(c=>c.visible).length,16);
assert.equal(totalPayrollByJobColumns.filter(c=>c.label==="Per Diem").length,2);
assert.equal(totalPayrollByJobColumns.find(c=>c.label==="Payroll Co")?.visible,false);
assert.equal(totalPayrollByJobColumns.find(c=>c.label==="Regular Hours")?.visible,false);
assert.ok(totalPayrollByJobColumns.some(c=>c.label.startsWith("Total Reg Payroll=")&&c.visible));
console.log("Passed: Total Payroll by Job available columns and 16 checked defaults.");
