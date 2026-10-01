import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllUnemploymentRequestContactRows, getUnemploymentContactStates } from "@/lib/adminDropdownReports";
import { clearReadCache } from "@/lib/db/sql";
import { queryWrite } from "@/lib/db/write";

export const dynamic = "force-dynamic";

type ContactInput = {
  id?: unknown; company?: unknown; first?: unknown; last?: unknown; street?: unknown; city?: unknown;
  stateId?: unknown; zip?: unknown; phone?: unknown; fax?: unknown; email?: unknown; sort?: unknown;
  notes?: unknown; active?: unknown;
};
function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function mapInput(raw: ContactInput) {
  const stateId = Number(raw.stateId || 0);
  const sort = Number(raw.sort || 0);
  return {
    company: clean(raw.company, 200), first: clean(raw.first, 100), last: clean(raw.last, 100),
    street: clean(raw.street, 200), city: clean(raw.city, 100), stateId: Number.isInteger(stateId) && stateId > 0 ? stateId : null,
    zip: clean(raw.zip, 20), phone: clean(raw.phone, 40), fax: clean(raw.fax, 40), email: clean(raw.email, 254),
    sort: Number.isFinite(sort) ? Math.trunc(sort) : 0, notes: clean(raw.notes, 2000), active: raw.active !== false,
  };
}
async function authorized() {
  try { await requireSession(); return true; } catch { return false; }
}
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Contact save failed.";
  const status = message.includes("Write operations are disabled") ? 503 : 500;
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 });
  try {
    const [contacts, states] = await Promise.all([getAllUnemploymentRequestContactRows(), getUnemploymentContactStates()]);
    return NextResponse.json({ ok:true, contacts, states });
  } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 });
  try {
    const body = await request.json() as ContactInput;
    const input = mapInput(body);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: "A valid contact ID is required." }, { status: 400 });
    const affected = await queryWrite(`UPDATE tblPullDownUnemploymentRequestContacts SET
      PullDownUnemploymentRequestCompany=@company, PullDownUnemploymentRequestContactFName=@first,
      PullDownUnemploymentRequestContactLName=@last, PullDownUnemploymentRequestContactStreet=@street,
      PullDownUnemploymentRequestContactCity=@city, PullDownUnemploymentRequestContactStateID=@stateId,
      PullDownUnemploymentRequestContactZip=@zip, PullDownUnemploymentRequestContactPhone=@phone,
      PullDownUnemploymentRequestContactFax=@fax, PullDownUnemploymentRequestContactEmail=@email,
      PullDownUnemploymentRequestContactSort=@sort, PullDownUnemploymentRequestContactNotes=@notes,
      PullDownUnemploymentRequestContactActive=@active
      WHERE PullDownUnemploymentRequestContactID=@id`, [
      { name:"id", value:id }, { name:"company", value:input.company }, { name:"first", value:input.first },
      { name:"last", value:input.last }, { name:"street", value:input.street }, { name:"city", value:input.city },
      { name:"stateId", value:input.stateId }, { name:"zip", value:input.zip }, { name:"phone", value:input.phone },
      { name:"fax", value:input.fax }, { name:"email", value:input.email }, { name:"sort", value:input.sort },
      { name:"notes", value:input.notes }, { name:"active", value:input.active },
    ]);
    if (!affected) return NextResponse.json({ ok:false,error:"Contact was not found." },{status:404});
    clearReadCache();
    return NextResponse.json({ ok:true });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 });
  try {
    const input = mapInput(await request.json() as ContactInput);
    const affected = await queryWrite(`INSERT INTO tblPullDownUnemploymentRequestContacts
      (PullDownUnemploymentRequestCompany,PullDownUnemploymentRequestContactFName,PullDownUnemploymentRequestContactLName,
       PullDownUnemploymentRequestContactStreet,PullDownUnemploymentRequestContactCity,PullDownUnemploymentRequestContactStateID,
       PullDownUnemploymentRequestContactZip,PullDownUnemploymentRequestContactPhone,PullDownUnemploymentRequestContactFax,
       PullDownUnemploymentRequestContactEmail,PullDownUnemploymentRequestContactSort,PullDownUnemploymentRequestContactNotes,
       PullDownUnemploymentRequestContactActive)
      VALUES (@company,@first,@last,@street,@city,@stateId,@zip,@phone,@fax,@email,@sort,@notes,@active)`, [
      { name:"company", value:input.company }, { name:"first", value:input.first }, { name:"last", value:input.last },
      { name:"street", value:input.street }, { name:"city", value:input.city }, { name:"stateId", value:input.stateId },
      { name:"zip", value:input.zip }, { name:"phone", value:input.phone }, { name:"fax", value:input.fax },
      { name:"email", value:input.email }, { name:"sort", value:input.sort }, { name:"notes", value:input.notes },
      { name:"active", value:input.active },
    ]);
    if (!affected) throw new Error("The database did not insert the contact.");
    clearReadCache();
    return NextResponse.json({ ok:true });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 });
  try {
    const body = await request.json() as { id?: unknown };
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok:false,error:"A valid contact ID is required." },{status:400});
    const affected = await queryWrite(`DELETE FROM tblPullDownUnemploymentRequestContacts WHERE PullDownUnemploymentRequestContactID=@id`,[{name:"id",value:id}]);
    if (!affected) return NextResponse.json({ok:false,error:"Contact was not found."},{status:404});
    clearReadCache();
    return NextResponse.json({ok:true});
  } catch(error) { return failure(error); }
}
