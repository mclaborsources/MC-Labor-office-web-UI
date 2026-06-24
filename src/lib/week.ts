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
 * VBA DatePart("ww", date, 7, 1) — week of year, first day of week = Saturday.
 */
export function assignWeekFromDate(date: Date): number {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const firstSaturday = thisWeekDayDate(jan1, 1);
  const diffDays = Math.floor(
    (date.getTime() - firstSaturday.getTime()) / MS_PER_DAY,
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
  const weekStart = thisWeekDayDate(referenceDate, 1);

  return {
    weekEndingDate: formatDateUS(weekEnding),
    weekStartDate: formatDateUS(weekStart),
    displayDate: formatDateUS(weekEnding),
    assignWeek: assignWeekFromDate(weekEnding),
    assignYear: assignYearFromDate(weekEnding),
  };
}
