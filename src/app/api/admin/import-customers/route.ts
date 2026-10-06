import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache, queryReadOnly } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";

type ImportRow = Record<string, unknown>;
type Lookup = { id: number; label: string };
type Contact = { firstName: string; lastName: string; titleId: number | null; email: string; cell: string };
type Prepared = { name: string; street: string; city: string; state: string; zip: string; phone: string; fax: string; website: string; contacts: Contact[] };
const str = (value: unknown) => String(value ?? "").trim();
const key = (value: string) => value.trim().toLocaleLowerCase("en-US");

async function getLookups() {
  const [titles, states, cities] = await Promise.all([
    queryReadOnly<Lookup>(`SELECT PullDownCustomerContactTitleID id, ISNULL(PullDownCustomerContactTitle,'') label FROM tblPullDownCustomerContactTitles WITH (NOLOCK) ORDER BY PullDownCustomerContactTitle`),
    queryReadOnly<Lookup>(`SELECT PullDownStateID id, ISNULL(PullDownState,'') label FROM tblPullDownStates WITH (NOLOCK) ORDER BY PullDownState`),
    queryReadOnly<{ id: number; stateId: number; city: string }>(`SELECT PullDownStateCityID id, StateID stateId, ISNULL(City,'') city FROM tblPullDownStateCities WITH (NOLOCK) ORDER BY City`),
  ]);
  return { titles, states, cities };
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.user?.roles.includes("admin")) return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 });
    const lists = await getLookups();
    const stateById = new Map(lists.states.map(item => [String(item.id), item.label]));
    const cities = lists.cities.map(item => ({ value: String(item.id), label: `${item.city}, ${stateById.get(String(item.stateId)) ?? ""}` }));
    return NextResponse.json({ ok: true, titles: lists.titles.map(item => ({ value: String(item.id), label: item.label })), states: lists.states.map(item => ({ value: String(item.id), label: item.label })), cities });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to load customer lists." }, { status: 500 }); }
}

async function prepare(rows: ImportRow[]) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) throw new Error("Choose a file with 1 to 500 customer rows.");
  const [lists, existing] = await Promise.all([
    getLookups(),
    queryReadOnly<{ name: string }>(`SELECT ISNULL(CustBusName,'') name FROM tblCustomer WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(CustBusName,''))))>0`),
  ]);
  const titles = new Map(lists.titles.map(item => [key(item.label), Number(item.id)]));
  const states = new Map(lists.states.map(item => [key(item.label), Number(item.id)]));
  const existingNames = new Set(existing.map(item => key(item.name)));
  const names = new Set<string>();
  const errors = rows.map(() => [] as string[]);
  const prepared: Prepared[] = [];
  for (const [index, row] of rows.entries()) {
    const name = str(row.customerName), city = str(row.mailCity), state = str(row.mailState);
    if (!name) errors[index].push("Missing Customer Name");
    const normalized = key(name);
    if (normalized && existingNames.has(normalized)) errors[index].push("Customer name already exists in database.");
    if (normalized && names.has(normalized)) errors[index].push("Customer name is repeated in this import.");
    if (normalized) names.add(normalized);
    if ((city && !state) || (!city && state)) errors[index].push("Mailing City and State must both be provided.");
    if (state && !states.has(key(state))) errors[index].push(`Unknown State: ${state}`);
    if (city && state && !lists.cities.some(item => key(item.city) === key(city) && item.stateId === states.get(key(state)))) errors[index].push(`Unknown City/State: ${city}, ${state}`);
    const contacts: Contact[] = [];
    for (const suffix of ["1", "2", "3"]) {
      const firstName = str(row[`contactFirstName${suffix}`]), lastName = str(row[`contactLastName${suffix}`]);
      const title = str(row[`contactTitle${suffix}`]);
      if (title && !titles.has(key(title))) errors[index].push(`Unknown Contact Title: ${title}`);
      if ((firstName || lastName) && (!firstName || !lastName)) errors[index].push(`Contact ${suffix} needs both first and last name.`);
      if (firstName && lastName) contacts.push({ firstName, lastName, titleId: title ? titles.get(key(title)) ?? null : null, email: str(row[`contactEmail${suffix}`]), cell: str(row[`contactCell${suffix}`]) });
    }
    prepared.push({ name, street: str(row.mailStreet), city, state, zip: str(row.mailZip), phone: str(row.phone), fax: str(row.fax), website: str(row.website), contacts });
  }
  return { prepared, errors };
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  let session;
  try { session = await requireSession(); if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required."); }
  catch { return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 }); }
  try {
    const body = await request.json() as { action?: string; rows?: ImportRow[] };
    if (!Array.isArray(body.rows)) throw new Error("Import rows are missing.");
    const { prepared, errors } = await prepare(body.rows);
    const statuses = errors.map((items, index) => ({ row: index + 1, status: items.length ? items.join("; ") : "OK to import" }));
    if (body.action === "check") return NextResponse.json({ ok: true, statuses });
    if (body.action !== "import") throw new Error("Choose Analyze before Import.");
    if (errors.some(items => items.length)) return NextResponse.json({ ok: false, statuses, error: "Some rows have problems. Correct them before importing." }, { status: 422 });
    const userName = str(session.user?.username || session.user?.displayName).slice(0, 80);
    const imported = await withTransaction(async run => {
      const ids: number[] = [];
      for (const row of prepared) {
        const inserted = await run(`INSERT INTO tblCustomer
          (CustBusName, Phone, CustFaxNum, CustWebSiteHLink, MailStreet, MailCity, MailState, MailZip, CustEntryUserName, CustEntryTimestamp)
          OUTPUT INSERTED.CustomerID AS id
          VALUES(@name,@phone,@fax,@website,@street,@city,@state,@zip,@userName,GETDATE())`, [
          { name: "name", value: row.name }, { name: "phone", value: row.phone || null }, { name: "fax", value: row.fax || null },
          { name: "website", value: row.website || null }, { name: "street", value: row.street || null }, { name: "city", value: row.city || null },
          { name: "state", value: row.state || null }, { name: "zip", value: row.zip || null }, { name: "userName", value: userName },
        ]);
        const customerId = Number((inserted.recordset?.[0] as { id?: number } | undefined)?.id ?? 0);
        if (!customerId) throw new Error(`Customer ${row.name} was not created.`);
        for (const contact of row.contacts) await run(`INSERT INTO tblCustomerContacts
          (CustomerID, CustomerContactFName, CustomerContactLName, CustomerContactTitleID, CustomerContactEmail, CustomerContactCell)
          VALUES(@customerId,@firstName,@lastName,@titleId,@email,@cell)`, [
          { name: "customerId", value: customerId }, { name: "firstName", value: contact.firstName }, { name: "lastName", value: contact.lastName },
          { name: "titleId", value: contact.titleId }, { name: "email", value: contact.email || null }, { name: "cell", value: contact.cell || null },
        ]);
        ids.push(customerId);
      }
      return ids;
    });
    clearReadCache();
    return NextResponse.json({ ok: true, imported: imported.length, customerIds: imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer import failed.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Write operations are disabled") ? 503 : message.includes("required") ? 400 : 500 });
  }
}
