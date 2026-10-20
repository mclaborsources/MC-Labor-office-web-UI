import { queryReadOnlyUncached } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";
import { getOfficeFeatures } from "./office-staff";
import { officeFeatureAllowed } from "./office-permissions";
import type { SessionData, SessionUser } from "@/types/auth";
import type { LoginPrompts } from "@/types/login-prompts";

export function officeClock(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second), greeting: Number(parts.hour) < 12 ? "Good Morning" : Number(parts.hour) < 17 ? "Good Afternoon" : "Good Evening" };
}
export function clockSeconds(value: string | null | undefined, fallback: number) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return fallback;
  let hour = Number(match[1]);
  if (match[4]) hour = hour % 12 + (match[4].toUpperCase() === "PM" ? 12 : 0);
  return hour * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
}
export function loginNoteDecision(seconds: number, start: number, end: number, exists: boolean): "none" | "late" | "early" {
  if (exists || seconds < start || seconds > end) return "none";
  return seconds > 8 * 3600 ? "late" : "early";
}

export async function saveLoginNote(user: SessionUser, date: string, note: string, type: "Early" | "Login Late") {
  if (!user.officeStaffId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !note.trim() || note.length > 2000) throw new Error("Enter a login note (up to 2,000 characters).");
  await withTransaction(async run => {
    await run(`IF NOT EXISTS (SELECT 1 FROM tblOfficeStaffLoginNotes WITH (UPDLOCK,HOLDLOCK)
      WHERE OfficeStaffID=@id AND OfficeStaffLoginDate=CAST(@date AS DATE))
      INSERT INTO tblOfficeStaffLoginNotes
      (OfficeStaffID,OfficeStaffLoginDate,OfficeStaffLoginNoteLogin,OfficeStaffLoginNoteUserName,OfficeStaffLoginNoteTimestamp)
      VALUES (@id,CAST(@date AS DATE),@note,@initials,GETDATE())`, [
      { name: "id", value: user.officeStaffId }, { name: "date", value: date },
      { name: "note", value: `${type}: ${note.trim()}` }, { name: "initials", value: user.initials || user.displayName },
    ]);
  });
}

export async function prepareLoginPrompts(user: SessionUser) {
  const features = await getOfficeFeatures(user.officeStaffId!);
  const clock = officeClock();
  let noteDate: string | undefined;
  if (officeFeatureAllowed(features, "Login Notes", "Add Login Notes")) {
    const [settings] = await queryReadOnlyUncached<{ start: string | null; end: string | null }>(`SELECT TOP (1) LoginSystemStartTime AS start,LoginSystemEndTime AS [end] FROM SettingsBE`);
    if (clock.seconds >= clockSeconds(settings?.start, 6 * 3600) && clock.seconds <= clockSeconds(settings?.end, 18 * 3600)) {
      const exists = await queryReadOnlyUncached(`SELECT OfficeStaffLoginNoteID FROM tblOfficeStaffLoginNotes WHERE OfficeStaffID=@id AND OfficeStaffLoginDate=CAST(@date AS DATE)`, [{ name: "id", value: user.officeStaffId! }, { name: "date", value: clock.date }]);
      const decision = loginNoteDecision(clock.seconds, clockSeconds(settings?.start, 6 * 3600), clockSeconds(settings?.end, 18 * 3600), exists.length > 0);
      if (decision === "late") noteDate = clock.date;
      else if (decision === "early") await saveLoginNote(user, clock.date, "Early", "Early");
    }
  }
  return { noteDate, showReminders: officeFeatureAllowed(features, "Reminders") };
}

export async function readLoginPrompts(session: SessionData): Promise<LoginPrompts> {
  const clock = officeClock();
  const reasons = session.loginNoteDate ? await queryReadOnlyUncached<{ reason: string }>(`SELECT PullDownOfficeStaffLoginNoteReason AS reason FROM tblPullDownOfficeStaffLoginNoteReasons WHERE PullDownOfficeStaffLoginNoteReasonActive=1 ORDER BY PullDownOfficeStaffLoginNoteReasonSort,PullDownOfficeStaffLoginNoteReason`) : [];
  const reminders = session.loginRemindersPending ? await queryReadOnlyUncached<LoginPrompts["reminders"][number]>(`SELECT ReminderID AS id,ISNULL(Reminder,'') AS item,
    DATEDIFF(day,CAST(@date AS DATE),CAST(ReminderDueDate AS DATE)) AS days
    FROM tblReminders WHERE ReminderTypeID=1 ORDER BY ReminderDueDate,ReminderID`, [{ name: "date", value: clock.date }]) : [];
  return { displayName: session.user?.displayName ?? "", greeting: clock.greeting, noteDate: session.loginNoteDate, reasons: reasons.map(row => row.reason), showReminders: !!session.loginRemindersPending, reminders };
}
