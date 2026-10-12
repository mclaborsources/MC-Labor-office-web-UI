import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

export type CertificateRequestRange = "recent" | "last2" | "all";

/** Certificate request fields and row grouping follow tblCustomerInsuranceCertReqs and its Access search form. */
export function getInsuranceCertificateRequestRows(range: CertificateRequestRange): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`WITH requests AS (
    SELECT r.CustomerInsuranceCertReqID,r.CustomerID,c.CustBusName,
      ISNULL(r.CustomerInsuranceCertReqRequestedBy,'') AS RequestedBy,
      r.CustomerInsuranceCertReqTimestamp AS RequestTimestamp,
      CONVERT(VARCHAR(10),r.CustomerInsuranceCertReqTimestamp,101) AS RequestDate,
      ISNULL(state.PullDownState,'') AS StateName,
      r.CustomerInsuranceCertReqAuditDateRange AS AuditDateRange,
      r.CustomerInsuranceCertReqAuditDateStart AS AuditStartDate,
      r.CustomerInsuranceCertReqAuditDateEnd AS AuditEndDate,
      r.CustomerInsuranceCertReqGeneralLiability AS GeneralLiability,
      r.CustomerInsuranceCertReqUmbrellaLiability AS UmbrellaLiability,
      r.CustomerInsuranceCertReqAutoInsurance AS AutoInsurance,
      r.CustomerInsuranceCertReqWaiverOfSubrogationGL AS WaiverOfSubrogationGL,
      r.CustomerInsuranceCertReqCustomerInsured AS CustomerInsured,
      r.CustomerInsuranceCertReqOthersInsured AS OthersInsured,
      r.CustomerInsuranceCertReqAdditionalVerbiage AS AdditionalVerbiage,
      r.CustomerInsuranceCertReqWorkersComp AS WorkersComp,
      ROW_NUMBER() OVER(PARTITION BY r.CustomerID ORDER BY r.CustomerInsuranceCertReqTimestamp DESC,r.CustomerInsuranceCertReqID DESC) AS RequestRank
    FROM tblCustomerInsuranceCertReqs r WITH (NOLOCK)
    JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=r.CustomerID
    LEFT JOIN tblPullDownStates state WITH (NOLOCK) ON state.PullDownStateID=r.CustomerInsuranceCertReqStateID
  )
  SELECT CAST(CustomerInsuranceCertReqID AS NVARCHAR(20)) AS id,
    ISNULL(CustBusName,'') AS Customer,RequestedBy AS [Requested By],RequestDate AS [Cert Request Date],
    StateName AS State,AuditDateRange AS [Audit Date Range],AuditStartDate AS [Audit Start Date],
    AuditEndDate AS [Audit End Date],GeneralLiability AS [General Liability],
    UmbrellaLiability AS [GL Umbrella],AutoInsurance AS [GL Auto],
    WaiverOfSubrogationGL AS [GL Waiver of Sub],CustomerInsured AS [GL Cust Add Ins],
    OthersInsured AS [GL Add Others],AdditionalVerbiage AS [GL Add Verbiage],WorkersComp AS [Workers Comp]
  FROM requests
  WHERE @range='all' OR (@range='last2' AND RequestRank<=2) OR (@range='recent' AND RequestRank=1)
  ORDER BY Customer,RequestTimestamp DESC,CustomerInsuranceCertReqID DESC`, [{ name: "range", value: range }]);
}
