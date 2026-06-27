import { queryReadOnly } from "@/lib/db/sql";
import {
  datesForAssignWeek,
  getCurrentWeekContext,
  getWeekContextForOffset,
  parseDateUS,
} from "@/lib/week";
import type { WeekContext } from "@/types/tracking";

export interface ResolvedTrackingWeek extends WeekContext {
  /** Loaded a different week because the requested one had no tblTracking rows */
  fallback?: boolean;
  /** Week/year we tried first (when fallback is true) */
  requestedWeek?: number;
  requestedYear?: number;
  /** Matched tblTracking via WeekEndingDate */
  alignedFromSql?: boolean;
}

/** Most recent AssignWeek/AssignYear that has tracking rows. */
export async function getLatestTrackingWeek(): Promise<{
  assignWeek: number;
  assignYear: number;
} | null> {
  try {
    const rows = await queryReadOnly<{ AssignWeek: number; AssignYear: number }>(
      `SELECT TOP (1) AssignWeek, AssignYear
       FROM tblTracking WITH (NOLOCK)
       WHERE AssignWeek IS NOT NULL AND AssignYear IS NOT NULL
       GROUP BY AssignYear, AssignWeek
       ORDER BY AssignYear DESC, AssignWeek DESC`,
    );
    const r = rows[0];
    if (!r) return null;
    return { assignWeek: Number(r.AssignWeek), assignYear: Number(r.AssignYear) };
  } catch {
    return null;
  }
}

/** Prefer AssignWeek/Year stored for this work week's Friday ending date. */
async function alignWeekFromSql(weekEndingFriday: Date): Promise<{
  assignWeek: number;
  assignYear: number;
} | null> {
  try {
    const rows = await queryReadOnly<{ AssignWeek: number; AssignYear: number }>(
      `SELECT TOP (1) AssignWeek, AssignYear
       FROM tblTracking WITH (NOLOCK)
       WHERE CAST(WeekEndingDate AS DATE) = CAST(@we AS DATE)
       GROUP BY AssignWeek, AssignYear
       ORDER BY COUNT(*) DESC`,
      [{ name: "we", value: weekEndingFriday }],
    );
    const r = rows[0];
    if (!r) return null;
    return { assignWeek: Number(r.AssignWeek), assignYear: Number(r.AssignYear) };
  } catch {
    return null;
  }
}

async function weekHasTrackingRows(week: number, year: number): Promise<boolean> {
  try {
    const rows = await queryReadOnly<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM tblTracking WITH (NOLOCK)
       WHERE AssignWeek = @week AND AssignYear = @year`,
      [
        { name: "week", value: week },
        { name: "year", value: year },
      ],
    );
    return Number(rows[0]?.cnt ?? 0) > 0;
  } catch {
    return false;
  }
}

export interface ResolveTrackingWeekOptions {
  referenceDate?: Date;
  weekOffset?: number;
  explicitWeek?: number;
  explicitYear?: number;
}

/**
 * Resolve the tracking week for screens that read tblTracking.
 * Order: explicit params → calendar week (Access-aligned) → SQL WeekEndingDate match
 * → latest week with data (fallback).
 */
export async function resolveTrackingWeek(
  options: ResolveTrackingWeekOptions = {},
): Promise<ResolvedTrackingWeek> {
  const ref = options.referenceDate ?? new Date();
  const base =
    options.weekOffset !== undefined && options.weekOffset !== 0
      ? getWeekContextForOffset(options.weekOffset, ref)
      : getCurrentWeekContext(ref);

  let assignWeek =
    options.explicitWeek !== undefined ? options.explicitWeek : base.assignWeek;
  let assignYear =
    options.explicitYear !== undefined ? options.explicitYear : base.assignYear;

  const requestedWeek = assignWeek;
  const requestedYear = assignYear;

  if (options.explicitWeek === undefined) {
    const friday = parseDateUS(base.weekEndingDate);
    const sqlWeek = await alignWeekFromSql(friday);
    if (sqlWeek) {
      assignWeek = sqlWeek.assignWeek;
      assignYear = sqlWeek.assignYear;
    }
  }

  const dates = datesForAssignWeek(assignWeek, assignYear);
  const ctx: WeekContext = {
    ...base,
    ...dates,
    assignWeek,
    assignYear,
  };

  if (await weekHasTrackingRows(assignWeek, assignYear)) {
    return {
      ...ctx,
      alignedFromSql: assignWeek !== base.assignWeek || assignYear !== base.assignYear,
    };
  }

  if (await weekHasTrackingRows(requestedWeek, requestedYear)) {
    const reqDates = datesForAssignWeek(requestedWeek, requestedYear);
    return {
      ...base,
      ...reqDates,
      assignWeek: requestedWeek,
      assignYear: requestedYear,
    };
  }

  const latest = await getLatestTrackingWeek();
  if (latest) {
    if (await weekHasTrackingRows(latest.assignWeek, latest.assignYear)) {
      const latestDates = datesForAssignWeek(latest.assignWeek, latest.assignYear);
      return {
        ...base,
        ...latestDates,
        assignWeek: latest.assignWeek,
        assignYear: latest.assignYear,
        fallback: true,
        requestedWeek,
        requestedYear,
      };
    }
  }

  const reqDates = datesForAssignWeek(requestedWeek, requestedYear);
  return {
    ...base,
    ...reqDates,
    assignWeek: requestedWeek,
    assignYear: requestedYear,
  };
}

export function weekRangeLabel(week: WeekContext): string {
  return `Week ${week.assignWeek} · ${week.assignYear} (Sat ${week.weekStartDate} – Fri ${week.weekEndingDate})`;
}

export function formatWeekBanner(week: ResolvedTrackingWeek): string {
  if (week.fallback && week.requestedWeek !== undefined) {
    return `Showing week ${week.assignWeek}/${week.assignYear} — no rows for week ${week.requestedWeek}/${week.requestedYear}.`;
  }
  return weekRangeLabel(week);
}
