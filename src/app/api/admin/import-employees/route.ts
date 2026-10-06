import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { queryReadOnly, clearReadCache } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";

type ImportRow = {
  firstName?: unknown; middleInitial?: unknown; lastName?: unknown; cellPhone?: unknown;
  city?: unknown; state?: unknown; pay?: unknown; trade?: unknown; qualification?: unknown;
  email?: unknown; employeeStatus?: unknown; howReferred?: unknown; referredBy?: unknown;
};
type Lookup = { id: number; label: string };
type PreparedRow = {
  firstName: string; middleInitial: string; lastName: string; cellPhone: string; city: string; state: string;
  pay: number | null; tradeId: number | null; qualificationId: number | null; email: string; statusId: number;
  howReferredId: number | null; referredBy: string; stateId: number | null;
};

const str = (value: unknown) => String(value ?? "").trim();
const key = (value: string) => value.trim().toLocaleLowerCase("en-US");

async function requireAdmin() {
  const session = await requireSession();
  if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required.");
  return session;
}

async function lookups() {
  const [grades, statuses, trades, qualifications, referrals, states] = await Promise.all([
    queryReadOnly<{ id: number; label: string }>(`SELECT PullDownGradeID id, ISNULL(PullDownGrade,'') label FROM tblPullDownGrades WITH (NOLOCK)`),
    queryReadOnly<{ id: number; label: string }>(`SELECT PullDownEmployeeStatusID id, ISNULL(PullDownEmployeeStatus,'') label FROM tblPullDownEmployeeStatus WITH (NOLOCK)`),
    queryReadOnly<{ id: number; label: string }>(`SELECT PullDownTradeID id, ISNULL(PullDownTrade,'') label FROM tblPullDownTrade WITH (NOLOCK)`),
    queryReadOnly<{ id: number; label: string }>(`SELECT PullDownQualificationID id, ISNULL(PullDownQualification,'') label FROM tblPullDownQualifications WITH (NOLOCK)`),
    queryReadOnly<{ id: number; label: string }>(`SELECT PullDownHowReferredID id, ISNULL(PullDownHowReferred,'') label FROM tblPullDownHowReferred WITH (NOLOCK) WHERE ISNULL(PullDownHowReferredActive,1)=1`),
    queryReadOnly<{ id: number; label: string }>(`SELECT PullDownStateID id, ISNULL(PullDownState,'') label FROM tblPullDownStates WITH (NOLOCK)`),
  ]);
  const byLabel = (items: Lookup[]) => new Map(items.map(item => [key(item.label), Number(item.id)]));
  return { grades, status: byLabel(statuses), trade: byLabel(trades), qualification: byLabel(qualifications), referral: byLabel(referrals), state: byLabel(states) };
}

