import { queryReadOnly } from "@/lib/db/sql";

export interface MileageSalesman { id: number; name: string }
export interface MileageEntry {
  id: number; userName: string; timestamp: string; salesmanId: number; weekEnding: string;
  travelDate: string; startTime: string; endTime: string; description: string; purpose: string;
  from: string; to: string; odometerStart: number | null; odometerFinish: number | null;
  miles: number | null; ratePerMile: number | null; totalDue: number | null; sort: number;
}
const dateOnly = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : "";

export function getMileageSalesmen() {
  return queryReadOnly<MileageSalesman>(`SELECT PullDownSalesmanID id,LTRIM(RTRIM(CONCAT(ISNULL(PullDownSalesmanFName,''),' ',ISNULL(PullDownSalesmanLName,'')))) name FROM dbo.tblPullDownSalesman WITH (NOLOCK) ORDER BY PullDownSalesmanLName,PullDownSalesmanFName`);
}

export async function getMileageLogData(salesmanId: number, weekEnding: string) {
  const [salesmen, entries] = await Promise.all([
    getMileageSalesmen(),
    queryReadOnly<Omit<MileageEntry,"travelDate"|"weekEnding"> & { travelDate: unknown; weekEnding: unknown }>(
      `SELECT MileageLogID id,ISNULL(MileageLogUserName,'') userName,MileageLogTimestamp timestamp,ISNULL(MileageLogSalesmanID,0) salesmanId,MileageLogWeekEndingDate weekEnding,MileageLogTravelDate travelDate,ISNULL(MileageLogStartTime,'') startTime,ISNULL(MileageLogEndTime,'') endTime,ISNULL(MileageLogDescription,'') description,ISNULL(MileageLogPurpose,'') purpose,ISNULL(MileageLogFrom,'') [from],ISNULL(MileageLogTo,'') [to],MileageLogOdometerStart odometerStart,MileageLogOdometerFinish odometerFinish,MileageLogMiles miles,MileageLogMileageRate ratePerMile,MileageLogTotalDue totalDue,ISNULL(MileageLogSort,0) sort FROM dbo.tblMileageLog WITH (NOLOCK) WHERE MileageLogSalesmanID=@salesmanId AND CAST(MileageLogWeekEndingDate AS date)=@weekEnding ORDER BY MileageLogSort,MileageLogID`,
      [{name:"salesmanId",value:salesmanId},{name:"weekEnding",value:weekEnding}],
    ),
  ]);
  return { salesmen, entries: entries.map(row => ({ ...row, travelDate: dateOnly(row.travelDate), weekEnding: dateOnly(row.weekEnding), timestamp: row.timestamp ? new Date(row.timestamp as unknown as string).toISOString() : "" })) };
}
