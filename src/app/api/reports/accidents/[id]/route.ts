import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly, clearReadCache } from "@/lib/db/sql";
import { queryWrite, withTransaction } from "@/lib/db/write";

export const dynamic = "force-dynamic";
export const accidentWritableFields: Record<string, "text" | "date" | "number" | "boolean"> = {
  EmployeeID:"number", ProjectID:"number", EmployeePayrollCompanyOnSiteID:"number", AssignWeek:"number", AssignYear:"number",
  ProjectAccidentReportPreparedTimestamp:"date", ProjectAccidentReportPreparedByID:"number", ProjectAccidentReportPreparedByTitle:"text",
  ProjectAccidentReportDateOfInjury:"date", ProjectAccidentReportHireDate:"date", ProjectAccidentReportSex:"text", ProjectAccidentReportContractWith_PayrollCoID:"number",
  ProjectAccidentReportGC:"text", ProjectAccidentReportGCPhone:"text", ProjectAccidentReportContact:"text", ProjectAccidentReportContactPhone:"text",
  ProjectAccidentReportTimeOfInjuryAM:"text", ProjectAccidentReportTimeOfInjuryPM:"text", ProjectAccidentReportWasWitness:"text", ProjectAccidentReportWitnessName:"text", ProjectAccidentReportWitnessPhone:"text",
  ProjectAccidentReportInjuryLocation:"text", ProjectAccidentReportWeatherConditions:"text", ProjectAccidentReportSourceOfInjury:"text", ProjectAccidentReportAddressOfInjury:"text", ProjectAccidentReportOnPremises:"text",
  ProjectAccidentReportRegularOccupationID:"number", ProjectAccidentReportRegularOccupationWhenInjured:"text", ProjectAccidentReportInjuryReportedTo:"text", ProjectAccidentReportDateReported:"date",
  ProjectAccidentReportNatureOfInjury:"text", ProjectAccidentReportInjuredBodyPart:"text", ProjectAccidentReportHospitalNameAndAddress:"text", ProjectAccidentReportPhysicianNameAndAddress:"text",
  ProjectAccidentReportHowInjuryOccurred:"text", ProjectAccidentReportHasEmployeeReturnedToWork:"text", ProjectAccidentReportWhyNotReturned:"text", ProjectAccidentReportDateReturned:"date",
  ProjectAccidentReportTotalDaysOutOfWork:"number", ProjectAccidentReportWorkdaysOutOfWork:"number", ProjectAccidentReportReturnedToRegularOccupation:"text", ProjectAccidentReportClaimNumber:"text", ProjectAccidentReportClaimNotes:"text",
  ProjectAccidentReportBenefitsStatusID:"number", ProjectAccidentReportInHouse:"boolean", ProjectAccidentReportPayRate:"number", ProjectAccidentReportTotalCost:"number", ProjectAccidentReportClosedOut:"boolean",
  ProjectAccidentReportReservedAmount:"number", ProjectAccidentReportFutureCall:"date", ProjectAccidentReportInsuranceCompanyID:"number", ProjectAccidentReportClaimsAdjusterID:"number", ProjectAccidentReportHistoryStatusID:"number",
  ProjectAccidentReportOurCost:"number",
};
export function mapAccidentPayload(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Accident report details are required.");
  const body = raw as Record<string, unknown>; const fields = body.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw new Error("Accident report fields are required.");
  const output: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(accidentWritableFields)) {
    if (!(key in (fields as Record<string, unknown>))) continue;
    const value = (fields as Record<string, unknown>)[key];
    if (kind === "text") output[key] = typeof value === "string" ? value.slice(0, key === "ProjectAccidentReportClaimNotes" ? 8000 : 2000) : "";
    else if (kind === "boolean") output[key] = value === true || value === 1 || value === "1";
    else if (kind === "number") { const n = value === "" || value == null ? null : Number(value); if (n !== null && !Number.isFinite(n)) throw new Error(`${key} must be numeric.`); output[key] = n; }
    else { const date = typeof value === "string" ? value.trim() : ""; if (date && !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(date)) throw new Error(`${key} must be a valid date.`); output[key] = date || null; }
  }
  if (!output.EmployeeID || !output.ProjectID) throw new Error("Select an employee and a job before saving.");
  if (!output.ProjectAccidentReportPreparedByID) throw new Error("Select a Prepared By value before saving.");
  if (!output.ProjectAccidentReportDateOfInjury) throw new Error("Enter the date of injury before saving.");
  if (!output.ProjectAccidentReportRegularOccupationID) throw new Error("Select a regular occupation before saving.");
  const injury = String(output.ProjectAccidentReportDateOfInjury).slice(0,10);
  const hire = output.ProjectAccidentReportHireDate ? String(output.ProjectAccidentReportHireDate).slice(0,10) : "";
  const reported = output.ProjectAccidentReportDateReported ? String(output.ProjectAccidentReportDateReported).slice(0,10) : "";
  const returned = output.ProjectAccidentReportDateReturned ? String(output.ProjectAccidentReportDateReturned).slice(0,10) : "";
  if (hire && hire > injury) throw new Error("Date of Hire must be on or before the date of injury.");
  if (reported && reported < injury) throw new Error("Date Reported must be on or after the date of injury.");
  if (returned && returned < injury) throw new Error("Date Returned must be on or after the date of injury.");
  if (output.ProjectAccidentReportTimeOfInjuryAM && output.ProjectAccidentReportTimeOfInjuryPM) throw new Error("Enter an AM time or a PM time, not both.");
  if (output.ProjectAccidentReportWasWitness === "Yes" && !output.ProjectAccidentReportWitnessName) throw new Error("Enter the witness name.");
  if (output.ProjectAccidentReportInjuryLocation === "Outside" && !output.ProjectAccidentReportWeatherConditions) throw new Error("Enter the weather conditions for an outside injury.");
  if (output.ProjectAccidentReportHasEmployeeReturnedToWork === "No" && !output.ProjectAccidentReportWhyNotReturned) throw new Error("Enter why the employee has not returned to work.");
  if (output.ProjectAccidentReportHasEmployeeReturnedToWork === "Yes" && (!returned || !output.ProjectAccidentReportReturnedToRegularOccupation)) throw new Error("Enter the return date and whether the employee returned to their regular occupation.");
  return output;
}
export async function ensureAccidentIsUnique(fields: Record<string, unknown>, ignoreId?: number) {
  const rows = await queryReadOnly<{ id: number }>(`SELECT TOP (1) ProjectAccidentReportID AS id FROM tblProjectAccidentReports WITH (NOLOCK) WHERE EmployeeID=@employeeId AND ProjectID=@projectId AND ProjectAccidentReportDateOfInjury=TRY_CONVERT(DATE,@injury,23) AND ProjectAccidentReportID<>@ignoreId`, [
    { name:"employeeId", value:fields.EmployeeID }, { name:"projectId", value:fields.ProjectID }, { name:"injury", value:fields.ProjectAccidentReportDateOfInjury }, { name:"ignoreId", value:ignoreId ?? -1 },
  ]);
  if (rows.length) throw new Error("This employee already has an accident report for that job and injury date.");
}
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to save accident report.";
  return NextResponse.json({ ok:false,error:message },{status:message.includes("Write operations are disabled")?503:message.includes("required")||message.includes("valid date")||message.includes("numeric")||message.includes("already has")||message.includes("on or")||message.includes("Enter the")?400:500});
}
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireSession(); } catch { return NextResponse.json({ok:false,error:"Sign in required."},{status:403}); }
  const id = Number((await params).id); if (!Number.isInteger(id)||id<=0) return NextResponse.json({ok:false,error:"Invalid accident report ID."},{status:400});
  try { const rows=await queryReadOnly(`SELECT r.* FROM tblProjectAccidentReports r WITH (NOLOCK) WHERE r.ProjectAccidentReportID=@id`,[{name:"id",value:id}]); if(!rows[0])return NextResponse.json({ok:false,error:"Accident report not found."},{status:404}); return NextResponse.json({ok:true,data:rows[0]}); }
  catch(error){return errorResponse(error);}
}
export async function PUT(request: NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireSession();}catch{return NextResponse.json({ok:false,error:"Sign in required."},{status:403});}
  try{const id=Number((await params).id);if(!Number.isInteger(id)||id<=0)throw new Error("Invalid accident report ID.");const fields=mapAccidentPayload(await request.json());await ensureAccidentIsUnique(fields,id);const entries=Object.entries(fields);const affected=await queryWrite(`UPDATE tblProjectAccidentReports SET ${entries.map(([key])=>`[${key}]=@${key}`).join(",")} WHERE ProjectAccidentReportID=@id`,[...entries.map(([name,value])=>({name,value})),{name:"id",value:id}]);if(!affected)return NextResponse.json({ok:false,error:"Accident report was not found."},{status:404});clearReadCache();return NextResponse.json({ok:true});}catch(error){return errorResponse(error);}
}
export async function DELETE(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireSession();}catch{return NextResponse.json({ok:false,error:"Sign in required."},{status:403});}
  try{const id=Number((await params).id);if(!Number.isInteger(id)||id<=0)throw new Error("Invalid accident report ID.");await withTransaction(async run=>{await run(`DELETE FROM tblProjectAccidentReportContactHistory WHERE ProjectAccidentReportID=@id`,[{name:"id",value:id}]);await run(`DELETE FROM tblProjectAccidentReportOurCosts WHERE ProjectAccidentReportID=@id`,[{name:"id",value:id}]);const result=await run(`DELETE FROM tblProjectAccidentReports WHERE ProjectAccidentReportID=@id`,[{name:"id",value:id}]);if(!result.rowsAffected.some(count=>count>0))throw new Error("Accident report was not found.")});clearReadCache();return NextResponse.json({ok:true});}catch(error){return errorResponse(error);}
}
