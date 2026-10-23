"use client";

import { useState } from "react";
import type { EmployeeDetail, EmployeeSummary } from "@/types/employee";

type EmployeeOption = Pick<EmployeeSummary, "employeeId" | "fullName">;

export function EmployeeRatesScreen({ employee, employeeOptions, referralAgencyOptions }: { employee: EmployeeDetail; employeeOptions: EmployeeOption[]; referralAgencyOptions: string[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = employee.accessFields;
  const value = (...keys: string[]) => keys.map(key => fields[key]).find(item => item !== undefined && item !== "") ?? "";
  const select = (label: string, key: string, current: string, options: string[]) => <label key={key}>{label}<select aria-label={label} value={values[key] ?? current} onChange={event => setValues(state => ({ ...state, [key]: event.target.value }))}><option value="" />{current && !options.includes(current) && <option value={current}>{current}</option>}{[...new Set(options.filter(Boolean))].map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
  const rateField = (label: string, keys: string[], history = true) => <div className="er-rate-line" key={label}><label>{label}<input readOnly value={value(...keys)} /></label>{history && <button data-action-status="missing" title="Rate history is read-only">History</button>}</div>;
  const agencies = referralAgencyOptions;
  const people = employeeOptions.map(option => option.fullName).filter(Boolean);
  const bonusStatus = value("EmployeeBonusExpenseStatus", "BonusExpenseStatus");

  return <div className="er-rates-screen">
    <section className="er-rates-left">
      <div className="er-rates-topline">{rateField("Pay Rate", ["PayRate"], true)}<label className="er-rate-note">Note on Pay Rate<textarea readOnly value={value("PayRateNote", "EmployeePayRateNote")} /></label></div>
      <div className="er-rates-columns">
        <div className="er-rates-general">
          {rateField("Co Exp Travel Per Hr", ["CoExpTravelPerHr", "EmployeeCoExpTravelPerHr"])}
          {rateField("Co Exp Parking Per Hr", ["CoExpParkingPerHr", "EmployeeCoExpParkingPerHr"])}
          {rateField("Co Exp Health Ins Per Hr", ["CoExpHealthInsPerHr", "EmployeeCoExpHealthInsPerHr"], false)}
          {rateField("Co Exp Vacation Per Hr", ["CoExpVacationPerHr", "EmployeeCoExpVacationPerHr"], false)}
          {rateField("Vacation Start Date", ["VacationHoursStartDate", "VacationStartDate"], false)}
          {rateField("Hrs Vac", ["VacationHours", "HoursVacation"], false)}
          <label className="er-rate-long">Work Hours Needed to Accrue 1 Hour of Vacation<input readOnly value={value("VacationHoursBlock", "WorkHoursNeededToAccrueVacation")} /></label>
          <button data-action-status="missing" className="er-rate-margin">Margin<br />Calculator</button>
          <button data-action-status="missing" className="er-vacation-history">History</button>
          <button data-action-status="missing" className="er-rate-clear">Clear<br />Vacation</button>
          <div className="er-rate-line er-rate-agency"><label>Agency Referral Rate<input className="er-red-rate" readOnly value={value("AgencyReferralRate", "EmployeeReferralAgencyRate")} /></label><button data-action-status="missing">History</button></div>
          {select("Referral Agency", "agency", value("ReferralAgencyName", "EmployeeReferralAgency", "PullDownReferralAgencyName"), agencies)}
          {rateField("Employee Referral Rate", ["EmployeeReferralRate"], false)}
          {select("Referred by Employee", "referredBy", value("ReferredByEmployee", "EmReferredBy"), people)}
          <label className="er-admin-notes">Admin Notes:<textarea readOnly value={value("EmployeeAdminNotes", "AdminNotes")} /></label>
        </div>
        <div className="er-rates-extra">{rateField("Co Exp Schooling Per Hr", ["CoExpSchoolingPerHr", "EmployeeCoExpSchoolingPerHr"])}{rateField("Co Exp Tools Per Hr", ["CoExpToolsPerHr", "EmployeeCoExpToolsPerHr"])}{rateField("Co Exp Per Diem Per Hr", ["CoExpPerDiemPerHr", "EmployeeCoExpPerDiemPerHr"])}{rateField("Co Exp Spare 2 Per Hr", ["CoExpSpare2PerHr", "EmployeeCoExpSpare2PerHr"])}</div>
        <section className="er-401k-panel"><header><b>IPG</b><strong>401(k)</strong></header>
          <label>Eligible<input type="checkbox" checked={["1", "true", "yes"].includes(value("Employee401kEligible", "Employee401KEligible", "401kEligible").toLowerCase())} readOnly /></label>
          <label>First Week<input readOnly value={value("Employee401kFirstWeek", "401kFirstWeek")} /></label>
          <label>Weekly Payment<input readOnly value={value("Employee401kWeeklyPayment", "401kWeeklyPayment")} /></label>
          <label>User<input readOnly value={value("Employee401kUserName", "401kUserName")} /></label>
          <label>Date<input readOnly value={value("Employee401kDate", "401kDate")} /></label>
          <label>Received Package<input type="checkbox" checked={["1", "true", "yes"].includes(value("Employee401kReceivedPackage", "401kReceivedPackage").toLowerCase())} readOnly /></label>
          <label>User<input readOnly value={value("Employee401kPackageUserName", "401kPackageUserName")} /></label>
          <label>Date<input readOnly value={value("Employee401kPackageDate", "401kPackageDate")} /></label>
        </section>
      </div>
    </section>
    <section className="er-referral-bonus"><h3>Referral Employees for Employee Bonus Expense</h3><table><thead><tr><th>Employee</th><th>Referral Rate/Hr</th><th>Last Week</th></tr></thead><tbody>{Array.from({ length: 13 }, (_, index) => <tr key={index}><td /><td /><td /></tr>)}</tbody></table><div className="er-referral-recordbar">Record:　|◂　◂　　▸　▸|　　No Filter　　Search</div></section>
    <section className="er-bonus-expense"><h3>Employee Bonus Expense</h3>{rateField("Bonus Exp Rate", ["BonusExpenseRate", "EmployeeBonusExpenseRate"], false)}{rateField("Bonus Exp Start Date", ["BonusExpenseStartDate", "EmployeeBonusStartDate"], false)}{rateField("Bonus Exp to Employee", ["BonusExpenseToEmployee", "EmployeeBonusToEmployee"], false)}{select("Bonus Exp Status", "bonusStatus", bonusStatus, ["Active", "Pending", "Paid", "Inactive"])}<label>Bonus Exp Notes:<textarea readOnly value={value("BonusExpenseNotes", "EmployeeBonusNotes")} /></label></section>
  </div>;
}
