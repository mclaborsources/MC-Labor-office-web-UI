"use client";

import { AccessButton } from "@/components/access/AccessButton";
import { thisWeekDayDate } from "@/lib/week";

export function initialReportDate() {
  const date = thisWeekDayDate(new Date(), 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReportWeekControls({ date, onChange, onRefresh }: { date: string; onChange: (date: string) => void; onRefresh?: () => void }) {
  const ending = new Date(`${date}T12:00:00`);
  const start = new Date(ending);
  start.setDate(start.getDate() - 6);
  const payday = new Date(ending);
  payday.setDate(payday.getDate() + 6);
  const move = (days: number) => {
    const next = new Date(ending);
    next.setDate(next.getDate() + days);
    onChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`);
  };
  const long = (value: Date) => value.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return <div className="report-week">
    <label>Week Ending Friday<input type="date" value={date} onChange={(event) => {
      if (!event.target.value) return;
      const selected = thisWeekDayDate(new Date(`${event.target.value}T12:00:00`), 7);
      onChange(`${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`);
    }} /></label>
    <div className="report-week-nav"><i>(click date first)</i><div>
      <button data-action-status="complete" type="button" aria-label="Previous week" onClick={() => move(-7)}>←</button>
      <button data-action-status="complete" type="button" aria-label="Current week" onClick={() => onChange(initialReportDate())}>▣</button>
      <button data-action-status="complete" type="button" aria-label="Next week" onClick={() => move(7)}>→</button>
    </div></div>
    <label>Start and End Days of Report<output>{long(start)}</output><output>{long(ending)}</output></label>
    <label>Payroll Chk Day<output>{long(payday)}</output></label>
    {onRefresh && <AccessButton data-action-status="complete" onClick={onRefresh}>Refresh</AccessButton>}
  </div>;
}
