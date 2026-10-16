import { NextResponse } from "next/server";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getStateCityRecords } from "@/lib/stateCities";
import { clearReadCache } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";

export async function GET() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { return NextResponse.json(await getStateCityRecords()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load cities." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { action?: string; id?: number; stateId?: number; city?: string; active?: boolean };
    const action = body.action;
    await withTransaction(async run => {
      if (action === "add") {
        const city = String(body.city ?? "").trim(); const stateId = Number(body.stateId);
        if (!city || city.length > 100 || !Number.isSafeInteger(stateId) || stateId <= 0) throw new Error("Choose a state and enter a city name.");
        const existing = await run(`SELECT PullDownStateCityID FROM dbo.tblPullDownStateCities WITH (UPDLOCK,HOLDLOCK) WHERE StateID=@stateId AND LTRIM(RTRIM(City))=@city`, [{ name: "stateId", value: stateId }, { name: "city", value: city }]);
        if (existing.recordset.length) throw new Error("That city already exists for this state.");
        await run(`INSERT INTO dbo.tblPullDownStateCities(StateID,City,PullDownStateCityActive) VALUES(@stateId,@city,1)`, [{ name: "stateId", value: stateId }, { name: "city", value: city }]);
      } else if (action === "update") {
        const id = Number(body.id); const city = String(body.city ?? "").trim(); const stateId = Number(body.stateId);
        if (!Number.isSafeInteger(id) || id <= 0 || !city || city.length > 100 || !Number.isSafeInteger(stateId) || stateId <= 0) throw new Error("Select a city, state, and valid city name.");
        const result = await run(`UPDATE dbo.tblPullDownStateCities SET StateID=@stateId,City=@city,PullDownStateCityActive=@active WHERE PullDownStateCityID=@id`, [{ name: "stateId", value: stateId }, { name: "city", value: city }, { name: "active", value: body.active === false ? 0 : 1 }, { name: "id", value: id }]);
        if (!result.rowsAffected[0]) throw new Error("City not found.");
      } else throw new Error("Unsupported city action.");
    });
    clearReadCache();
    return NextResponse.json(await getStateCityRecords());
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save city." }, { status: 400 }); }
}
