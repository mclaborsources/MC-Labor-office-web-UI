import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { queryWrite, withTransaction } from "@/lib/db/write";
import { getOpenInvoiceFilterOptions, getOpenInvoiceRows } from "@/lib/operationalReports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    clearReadCache();
    const [rows, filters] = await Promise.all([getOpenInvoiceRows(), getOpenInvoiceFilterOptions()]);
    return NextResponse.json({ ok: true, rows, filters, refreshedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Open invoices could not be refreshed from the office database." }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requireSession();
    await withTransaction(async run => {
      await run("UPDATE tblQBOpenInvoices SET CollectionsNote=NULL WHERE CustBusName IS NOT NULL");
      await run(`;WITH latest_notes AS (
        SELECT CustomerID,CustomerNote,CustomerNoteUserName,CustomerNoteTimestamp,
          ROW_NUMBER() OVER(PARTITION BY CustomerID ORDER BY CustomerNoteID DESC) AS rn
        FROM tblCustomerNotes WHERE CustomerNoteActive=1
      )
      UPDATE q SET CollectionsNote=CONCAT(n.CustomerNote,' ',n.CustomerNoteUserName,' ',
        MONTH(n.CustomerNoteTimestamp),'/',DAY(n.CustomerNoteTimestamp),'/',YEAR(n.CustomerNoteTimestamp))
      FROM tblQBOpenInvoices q INNER JOIN latest_notes n ON n.CustomerID=q.CustomerID AND n.rn=1
      WHERE q.CustBusName IS NOT NULL`);
    });
    clearReadCache();
    const [rows, filters] = await Promise.all([getOpenInvoiceRows(), getOpenInvoiceFilterOptions()]);
    return NextResponse.json({ ok: true, rows, filters, refreshedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to refresh invoice notes.";
    const status = message.includes("Write operations are disabled") ? 503 : message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json() as { id?: unknown; customerId?: unknown; field?: unknown; value?: unknown };
    const id = typeof body.id === "string" && /^\d+$/.test(body.id) ? Number(body.id) : 0;
    const customerId = typeof body.customerId === "string" && /^\d+$/.test(body.customerId) ? Number(body.customerId) : 0;
    const value = typeof body.value === "string" ? body.value.trim().slice(0, 4000) : "";
    if (!id || !customerId || (!value && body.field !== "invoiceNote") || (body.field !== "collectionsNote" && body.field !== "invoiceNote")) {
      return NextResponse.json({ ok: false, error: "A valid invoice, customer, note type, and note are required." }, { status: 400 });
    }

    if (body.field === "invoiceNote") {
      const affected = await queryWrite(`UPDATE tblQBOpenInvoices SET InvoiceNote=@value WHERE QBOpenInvoicesID=@id AND CustomerID=@customerId`, [
        { name: "value", value }, { name: "id", value: id }, { name: "customerId", value: customerId },
      ]);
      if (!affected) return NextResponse.json({ ok: false, error: "The invoice could not be found." }, { status: 404 });
      clearReadCache();
      return NextResponse.json({ ok: true });
    }

    const userName = session.user?.username || session.user?.displayName || "Web User";
    await withTransaction(async run => {
      await run(`INSERT INTO tblCustomerNotes(CustomerID,CustomerNote,CustomerNoteUserName,CustomerNoteTimestamp,CustomerNoteActive)
        VALUES(@customerId,@value,@userName,GETDATE(),1)`, [
        { name: "customerId", value: customerId }, { name: "value", value }, { name: "userName", value: userName },
      ]);
      const updated = await run(`UPDATE tblQBOpenInvoices SET CollectionsNote=CONCAT(@value,' ',@userName,' ',
        MONTH(GETDATE()),'/',DAY(GETDATE()),'/',YEAR(GETDATE()))
        WHERE CustomerID=@customerId AND CustBusName IS NOT NULL`, [
        { name: "value", value }, { name: "userName", value: userName }, { name: "customerId", value: customerId },
      ]);
      if (!updated.rowsAffected.some(count => count > 0)) throw new Error("No matching QuickBooks customer rows were found.");
    });
    clearReadCache();
    const [note] = await queryReadOnly<{ collectionsNote: string }>(`SELECT TOP (1) CollectionsNote AS collectionsNote FROM tblQBOpenInvoices WHERE CustomerID=@customerId AND CustBusName IS NOT NULL ORDER BY QBOpenInvoicesID DESC`, [{ name: "customerId", value: customerId }]);
    return NextResponse.json({ ok: true, collectionsNote: note?.collectionsNote ?? value });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the note.";
    const status = message.includes("Write operations are disabled") ? 503 : message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
