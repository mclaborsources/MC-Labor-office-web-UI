import { duplicateSpec } from "./customerDuplicateFilter";
/** SQL fragments use only the fixed field map; dropdown text never becomes SQL. */
export function customerDuplicateSql(choice:string) {
  const spec=duplicateSpec(choice);if(!spec)return null;
  const columns:Record<string,string>={customerName:"c.CustBusName",street:"c.Street",city:"c.City",state:"c.State",phone:"c.Phone",ctcFirst:"dc.CustomerContactFName",ctcLast:"dc.CustomerContactLName",ctcEmail:"dc.CustomerContactEmail",ctcCell:"dc.CustomerContactCell"};
  const parts=spec.fields.map(field=>{
    const expression=`LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(1000),${columns[field]}))))`;
    return ["phone","ctcCell","ctcEmail"].includes(field)?expression:`REPLACE(${expression},' ','')`;
  });
  return {
    source:`DuplicateCandidates AS (
  SELECT c.*,CONCAT(${parts.join(",NCHAR(31),")}${parts.length===1?",N''":""}) AS DuplicateValue,
    ${spec.withLastWeek?"CASE WHEN EXISTS(SELECT 1 FROM tblCustomerWeeks dw WITH(NOLOCK) WHERE dw.CustomerID=c.CustomerID AND dw.WeekEndingDate IS NOT NULL) THEN 1 ELSE 0 END":"0"} AS DuplicateHasWeek
  FROM EligibleCustomers c
  ${spec.fields.some(field=>field.startsWith("ctc"))?"OUTER APPLY (SELECT TOP(1) * FROM tblCustomerContacts cc WITH(NOLOCK) WHERE cc.CustomerID=c.CustomerID ORDER BY cc.CustomerContactSort,cc.CustomerContactID) dc":""}
  WHERE ${parts.map(part=>`${part} IS NOT NULL AND ${part}<>N''`).join(" AND ")}
),
DuplicateCounts AS (
  SELECT *,COUNT_BIG(*) OVER(PARTITION BY DuplicateValue) AS DuplicateCount,MAX(DuplicateHasWeek) OVER(PARTITION BY DuplicateValue) AS DuplicateGroupHasWeek FROM DuplicateCandidates
),
DuplicateFiltered AS (
  SELECT * FROM DuplicateCounts WHERE DuplicateCount${spec.backwards?"=1":">1"}${spec.withLastWeek?" AND DuplicateGroupHasWeek=1":""}
),\n`,
    sourceName:"DuplicateFiltered",
  };
}