async function prepare(rows: ImportRow[], gradeId: string) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) throw new Error("Choose a file with 1 to 500 employee rows.");
  const lists = await lookups();
  if (!gradeId || !lists.grades.some(item => String(item.id) === gradeId)) throw new Error("Select a valid employee grade.");
  const prepared: PreparedRow[] = [];
  const errors: string[][] = rows.map(() => []);
  const names = new Map<string, number>();
  const phones = new Map<string, number>();

  for (const [index, input] of rows.entries()) {
    const firstName = str(input.firstName), middleInitial = str(input.middleInitial), lastName = str(input.lastName);
    const cellPhone = str(input.cellPhone).replace(/\s+/g, " ");
    const city = str(input.city), state = str(input.state), status = str(input.employeeStatus);
    const trade = str(input.trade), qualification = str(input.qualification), howReferred = str(input.howReferred);
    const payText = str(input.pay), pay = payText ? Number(payText.replace(/[$,]/g, "")) : null;
    if (!firstName) errors[index].push("Missing First Name");
    if (!lastName) errors[index].push("Missing Last Name");
    if (!status) errors[index].push("Missing Employee Status");
    if (status && !lists.status.has(key(status))) errors[index].push(`Unknown Employee Status: ${status}`);
    if (trade && !lists.trade.has(key(trade))) errors[index].push(`Unknown Trade: ${trade}`);
    if (qualification && !lists.qualification.has(key(qualification))) errors[index].push(`Unknown Qualification: ${qualification}`);
    if (howReferred && !lists.referral.has(key(howReferred))) errors[index].push(`Unknown How Referred value: ${howReferred}`);
    if ((city && !state) || (!city && state)) errors[index].push("City and State must both be provided.");
    if (state && !lists.state.has(key(state))) errors[index].push(`Unknown State: ${state}`);
    if (payText && (!Number.isFinite(pay) || pay! < 0)) errors[index].push("Pay must be a valid non-negative number.");
    if ([4, 5].includes(lists.referral.get(key(howReferred)) ?? -1) && !str(input.referredBy)) errors[index].push("Other Desc/Employee is required for this referral type.");

    const nameKey = [firstName, middleInitial, lastName].map(key).join("|");
    if (firstName && lastName && names.has(nameKey)) errors[index].push(`Repeated import employee name (row ${names.get(nameKey)! + 1}).`);
    else if (firstName && lastName) names.set(nameKey, index);
    const phoneKey = key(cellPhone);
    if (cellPhone && phones.has(phoneKey)) errors[index].push(`Repeated import cell number (row ${phones.get(phoneKey)! + 1}).`);
    else if (cellPhone) phones.set(phoneKey, index);

    if (lastName) {
      const duplicates = await queryReadOnly<{ id: number }>(
        `SELECT TOP (1) EmployeeID id FROM tblEmployee WITH (NOLOCK) WHERE EmLastName=@lastName AND ((@phone IS NULL AND EmMobilePhone IS NULL) OR EmMobilePhone=@phone)`,
        [{ name: "lastName", value: lastName }, { name: "phone", value: cellPhone || null }],
      );
      if (duplicates.length && cellPhone) errors[index].push("Duplicate Last Name/Cell # in database.");
    }

    prepared.push({
      firstName, middleInitial, lastName, cellPhone, city, state, pay,
      tradeId: trade ? lists.trade.get(key(trade)) ?? null : null,
      qualificationId: qualification ? lists.qualification.get(key(qualification)) ?? null : null,
      email: str(input.email).toLocaleLowerCase("en-US"), statusId: lists.status.get(key(status)) ?? 0,
      howReferredId: howReferred ? lists.referral.get(key(howReferred)) ?? null : null,
      referredBy: str(input.referredBy), stateId: state ? lists.state.get(key(state)) ?? null : null,
    });
  }
  return { prepared, errors };
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 }); }

  try {
    const body = await request.json() as { action?: string; rows?: ImportRow[]; gradeId?: string };
    if (!Array.isArray(body.rows)) throw new Error("Import rows are missing.");
    const { prepared, errors } = await prepare(body.rows, str(body.gradeId));
    const statuses = errors.map((messages, index) => ({ row: index + 1, status: messages.length ? messages.join("; ") : "OK to import" }));
    if (body.action === "check") return NextResponse.json({ ok: true, statuses });
    if (body.action !== "import") throw new Error("Choose Check before Import.");
    if (errors.some(messages => messages.length)) return NextResponse.json({ ok: false, statuses, error: "Some rows have problems. Correct them before importing." }, { status: 422 });

    const gradeId = Number(body.gradeId);
    const userName = str(session.user?.username || session.user?.displayName).slice(0, 80);
    const imported = await withTransaction(async run => {
      const ids: number[] = [];
      for (const row of prepared) {
        let stateCityId: number | null = null;
        if (row.stateId && row.city) {
          const existing = await run(`SELECT TOP (1) PullDownStateCityID id FROM tblPullDownStateCities WITH (UPDLOCK,HOLDLOCK) WHERE StateID=@stateId AND City=@city`, [
            { name: "stateId", value: row.stateId }, { name: "city", value: row.city },
          ]);
          stateCityId = Number((existing.recordset?.[0] as { id?: number } | undefined)?.id ?? 0) || null;
          if (!stateCityId) {
            const created = await run(`INSERT INTO tblPullDownStateCities(StateID,City,PullDownStateCityActive) OUTPUT INSERTED.PullDownStateCityID AS id VALUES(@stateId,@city,1)`, [
              { name: "stateId", value: row.stateId }, { name: "city", value: row.city },
            ]);
            stateCityId = Number((created.recordset?.[0] as { id?: number } | undefined)?.id ?? 0) || null;
          }
        }
        const address = [row.city, row.state].filter(Boolean).join(", ");
        const inserted = await run(`INSERT INTO tblEmployee
          (EmFirstName,EmMiddle,EmLastName,EmMobilePhone,EmMobilePhoneUserName,EmMobilePhoneTimestamp,EmCellCarrierID,
           EmCity,EmState,EmAddress,EmStateCityID,EmMailCity,EmMailState,EmMailAddress,EmMailStateCityID,
           BaseSalary,EmTradeID,EmQualificationID,EmEmail,EmEmployeeStatusID,EmHowReferredID,EmReferredBy,
           EmEntryUserName,EmEntryTimestamp,EmGradeID)
          OUTPUT INSERTED.EmployeeID AS id
          VALUES(@firstName,@middleInitial,@lastName,@cellPhone,CASE WHEN @cellPhone IS NULL THEN NULL ELSE @userName END,
           CASE WHEN @cellPhone IS NULL THEN NULL ELSE GETDATE() END,CASE WHEN @cellPhone IS NULL THEN NULL ELSE 17 END,
           @city,@state,@address,@stateCityId,@city,@state,@address,@stateCityId,@pay,@tradeId,@qualificationId,
           @email,@statusId,@howReferredId,@referredBy,@userName,GETDATE(),@gradeId)`, [
          { name: "firstName", value: row.firstName }, { name: "middleInitial", value: row.middleInitial || null },
          { name: "lastName", value: row.lastName }, { name: "cellPhone", value: row.cellPhone || null },
          { name: "userName", value: userName }, { name: "city", value: row.city || null }, { name: "state", value: row.state || null },
          { name: "address", value: address || null }, { name: "stateCityId", value: stateCityId }, { name: "pay", value: row.pay },
          { name: "tradeId", value: row.tradeId }, { name: "qualificationId", value: row.qualificationId },
          { name: "email", value: row.email || null }, { name: "statusId", value: row.statusId },
          { name: "howReferredId", value: row.howReferredId }, { name: "referredBy", value: row.referredBy || null },
          { name: "gradeId", value: gradeId },
        ]);
        const employeeId = Number((inserted.recordset?.[0] as { id?: number } | undefined)?.id ?? 0);
        if (!employeeId) throw new Error(`Employee ${row.firstName} ${row.lastName} was not created.`);
        await run(`INSERT INTO tblEmployeeB(EmployeeID,EmployeeBCreate) VALUES(@employeeId,1)`, [{ name: "employeeId", value: employeeId }]);
        await run(`INSERT INTO tblEmployeeContacts(EmployeeID,EmployeeContactFName,EmployeeContactLName,EmployeeContactTitleID,EmployeeContactEmail,EmployeeContactCell,EmployeeContactCellCarrierID)
          VALUES(@employeeId,@firstName,@lastName,0,@email,@cellPhone,CASE WHEN @cellPhone IS NULL THEN NULL ELSE 17 END)`, [
          { name: "employeeId", value: employeeId }, { name: "firstName", value: row.firstName }, { name: "lastName", value: row.lastName },
          { name: "email", value: row.email || null }, { name: "cellPhone", value: row.cellPhone || null },
        ]);
        ids.push(employeeId);
      }
      return ids;
    });
    clearReadCache();
    return NextResponse.json({ ok: true, imported: imported.length, employeeIds: imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Employee import failed.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Write operations are disabled") ? 503 : message.includes("required") ? 400 : 500 });
  }
}
