import { queryReadOnly } from "@/lib/db/sql";

export interface AlertRow {
  id: number;
  typeId: number;
  type: string;
  alert: string;
  entryUser: string;
  entryDate: string;
  completedUser: string;
  completedDate: string;
}

export interface AlertTypeOption { id: number; label: string }

export async function getAlertsData() {
  const [rows, types] = await Promise.all([
    queryReadOnly<AlertRow>(`SELECT a.AlertID id,a.AlertTypeID typeId,ISNULL(t.PullDownAlertType,'') type,
      ISNULL(a.Alert,'') alert,ISNULL(a.AlertUserName,'') entryUser,
      CASE WHEN a.AlertTimestamp IS NULL THEN '' ELSE CONVERT(varchar(10),a.AlertTimestamp,101) END entryDate,
      ISNULL(a.AlertCompletedUserName,'') completedUser,
      CASE WHEN a.AlertCompletedTimestamp IS NULL THEN '' ELSE CONVERT(varchar(10),a.AlertCompletedTimestamp,101) END completedDate
      FROM dbo.tblAlerts a WITH (NOLOCK)
      LEFT JOIN dbo.tblPullDownAlertTypes t WITH (NOLOCK) ON t.PullDownAlertTypeID=a.AlertTypeID
      ORDER BY a.AlertID ASC`),
    queryReadOnly<AlertTypeOption>(`SELECT PullDownAlertTypeID id,PullDownAlertType label
      FROM dbo.tblPullDownAlertTypes WITH (NOLOCK) WHERE ISNULL(PullDownAlertTypeActive,1)=1
      ORDER BY ISNULL(PullDownAlertTypeSort,999999),PullDownAlertType`),
  ]);
  return { rows, types };
}
