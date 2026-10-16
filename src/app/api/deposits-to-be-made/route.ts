import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { clearReadCache } from "@/lib/db/sql";
import { queryWrite } from "@/lib/db/write";
import { getDepositsToBeMadeData, searchDepositCustomers } from "@/lib/depositsToBeMade";

export async function GET(request: Request) {
  try {
    await requireSession();
    const url = new URL(request.url);
    const customerSearch = url.searchParams.get("customerSearch");
    if (customerSearch !== null) return NextResponse.json({ ok: true, customers: await searchDepositCustomers(customerSearch) });
    return NextResponse.json({ ok: true, ...(await getDepositsToBeMadeData()) });
  } catch (cause) {
    return NextResponse.json({ ok: false, error: cause instanceof Error ? cause.message : "Unable to load payments awaiting deposit." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json() as { customerId?: unknown; date?: unknown; typeId?: unknown; checkNumber?: unknown; payment?: unknown };
    const customerId = Number(body.customerId); const typeId = Number(body.typeId);
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const checkNumber = typeof body.checkNumber === "string" ? body.checkNumber.trim().slice(0, 100) : "";
    const payment = Number(body.payment);
    if (!Number.isSafeInteger(customerId) || customerId <= 0 || !Number.isSafeInteger(typeId) || typeId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(payment) || payment <= 0) {
      return NextResponse.json({ ok: false, error: "Select a customer and payment type, enter a valid date and payment amount." }, { status: 400 });
    }
    const user = session.user?.displayName || session.user?.username || "Web User";
    const affected = await queryWrite(`INSERT INTO dbo.tblCustomerPayments
      (CustomerID,CustomerPayment,CustomerPaymentDate,CustomerPaymentCheckNum,CustomerPaymentTypeID,CustomerPaymentApplied,CustomerPaymentBalance,DepositID,CustomerPaymentUserName,CustomerPaymentTimestamp)
      SELECT @customerId,@payment,CONVERT(datetime2,@date,23),@checkNumber,@typeId,0,@payment,NULL,@user,GETDATE()
      WHERE EXISTS (SELECT 1 FROM dbo.tblCustomer WHERE CustomerID=@customerId)
        AND EXISTS (SELECT 1 FROM dbo.tblPullDownCustomerPaymentTypes WHERE PullDownCustomerPaymentTypeID=@typeId AND ISNULL(PullDownCustomerPaymentTypeActive,1)=1)`, [
      { name: "customerId", value: customerId }, { name: "payment", value: payment }, { name: "date", value: date },
      { name: "checkNumber", value: checkNumber }, { name: "typeId", value: typeId }, { name: "user", value: user },
    ]);
    if (!affected) return NextResponse.json({ ok: false, error: "The selected customer or payment type is no longer available." }, { status: 400 });
    clearReadCache();
    return NextResponse.json({ ok: true });
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Unable to save the payment.";
    return NextResponse.json({ ok: false, error }, { status: error.includes("Write operations are disabled") ? 503 : 400 });
  }
}
