import { queryReadOnly } from "@/lib/db/sql";

export interface OfficeStaffLoginRow {
  id: string;
  officeStaff: string;
  loginDate: string;
  day: string;
  loginTime: string;
  lateStart: string;
  loginNote: string;
  logoutTime: string;
  logoutType: string;
  earlyLeave: string;
  logoutNote: string;
  workedHours: number | null;
  workedMinutes: number | null;
  hide: boolean;
}

/** Daily office login view: one row per staff member and calendar date. */
export function getOfficeStaffLoginRows(startDate: string, endDate: string, staffName = "", type: "all" | "logins" | "no-logins" = "all", includeHidden = false) {
  return queryReadOnly<OfficeStaffLoginRow>(`WITH calendar AS (
    SELECT CONVERT(date,@startDate,23) workDate
    UNION ALL
    SELECT DATEADD(day,1,workDate) FROM calendar WHERE workDate<CONVERT(date,@endDate,23)
  ), staff AS (
    SELECT os.OfficeStaffID,
      COALESCE(NULLIF(LTRIM(RTRIM(os.OfficeStaffFullName)),''),LTRIM(RTRIM(CONCAT(ISNULL(os.OfficeStaffFirstName,''),' ',ISNULL(os.OfficeStaffLastName,''))))) OfficeStaff,
      CAST(ISNULL(os.OfficeStaffHideHours,0) AS bit) Hide
    FROM dbo.tblOfficeStaff os WITH (NOLOCK)
    WHERE ISNULL(os.OfficeStaffActive,0)=1 OR EXISTS (
      SELECT 1 FROM dbo.tblOfficeStaffLogin old WITH (NOLOCK)
      WHERE old.OfficeStaffID=os.OfficeStaffID
        AND old.OfficeStaffLoginTimestamp>=CONVERT(date,@startDate,23)
        AND old.OfficeStaffLoginTimestamp<DATEADD(day,1,CONVERT(date,@endDate,23))
    )
  ), daily AS (
    SELECT l.OfficeStaffID,CAST(l.OfficeStaffLoginTimestamp AS date) workDate,
      MIN(l.OfficeStaffLoginTimestamp) loginTimestamp,MAX(l.OfficeStaffLogoutTimestamp) logoutTimestamp,
      MAX(ISNULL(l.OfficeStaffLogoutType,'')) logoutType
    FROM dbo.tblOfficeStaffLogin l WITH (NOLOCK)
    WHERE l.OfficeStaffLoginTimestamp>=CONVERT(date,@startDate,23)
      AND l.OfficeStaffLoginTimestamp<DATEADD(day,1,CONVERT(date,@endDate,23))
    GROUP BY l.OfficeStaffID,CAST(l.OfficeStaffLoginTimestamp AS date)
  ), notes AS (
    SELECT n.OfficeStaffID,CAST(n.OfficeStaffLoginDate AS date) workDate,
      MAX(ISNULL(n.OfficeStaffLoginNoteLogin,'')) loginNote,MAX(ISNULL(n.OfficeStaffLoginNoteLogout,'')) logoutNote
    FROM dbo.tblOfficeStaffLoginNotes n WITH (NOLOCK)
    WHERE n.OfficeStaffLoginDate>=CONVERT(date,@startDate,23)
      AND n.OfficeStaffLoginDate<DATEADD(day,1,CONVERT(date,@endDate,23))
    GROUP BY n.OfficeStaffID,CAST(n.OfficeStaffLoginDate AS date)
  )
  SELECT CONCAT(s.OfficeStaffID,'-',CONVERT(varchar(10),c.workDate,23)) id,s.OfficeStaff [officeStaff],
    CONVERT(varchar(10),c.workDate,23) loginDate,LEFT(DATENAME(weekday,c.workDate),3) [day],
    CASE WHEN d.loginTimestamp IS NULL THEN '' ELSE CONVERT(varchar(8),CAST(d.loginTimestamp AS time),100) END loginTime,
    CAST('' AS varchar(20)) lateStart,ISNULL(n.loginNote,'') loginNote,
    CASE WHEN d.logoutTimestamp IS NULL THEN '' ELSE CONVERT(varchar(8),CAST(d.logoutTimestamp AS time),100) END logoutTime,
    CASE WHEN d.loginTimestamp IS NULL THEN 'N/A' ELSE ISNULL(NULLIF(d.logoutType,''),'N/A') END logoutType,
    CAST('' AS varchar(20)) earlyLeave,ISNULL(n.logoutNote,'') logoutNote,
    CASE WHEN d.loginTimestamp IS NULL OR d.logoutTimestamp IS NULL THEN NULL ELSE CAST(DATEDIFF(minute,d.loginTimestamp,d.logoutTimestamp)/60.0 AS decimal(10,2)) END workedHours,
    CASE WHEN d.loginTimestamp IS NULL OR d.logoutTimestamp IS NULL THEN NULL ELSE DATEDIFF(minute,d.loginTimestamp,d.logoutTimestamp) END workedMinutes,
    s.Hide hide
  FROM staff s CROSS JOIN calendar c
  LEFT JOIN daily d ON d.OfficeStaffID=s.OfficeStaffID AND d.workDate=c.workDate
  LEFT JOIN notes n ON n.OfficeStaffID=s.OfficeStaffID AND n.workDate=c.workDate
  WHERE (@staffName='' OR s.OfficeStaff LIKE @pattern)
    AND (@includeHidden=1 OR s.Hide=0)
    AND (@type='all' OR (@type='logins' AND d.loginTimestamp IS NOT NULL) OR (@type='no-logins' AND d.loginTimestamp IS NULL))
  ORDER BY s.OfficeStaff,c.workDate
  OPTION (MAXRECURSION 100)`, [
    { name: "startDate", value: startDate }, { name: "endDate", value: endDate },
    { name: "staffName", value: staffName.trim() }, { name: "pattern", value: `%${staffName.trim()}%` },
    { name: "type", value: type }, { name: "includeHidden", value: includeHidden ? 1 : 0 },
  ]);
}
