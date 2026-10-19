"use client";

import { useMemo, useState } from "react";
import type { EmployeePayRateReferralAgencyRow } from "@/lib/employeePayRateReferralAgency";

const columns: [keyof EmployeePayRateReferralAgencyRow, string][] = [
  ["firstName", "EmFirstName"], ["middle", "EmMiddle"], ["lastName", "EmLastName"],
  ["payrollCompany", "PayrollCoOnSite"], ["jobApplicationStatus", "JApp"],
  ["referralAgency", "ReferralAgency"], ["agencyReferralRatePerHr", "AgencyReferralRatePerHr"],
  ["payRate", "PayRate"], ["lastWeekAssigned", "LastWeekAssigned"],
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

export function EmployeePayRateReferralAgencyScreen({ rows, loadError }: { rows: EmployeePayRateReferralAgencyRow[]; loadError: string }) {
  const [sort, setSort] = useState<{ key: keyof EmployeePayRateReferralAgencyRow; descending: boolean } | null>(null);
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sort.descending ? -result : result;
    });
  }, [rows, sort]);

  return <section className="er-pay-referral-screen">
    <header><h1>Employees with Pay Rate and Referral Agency</h1><span>{rows.length} records</span></header>
    {loadError ? <p role="alert">{loadError}</p> : <div className="er-pay-referral-wrap"><table><thead><tr>{columns.map(([key, label]) => <th key={key}><button data-action-status="complete" onClick={() => setSort(current => ({ key, descending: current?.key === key ? !current.descending : false }))}>{label}{sort?.key === key ? sort.descending ? " ▼" : " ▲" : " ⌄"}</button></th>)}</tr></thead><tbody>{sortedRows.map(row => <tr key={row.id}>{columns.map(([key]) => <td key={key}>{key === "payRate" || key === "agencyReferralRatePerHr" ? currency(row[key] as number) : row[key]}</td>)}</tr>)}{!rows.length && <tr><td colSpan={columns.length}>No matching employee records.</td></tr>}</tbody></table></div>}
  </section>;
}
