import { test } from "node:test";
import assert from "node:assert/strict";
import {
  thisWeekDayDate,
  getCurrentWeekContext,
  formatDateUS,
  datesForAssignWeek,
} from "./week";

// JS getDay(): Sun=0 … Sat=6. The work week is Saturday→Friday, week ending Friday.
const FRIDAY = 5;
const SATURDAY = 6;

test("thisWeekDayDate(d, 7) always returns a Friday", () => {
  for (let offset = 0; offset < 21; offset++) {
    const d = new Date(2024, 0, 1 + offset); // Jan 1 … Jan 21, 2024
    const friday = thisWeekDayDate(d, 7);
    assert.equal(friday.getDay(), FRIDAY, `expected Friday for ${d.toDateString()}`);
  }
});

test("week-ending Friday is on or after the reference date within the work week", () => {
  // Wed Jan 3 2024 is in the work week Sat Dec 30 2023 → Fri Jan 5 2024.
  const we = thisWeekDayDate(new Date(2024, 0, 3), 7);
  assert.equal(formatDateUS(we), "1/5/2024");
});

test("a Friday reference date returns itself as the week ending", () => {
  const friday = new Date(2024, 0, 5); // Fri Jan 5 2024
  const we = thisWeekDayDate(friday, 7);
  assert.equal(formatDateUS(we), "1/5/2024");
});

test("getCurrentWeekContext: start is Saturday, end is Friday, exactly 6 days apart", () => {
  for (let offset = 0; offset < 14; offset++) {
    const ref = new Date(2024, 5, 1 + offset);
    const ctx = getCurrentWeekContext(ref);

    const start = new Date(ctx.weekStartDate);
    const end = new Date(ctx.weekEndingDate);

    assert.equal(start.getDay(), SATURDAY, `start should be Saturday for ${ref.toDateString()}`);
    assert.equal(end.getDay(), FRIDAY, `end should be Friday for ${ref.toDateString()}`);

    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    assert.equal(diffDays, 6, `start→end should span 6 days for ${ref.toDateString()}`);
  }
});

test("Access-aligned: Fri 6/26/2026 is assign week 26", () => {
  const ctx = getCurrentWeekContext(new Date(2026, 5, 26));
  assert.equal(ctx.assignWeek, 26);
  assert.equal(formatDateUS(new Date(ctx.weekEndingDate)), "6/26/2026");
});

test("datesForAssignWeek(26, 2026) matches current week ending 6/26", () => {
  const d = datesForAssignWeek(26, 2026);
  assert.equal(d.weekStartDate, "6/20/2026");
  assert.equal(d.weekEndingDate, "6/26/2026");
});
