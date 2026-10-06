import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";
const CONTRACT_COLUMNS = ["ContractSalesmanID", "CustContractSalesmanID", "CustomerContractSalesmanID"] as const;
type ColumnResult = { COLUMN_NAME: string };
async function contractColumn() {
  const rows = await queryReadOnly<ColumnResult>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tblCustomer' AND COLUMN_NAME IN ('ContractSalesmanID','CustContractSalesmanID','CustomerContractSalesmanID')`,
  );
  return CONTRACT_COLUMNS.find(name => rows.some(row => row.COLUMN_NAME === name)) ?? null;
}
async function admin() {
  const session = await requireSession();
  if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required.");
  return session;
}

export async function GET(request: Request) {
  try {
    await admin();
    const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
    const column = await contractColumn();
    const contractSelect = column ? `c.[${column}]` : "CAST(NULL AS INT)";
    const [rows, salesmen] = await Promise.all([
      queryReadOnly<{ id: number; customer: string; contractSalesmanId: number | null; salesmanId: number | null }>(
        `SELECT TOP (2000) c.CustomerID id, ISNULL(c.CustBusName,'') customer, ${contractSelect} contractSalesmanId, c.SalesmanID salesmanId FROM tblCustomer c WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(c.CustBusName,''))))>0 AND (@search='' OR c.CustBusName LIKE @pattern) ORDER BY c.CustBusName`,
        [{ name: "search", value: search }, { name: "pattern", value: `%${search}%` }],
      ),
      queryReadOnly<{ id: number; label: string }>(`SELECT PullDownSalesmanID id, LTRIM(RTRIM(CONCAT(ISNULL(PullDownSalesmanFName,''),' ',ISNULL(PullDownSalesmanLName,'')))) label FROM tblPullDownSalesman WITH (NOLOCK) ORDER BY PullDownSalesmanFName,PullDownSalesmanLName`),
    ]);
    return NextResponse.json({ ok: true, rows, salesmen, contractFieldAvailable: Boolean(column), total: rows.length, limited: rows.length === 2000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the salesman report.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Administrator") ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    await admin();
    const body = await request.json() as { customerId?: unknown; contractSalesmanId?: unknown; salesmanId?: unknown };
    const customerId = Number(body.customerId);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) throw new Error("Select a valid customer.");
    const column = await contractColumn();
    const optionalId = (value: unknown, name: string) => {
      if (value === null || value === "") return null;
      const id = Number(value);
      if (!Number.isSafeInteger(id) || id < 0) throw new Error(`Choose a valid ${name}.`);
      return id;
    };
    const contractSalesmanId = optionalId(body.contractSalesmanId, "Contract Salesman");
    const salesmanId = optionalId(body.salesmanId, "Salesman");
    const masterOptions = await queryReadOnly<{ id: number }>(`SELECT PullDownSalesmanID id FROM tblPullDownSalesman WITH (NOLOCK)`);
    const allowed = new Set(masterOptions.map(option => Number(option.id)));
    for (const id of [contractSalesmanId, salesmanId]) if (id !== null && !allowed.has(id)) throw new Error("The selected salesman is no longer available. Refresh and try again.");
    await withTransaction(async run => {
      const result = column
        ? await run(`UPDATE tblCustomer SET [${column}]=@contractSalesmanId, SalesmanID=@salesmanId WHERE CustomerID=@customerId`, [
            { name: "contractSalesmanId", value: contractSalesmanId }, { name: "salesmanId", value: salesmanId }, { name: "customerId", value: customerId },
          ])
        : await run(`UPDATE tblCustomer SET SalesmanID=@salesmanId WHERE CustomerID=@customerId`, [
            { name: "salesmanId", value: salesmanId }, { name: "customerId", value: customerId },
          ]);
      if (!result.rowsAffected.some(count => count > 0)) throw new Error("Customer not found; no changes were saved.");
    });
    clearReadCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the salesman fields.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Administrator") ? 403 : message.includes("required") || message.includes("valid") ? 400 : 500 });
  }
}
