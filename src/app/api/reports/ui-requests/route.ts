import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllUnemploymentRequestContactRows, getAllUnemploymentRequestRows, getUnemploymentContactFaxColumn, getUnemploymentContactStates, getUnemploymentRequestDropdownRows } from "@/lib/adminDropdownReports";
import { clearReadCache } from "@/lib/db/sql";
import { queryWrite } from "@/lib/db/write";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RequestInput = {
  id?: unknown; date?: unknown; employee?: unknown; lastDay?: unknown; customer?: unknown; trade?: unknown;
  reason?: unknown; reasonCont?: unknown; reasonDate?: unknown; contract?: unknown; notes?: unknown;
};
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function mapInput(raw: RequestInput) {
  const input = {
    date: clean(raw.date, 10), employee: clean(raw.employee, 200), lastDay: clean(raw.lastDay, 10),
    customer: clean(raw.customer, 200), trade: clean(raw.trade, 100), reason: clean(raw.reason, 200),
    reasonCont: clean(raw.reasonCont, 200), reasonDate: clean(raw.reasonDate, 10), contract: clean(raw.contract, 200),
    notes: clean(raw.notes, 4000),
  };
  for (const [label, date] of [["Date", input.date], ["Last Day of Work", input.lastDay], ["Reason Cont Date", input.reasonDate]]) {
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${label} must be a valid date.`);
  }
  if (!input.employee) throw new Error("Employee is required.");
  return input;
}
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to save unemployment request.";
  const status = message.includes("Write operations are disabled") ? 503 : message.includes("required") || message.includes("valid date") || message.includes("Employee not found") ? 400 : 500;
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ ok: false, data: [], contacts: [], error: "Sign in required." }, { status: 403 });
  }
  try {
    const data = await getAllUnemploymentRequestRows();
    let contacts: Awaited<ReturnType<typeof getAllUnemploymentRequestContactRows>> = [];
    let contactsError = "";
    try {
      contacts = await getAllUnemploymentRequestContactRows();
    } catch (error) {
      contactsError = error instanceof Error ? error.message : "Contact list query failed.";
      console.error("[api/reports/ui-requests] Failed to load contacts:", error);
    }
    const dropdowns = await getUnemploymentRequestDropdownRows();
    let states: Awaited<ReturnType<typeof getUnemploymentContactStates>> = [];
    let statesError = "";
    try { states = await getUnemploymentContactStates(); }
    catch (error) { statesError = error instanceof Error ? error.message : "State list query failed."; }
    const faxColumn=await getUnemploymentContactFaxColumn();
    return NextResponse.json({ ok: true, data, contacts, contactsError, dropdowns, states, statesError, faxSupported:Boolean(faxColumn) });
  } catch (error) {
    console.error("[api/reports/ui-requests] Failed to load report rows:", error);
    const detail = error instanceof Error ? error.message : "Unknown database error.";
    return NextResponse.json({ ok: false, data: [], error: `Unable to load unemployment requests: ${detail}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 }); }
  try {
    const input = mapInput(await request.json() as RequestInput);
    const affected = await queryWrite(`
      IF NOT EXISTS (SELECT 1 FROM tblEmployee e WHERE LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))=@employee)
        OR LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmLastName,'')))=@employee)
      ) BEGIN; THROW 50001, 'Employee not found. Enter the employee name as it appears in the employee list.', 1; END;
      INSERT INTO tblUnemploymentRequests
        (UnemploymentRequestEmployeeID,UnemploymentRequestTimestamp,UnemploymentRequestLastWorkDate,
         UnemploymentRequestLastCustomerID,UnemploymentRequestTradeID,UnemploymentRequestReasonID,
         UnemploymentRequestReasonContID,UnemploymentRequestReasonContDate,
         UnemploymentRequestContractWith_PayrollCoID,UnemploymentRequestNotes,UnemploymentRequestUserName)
      VALUES (
        (SELECT TOP (1) e.EmployeeID FROM tblEmployee e WHERE LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))=@employee
          OR LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmLastName,'')))=@employee
          ORDER BY e.EmployeeID),
        COALESCE(TRY_CONVERT(DATETIME2,@date,23),SYSUTCDATETIME()), TRY_CONVERT(DATE,NULLIF(@lastDay,''),23),
        (SELECT TOP (1) CustomerID FROM tblCustomer WHERE CustBusName=@customer ORDER BY CustomerID),
        (SELECT TOP (1) PullDownTradeID FROM tblPullDownTrade WHERE PullDownTrade=@trade ORDER BY PullDownTradeID),
        (SELECT TOP (1) PullDownUnemploymentRequestReasonID FROM tblPullDownUnemploymentRequestReasons WHERE PullDownUnemploymentRequestReason=@reason ORDER BY PullDownUnemploymentRequestReasonID),
        (SELECT TOP (1) PullDownUnemploymentRequestReasonContID FROM tblPullDownUnemploymentRequestReasonCont WHERE PullDownUnemploymentRequestReasonCont=@reasonCont ORDER BY PullDownUnemploymentRequestReasonContID),
        TRY_CONVERT(DATE,NULLIF(@reasonDate,''),23),
        (SELECT TOP (1) PullDownContractWith_PayrollCoID FROM tblPullDownContractWith_PayrollCo WHERE PullDownContractWith_PayrollCoName=@contract ORDER BY PullDownContractWith_PayrollCoID),
        @notes,@userName);`, requestParams(input, session.user?.username ?? ""));
    if (!affected) throw new Error("The database did not insert the request.");
    clearReadCache();
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  let session;
  try { session = await requireSession(); } catch { return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 }); }
  try {
    const body = await request.json() as RequestInput;
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: "A valid request ID is required." }, { status: 400 });
    const input = mapInput(body);
    const affected = await queryWrite(`
      IF NOT EXISTS (SELECT 1 FROM tblEmployee e WHERE LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))=@employee
        OR LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmLastName,'')))=@employee
      ) BEGIN; THROW 50001, 'Employee not found. Enter the employee name as it appears in the employee list.', 1; END;
      UPDATE tblUnemploymentRequests SET
        UnemploymentRequestEmployeeID=(SELECT TOP (1) e.EmployeeID FROM tblEmployee e WHERE LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))=@employee OR LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmLastName,'')))=@employee ORDER BY e.EmployeeID),
        UnemploymentRequestTimestamp=COALESCE(TRY_CONVERT(DATETIME2,@date,23),UnemploymentRequestTimestamp),
        UnemploymentRequestLastWorkDate=TRY_CONVERT(DATE,NULLIF(@lastDay,''),23),
        UnemploymentRequestLastCustomerID=(SELECT TOP (1) CustomerID FROM tblCustomer WHERE CustBusName=@customer ORDER BY CustomerID),
        UnemploymentRequestTradeID=(SELECT TOP (1) PullDownTradeID FROM tblPullDownTrade WHERE PullDownTrade=@trade ORDER BY PullDownTradeID),
        UnemploymentRequestReasonID=(SELECT TOP (1) PullDownUnemploymentRequestReasonID FROM tblPullDownUnemploymentRequestReasons WHERE PullDownUnemploymentRequestReason=@reason ORDER BY PullDownUnemploymentRequestReasonID),
        UnemploymentRequestReasonContID=(SELECT TOP (1) PullDownUnemploymentRequestReasonContID FROM tblPullDownUnemploymentRequestReasonCont WHERE PullDownUnemploymentRequestReasonCont=@reasonCont ORDER BY PullDownUnemploymentRequestReasonContID),
        UnemploymentRequestReasonContDate=TRY_CONVERT(DATE,NULLIF(@reasonDate,''),23),
        UnemploymentRequestContractWith_PayrollCoID=(SELECT TOP (1) PullDownContractWith_PayrollCoID FROM tblPullDownContractWith_PayrollCo WHERE PullDownContractWith_PayrollCoName=@contract ORDER BY PullDownContractWith_PayrollCoID),
        UnemploymentRequestNotes=@notes, UnemploymentRequestUserName=@userName
      WHERE UnemploymentRequestID=@id;`, [...requestParams(input, session.user?.username ?? ""), { name: "id", value: id }]);
    if (!affected) return NextResponse.json({ ok: false, error: "Request was not found." }, { status: 404 });
    clearReadCache();
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}

function requestParams(input: ReturnType<typeof mapInput>, userName: string) {
  return [
    { name: "date", value: input.date }, { name: "employee", value: input.employee }, { name: "lastDay", value: input.lastDay },
    { name: "customer", value: input.customer }, { name: "trade", value: input.trade }, { name: "reason", value: input.reason },
    { name: "reasonCont", value: input.reasonCont }, { name: "reasonDate", value: input.reasonDate },
    { name: "contract", value: input.contract }, { name: "notes", value: input.notes }, { name: "userName", value: userName },
  ];
}
