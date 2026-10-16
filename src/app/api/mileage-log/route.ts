import { NextResponse } from "next/server";
import { getSessionOrDefault } from "@/lib/auth/session";
import { clearReadCache } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";
import { getMileageLogData } from "@/lib/mileageLog";

const validDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
const text = (value: unknown, label: string, max = 255) => { const result = String(value ?? "").trim(); if (result.length > max) throw new Error(`${label} must be ${max} characters or fewer.`); return result; };
const numeric = (value: unknown, label: string, optional = true): number | null => { if (value === "" || value == null) { if (optional) return null; throw new Error(`${label} is required.`); } const result = Number(value); if (!Number.isFinite(result) || result < 0) throw new Error(`${label} must be a non-negative number.`); return result; };

export async function GET(request: Request) {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const url = new URL(request.url); const salesmanId = Number(url.searchParams.get("salesmanId")); const weekEnding = url.searchParams.get("weekEnding") ?? "";
  if (!Number.isSafeInteger(salesmanId) || salesmanId <= 0 || !validDate(weekEnding)) return NextResponse.json({ error: "Choose a salesman and valid week ending date." }, { status: 400 });
  try { return NextResponse.json(await getMileageLogData(salesmanId, weekEnding)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load mileage log." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>; const action = String(body.action ?? "");
    const salesmanId = Number(body.salesmanId); const weekEnding = String(body.weekEnding ?? "");
    if (!Number.isSafeInteger(salesmanId) || salesmanId <= 0 || !validDate(weekEnding)) throw new Error("Choose a salesman and valid week ending date.");
    await withTransaction(async run => {
      if (action === "move") {
        const id = Number(body.id); const direction = body.direction === "up" ? -1 : body.direction === "down" ? 1 : 0;
        if (!Number.isSafeInteger(id) || id <= 0 || !direction) throw new Error("Choose a mileage entry and move direction.");
        const result = await run(`SELECT MileageLogID id,ISNULL(MileageLogSort,0) sort FROM dbo.tblMileageLog WITH (UPDLOCK,HOLDLOCK) WHERE MileageLogSalesmanID=@salesmanId AND CAST(MileageLogWeekEndingDate AS date)=@weekEnding ORDER BY MileageLogSort,MileageLogID`,[{name:"salesmanId",value:salesmanId},{name:"weekEnding",value:weekEnding}]);
        const rows=result.recordset as {id:number;sort:number}[]; const index=rows.findIndex(row=>Number(row.id)===id); const target=index+direction;
        if(index<0)throw new Error("Mileage entry not found.");
        if(target>=0&&target<rows.length){const [row]=rows.splice(index,1);rows.splice(target,0,row);for(let i=0;i<rows.length;i++)await run(`UPDATE dbo.tblMileageLog SET MileageLogSort=@sort WHERE MileageLogID=@id`,[{name:"sort",value:i+1},{name:"id",value:rows[i].id}]);}
        return;
      }
      if (action === "delete") {
        const id = Number(body.id); if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Select a mileage entry to delete.");
        const result = await run(`DELETE FROM dbo.tblMileageLog WHERE MileageLogID=@id AND MileageLogSalesmanID=@salesmanId AND CAST(MileageLogWeekEndingDate AS date)=@weekEnding`, [{name:"id",value:id},{name:"salesmanId",value:salesmanId},{name:"weekEnding",value:weekEnding}]);
        if (!result.rowsAffected[0]) throw new Error("Mileage entry not found."); return;
      }
      if (action !== "save") throw new Error("Unsupported mileage action.");
      const travelDate = String(body.travelDate ?? ""); if (!validDate(travelDate)) throw new Error("Enter a valid travel date.");
      const odometerStart = numeric(body.odometerStart,"Odometer start"); const odometerFinish = numeric(body.odometerFinish,"Odometer finish");
      if (odometerStart !== null && odometerFinish !== null && odometerFinish < odometerStart) throw new Error("Odometer finish cannot be less than odometer start.");
      const miles = odometerStart !== null && odometerFinish !== null ? odometerFinish - odometerStart : numeric(body.miles,"Miles");
      const rate = numeric(body.ratePerMile,"Rate per mile"); const total = miles !== null && rate !== null ? Math.round(miles * rate * 100) / 100 : numeric(body.totalDue,"Total due");
      const fields = [
        {name:"salesmanId",value:salesmanId},{name:"weekEnding",value:weekEnding},{name:"travelDate",value:travelDate},
        {name:"startTime",value:text(body.startTime,"Start time",30) || null},{name:"endTime",value:text(body.endTime,"End time",30) || null},
        {name:"description",value:text(body.description,"Description",255) || null},{name:"purpose",value:text(body.purpose,"Purpose",100) || null},
        {name:"from",value:text(body.from,"From",255) || null},{name:"to",value:text(body.to,"To",255) || null},
        {name:"odometerStart",value:odometerStart},{name:"odometerFinish",value:odometerFinish},{name:"miles",value:miles},{name:"rate",value:rate},{name:"total",value:total},
      ];
      const id = Number(body.id);
      if (Number.isSafeInteger(id) && id > 0) {
        const result = await run(`UPDATE dbo.tblMileageLog SET MileageLogSalesmanID=@salesmanId,MileageLogWeekEndingDate=@weekEnding,MileageLogTravelDate=@travelDate,MileageLogStartTime=@startTime,MileageLogEndTime=@endTime,MileageLogDescription=@description,MileageLogPurpose=@purpose,MileageLogFrom=@from,MileageLogTo=@to,MileageLogOdometerStart=@odometerStart,MileageLogOdometerFinish=@odometerFinish,MileageLogMiles=@miles,MileageLogMileageRate=@rate,MileageLogTotalDue=@total WHERE MileageLogID=@id`, [...fields,{name:"id",value:id}]);
        if (!result.rowsAffected[0]) throw new Error("Mileage entry not found.");
      } else {
        const username = session.user?.username ?? "";
        const maxSort = await run(`SELECT ISNULL(MAX(MileageLogSort),0)+1 nextSort FROM dbo.tblMileageLog WITH (UPDLOCK,HOLDLOCK) WHERE MileageLogSalesmanID=@salesmanId AND CAST(MileageLogWeekEndingDate AS date)=@weekEnding`,[{name:"salesmanId",value:salesmanId},{name:"weekEnding",value:weekEnding}]);
        await run(`INSERT INTO dbo.tblMileageLog(MileageLogUserName,MileageLogTimestamp,MileageLogSalesmanID,MileageLogWeekEndingDate,MileageLogTravelDate,MileageLogStartTime,MileageLogEndTime,MileageLogDescription,MileageLogPurpose,MileageLogFrom,MileageLogTo,MileageLogOdometerStart,MileageLogOdometerFinish,MileageLogMiles,MileageLogMileageRate,MileageLogTotalDue,MileageLogSort) VALUES(@username,SYSDATETIME(),@salesmanId,@weekEnding,@travelDate,@startTime,@endTime,@description,@purpose,@from,@to,@odometerStart,@odometerFinish,@miles,@rate,@total,@sort)`,[...fields,{name:"username",value:username},{name:"sort",value:Number((maxSort.recordset[0] as {nextSort:number}).nextSort)}]);
      }
    });
    clearReadCache(); return NextResponse.json(await getMileageLogData(salesmanId,weekEnding));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save mileage entry." }, { status: 400 }); }
}
