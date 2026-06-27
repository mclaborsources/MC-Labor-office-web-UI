/**
 * Access-aligned week calculations (basMcLabor.ThisWeekDayDate, frmTrackingEdit).
 * Work week: Saturday (day 1) through Friday (day 7).
 * Week ending date: Friday.
 */

const MS_PER_DAY = 86400000;

/** VBA Weekday(date, vbSaturday): Saturday=1 … Friday=7 */
function weekdaySaturdayFirst(date: Date): number {
  const jsDay = date.getDay(); // Sun=0 … Sat=6
  return ((jsDay + 1) % 7) + 1;
}

/**
 * Port of Access ThisWeekDayDate(CurrentDate, ThisWeekDay).
 * ThisWeekDay 7 = Friday of the current work week containing CurrentDate.
 */
export function thisWeekDayDate(currentDate: Date, thisWeekDay: number): Date {
  const d = new Date(currentDate);
  d.setHours(0, 0, 0, 0);

  if (weekdaySaturdayFirst(d) === thisWeekDay) {
    return d;
  }

  let temp = new Date(d);
  while (weekdaySaturdayFirst(temp) !== thisWeekDay) {
    temp = new Date(temp.getTime() - MS_PER_DAY);
  }
  temp = new Date(temp.getTime() + 7 * MS_PER_DAY);
  return temp;
}

/**
 * VBA DatePart("ww", date, 7, 1) — week of year, first day of week = Saturday,
 * first week = week containing January 1 (starts Saturday on/before Jan 1).
 */
function saturdayOnOrBefore(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const wd = weekdaySaturdayFirst(d);
  d.setDate(d.getDate() - (wd - 1));
  return d;
}

export function assignWeekFromDate(date: Date): number {
  const year = date.getFullYear();
  const week1Start = saturdayOnOrBefore(new Date(year, 0, 1));

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (target.getTime() - week1Start.getTime()) / MS_PER_DAY,
  );
  if (diffDays < 0) {
    return assignWeekFromDate(new Date(year - 1, 11, 31));
  }
  return Math.floor(diffDays / 7) + 1;
}

/**
 * VBA DatePart("yyyy", date, 7, 1) — year for week with Saturday as first day.
 */
export function assignYearFromDate(date: Date): number {
  const week = assignWeekFromDate(date);
  const year = date.getFullYear();
  if (week === 1 && date.getMonth() === 11) {
    return year + 1;
  }
  if (week >= 52 && date.getMonth() === 0) {
    return year - 1;
  }
  return year;
}

export function formatDateUS(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

export function getCurrentWeekContext(referenceDate = new Date()) {
  const weekEnding = thisWeekDayDate(referenceDate, 7);
  // Work week is Saturday→Friday, so the Saturday that starts the week is always
  // exactly 6 days before the Friday week-ending date. Deriving it this way keeps
  // start/end in the same work week (thisWeekDayDate(ref, 1) can land on the next
  // week's Saturday for mid-week reference dates).
  const weekStart = new Date(weekEnding.getTime() - 6 * MS_PER_DAY);

  return {
    weekEndingDate: formatDateUS(weekEnding),
    weekStartDate: formatDateUS(weekStart),
    displayDate: formatDateUS(referenceDate),
    assignWeek: assignWeekFromDate(weekEnding),
    assignYear: assignYearFromDate(weekEnding),
  };
}

/** Shift the work week by N weeks (negative = last week, positive = next week). */
export function getWeekContextForOffset(weekOffset: number, referenceDate = new Date()) {
  const baseFriday = thisWeekDayDate(referenceDate, 7);
  const shifted = new Date(baseFriday.getTime() + weekOffset * 7 * MS_PER_DAY);
  return getCurrentWeekContext(shifted);
}

/** Sat–Fri date range for a given Access assign week/year (independent of "today"). */
export function datesForAssignWeek(assignWeek: number, assignYear: number) {
  const week1Start = saturdayOnOrBefore(new Date(assignYear, 0, 1));
  const weekStart = new Date(week1Start.getTime() + (assignWeek - 1) * 7 * MS_PER_DAY);
  const weekEnd = new Date(weekStart.getTime() + 6 * MS_PER_DAY);
  return {
    weekStartDate: formatDateUS(weekStart),
    weekEndingDate: formatDateUS(weekEnd),
  };
}

export function parseDateUS(value: string): Date {
  const [m, d, y] = value.split("/").map(Number);
  return new Date(y, m - 1, d);
}
