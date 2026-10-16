import { queryReadOnly } from "@/lib/db/sql";

export interface RegularPayrollRow {
  id:string;payrollCo:string;firstName:string;middleInitial:string;lastName:string;weekEnding:string;note:string;
  state:string;trade:string;regularHours:number|null;overtimeHours:number|null;payRate:number|null;grossPay:number;otFlag:string;
}

export interface DetailedPayrollRow extends RegularPayrollRow { customer:string; job:string; }
export interface PayrollCheckNotesRow extends RegularPayrollRow { adjustmentNote:string; checkNote:string; }
export interface PayrollAdjustmentRow {id:number;employeeId:number|null;employee:string;company:string;payrollCo:string;weekEnding:string;amount:number;adjustmentNote:string;officeNote:string;userName:string;timestamp:string}
export interface XcelHrPayrollRow extends RegularPayrollRow {ssn:string;wcc:string;overheadPercent:number|null;xcelHrAmount:number}

export function getRegularPayrollCompanies(){
  return queryReadOnly<{id:number;name:string}>(`SELECT PullDownPayrollCoOnSiteID id,ISNULL(PullDownPayrollCoOnSiteInitials,'') name FROM dbo.tblPullDownPayrollCoOnSite WITH (NOLOCK) WHERE ISNULL(PullDownPayrollCoOnSiteActive,0)<>0 ORDER BY PullDownPayrollCoOnSiteSort,PullDownPayrollCoOnSiteInitials`);
}
export function getPayrollAdjustmentCompanies(){
  return queryReadOnly<{id:number;name:string;code:string}>(`SELECT PullDownPayrollCoOnSiteID id,ISNULL(PullDownPayrollCoOnSiteName,'') name,ISNULL(PullDownPayrollCoOnSiteInitials,'') code FROM dbo.tblPullDownPayrollCoOnSite WITH (NOLOCK) WHERE ISNULL(PullDownPayrollCoOnSiteActive,0)<>0 ORDER BY PullDownPayrollCoOnSiteSort,PullDownPayrollCoOnSiteInitials`);
}

export function getRegularPayrollRows(weekEnding:string,payrollCo:string){
  return queryReadOnly<RegularPayrollRow>(`WITH payroll_work AS (
    SELECT CONCAT('work-',t.EmployeeID,'-',t.PayrollCoOnSiteID,'-',CONVERT(char(10),CAST(t.WeekEndingDate AS date),23)) id,
      ISNULL(t.PayrollCoOnSiteInitials,'') payrollCo,ISNULL(e.EmFirstName,MAX(ISNULL(t.EmFirstName,''))) firstName,
      ISNULL(e.EmMiddle,'') middleInitial,ISNULL(e.EmLastName,MAX(ISNULL(t.EmLastName,''))) lastName,
      CONVERT(varchar(10),CAST(t.WeekEndingDate AS date),101) weekEnding,
      ISNULL(note.PayrollCheckNote,'') note,ISNULL(MAX(t.SiteState),'') state,ISNULL(MAX(t.GradeChange),'') trade,
      SUM(ISNULL(t.RegularHours,0)) regularHours,SUM(ISNULL(t.OvertimeHours,0)) overtimeHours,
      CASE WHEN SUM(ISNULL(t.RegularHours,0))=0 THEN NULL ELSE SUM(ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0))/NULLIF(SUM(ISNULL(t.RegularHours,0)),0) END payRate,
      SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) grossPay,
      '' otFlag
    FROM dbo.tblTracking t WITH (NOLOCK)
    LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
    OUTER APPLY (SELECT TOP (1) pc.PayrollCheckNote FROM dbo.tblPayrollCheckNotes pc WITH (NOLOCK)
      WHERE pc.EmployeeID=t.EmployeeID AND pc.PayrollCoOnSiteID=t.PayrollCoOnSiteID AND pc.AssignWeek=t.AssignWeek AND pc.AssignYear=t.AssignYear
      ORDER BY pc.PayrollCheckNoteID DESC) note
    WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL AND (@payrollCo='' OR ISNULL(t.PayrollCoOnSiteInitials,'')=@payrollCo)
    GROUP BY t.EmployeeID,t.PayrollCoOnSiteID,t.PayrollCoOnSiteInitials,CAST(t.WeekEndingDate AS date),e.EmFirstName,e.EmMiddle,e.EmLastName,note.PayrollCheckNote
  ), adjustments AS (
    SELECT CONCAT('adjustment-',a.PayrollAdjustmentID) id,ISNULL(co.PullDownPayrollCoOnSiteInitials,'') payrollCo,
      ISNULL(e.EmFirstName,'') firstName,ISNULL(e.EmMiddle,'') middleInitial,ISNULL(e.EmLastName,'') lastName,
      CONVERT(varchar(10),CAST(a.WeekEndingDate AS date),101) weekEnding,ISNULL(a.PayrollAdjustmentNote,'') note,
      '' state,'' trade,CAST(NULL AS float) regularHours,CAST(NULL AS float) overtimeHours,
      CAST(NULL AS money) payRate,ISNULL(a.PayrollAdjustmentAmount,0) grossPay,'' otFlag
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK)
    LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
    WHERE a.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND (@payrollCo='' OR ISNULL(co.PullDownPayrollCoOnSiteInitials,'')=@payrollCo)
  )
  SELECT * FROM payroll_work UNION ALL SELECT * FROM adjustments
  ORDER BY payrollCo,lastName,firstName,note,id`,[{name:"weekEnding",value:weekEnding},{name:"payrollCo",value:payrollCo}]);
}

/** Detailed payroll keeps the employee's customer and job assignment visible. */
export function getDetailedPayrollRows(weekEnding:string,payrollCo:string){
  return queryReadOnly<DetailedPayrollRow>(`WITH payroll_work AS (
    SELECT CONCAT('work-',t.TrackingID) id,ISNULL(t.PayrollCoOnSiteInitials,'') payrollCo,
      ISNULL(e.EmFirstName,ISNULL(t.EmFirstName,'')) firstName,ISNULL(e.EmMiddle,'') middleInitial,
      ISNULL(e.EmLastName,ISNULL(t.EmLastName,'')) lastName,CONVERT(varchar(10),CAST(t.WeekEndingDate AS date),101) weekEnding,
      ISNULL(note.PayrollCheckNote,'') note,ISNULL(t.SiteState,'') state,ISNULL(t.GradeChange,'') trade,
      ISNULL(t.RegularHours,0) regularHours,ISNULL(t.OvertimeHours,0) overtimeHours,t.PayRate payRate,
      CAST(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END AS money) grossPay,
      '' otFlag,ISNULL(t.CustomerBusName,'') customer,ISNULL(t.SiteName,'') job
    FROM dbo.tblTracking t WITH (NOLOCK)
    LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
    OUTER APPLY (SELECT TOP (1) pc.PayrollCheckNote FROM dbo.tblPayrollCheckNotes pc WITH (NOLOCK)
      WHERE pc.EmployeeID=t.EmployeeID AND pc.PayrollCoOnSiteID=t.PayrollCoOnSiteID AND pc.AssignWeek=t.AssignWeek AND pc.AssignYear=t.AssignYear
      ORDER BY pc.PayrollCheckNoteID DESC) note
    WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL AND (@payrollCo='' OR ISNULL(t.PayrollCoOnSiteInitials,'')=@payrollCo)
  ), adjustments AS (
    SELECT CONCAT('adjustment-',a.PayrollAdjustmentID) id,ISNULL(co.PullDownPayrollCoOnSiteInitials,'') payrollCo,
      ISNULL(e.EmFirstName,'') firstName,ISNULL(e.EmMiddle,'') middleInitial,ISNULL(e.EmLastName,'') lastName,
      CONVERT(varchar(10),CAST(a.WeekEndingDate AS date),101) weekEnding,ISNULL(a.PayrollAdjustmentNote,'') note,
      '' state,'' trade,CAST(NULL AS float) regularHours,CAST(NULL AS float) overtimeHours,CAST(NULL AS money) payRate,
      ISNULL(a.PayrollAdjustmentAmount,0) grossPay,'' otFlag,'' customer,'' job
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK)
    LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
    WHERE a.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND (@payrollCo='' OR ISNULL(co.PullDownPayrollCoOnSiteInitials,'')=@payrollCo)
  ) SELECT * FROM payroll_work UNION ALL SELECT * FROM adjustments
  ORDER BY payrollCo,lastName,firstName,customer,job,id`,[{name:"weekEnding",value:weekEnding},{name:"payrollCo",value:payrollCo}]);
}

export function getPayrollCheckNotesRows(weekEnding:string,payrollCo:string){
  return queryReadOnly<PayrollCheckNotesRow>(`SELECT * FROM (
    SELECT CONCAT('work-',t.EmployeeID,'-',t.PayrollCoOnSiteID,'-',CONVERT(char(10),CAST(t.WeekEndingDate AS date),23)) id,
      ISNULL(t.PayrollCoOnSiteInitials,'') payrollCo,ISNULL(e.EmFirstName,MAX(ISNULL(t.EmFirstName,''))) firstName,
      ISNULL(e.EmMiddle,'') middleInitial,ISNULL(e.EmLastName,MAX(ISNULL(t.EmLastName,''))) lastName,
      CONVERT(varchar(10),CAST(t.WeekEndingDate AS date),101) weekEnding,CAST('' AS varchar(500)) adjustmentNote,
      ISNULL(MAX(t.SiteState),'') state,ISNULL(MAX(t.GradeChange),'') trade,SUM(ISNULL(t.RegularHours,0)) regularHours,
      SUM(ISNULL(t.OvertimeHours,0)) overtimeHours,
      CASE WHEN SUM(ISNULL(t.RegularHours,0))=0 THEN NULL ELSE SUM(ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0))/NULLIF(SUM(ISNULL(t.RegularHours,0)),0) END payRate,
      SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) grossPay,
      ISNULL(note.PayrollCheckNote,'') checkNote,'' otFlag
    FROM dbo.tblTracking t WITH (NOLOCK) LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
    OUTER APPLY (SELECT TOP (1) pc.PayrollCheckNote FROM dbo.tblPayrollCheckNotes pc WITH (NOLOCK)
      WHERE pc.EmployeeID=t.EmployeeID AND pc.PayrollCoOnSiteID=t.PayrollCoOnSiteID AND pc.AssignWeek=t.AssignWeek AND pc.AssignYear=t.AssignYear
      ORDER BY pc.PayrollCheckNoteID DESC) note
    WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL AND (@payrollCo='' OR ISNULL(t.PayrollCoOnSiteInitials,'')=@payrollCo)
    GROUP BY t.EmployeeID,t.PayrollCoOnSiteID,t.PayrollCoOnSiteInitials,CAST(t.WeekEndingDate AS date),e.EmFirstName,e.EmMiddle,e.EmLastName,note.PayrollCheckNote
    UNION ALL
    SELECT CONCAT('adjustment-',a.PayrollAdjustmentID),ISNULL(co.PullDownPayrollCoOnSiteInitials,''),ISNULL(e.EmFirstName,''),ISNULL(e.EmMiddle,''),ISNULL(e.EmLastName,''),
      CONVERT(varchar(10),CAST(a.WeekEndingDate AS date),101),ISNULL(a.PayrollAdjustmentNote,''),'','',CAST(NULL AS float),CAST(NULL AS float),CAST(NULL AS money),
      ISNULL(a.PayrollAdjustmentAmount,0),'',''
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK) LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
    WHERE a.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
      AND (@payrollCo='' OR ISNULL(co.PullDownPayrollCoOnSiteInitials,'')=@payrollCo)
  ) check_notes ORDER BY payrollCo,lastName,firstName,adjustmentNote,id`,[{name:"weekEnding",value:weekEnding},{name:"payrollCo",value:payrollCo}]);
}

export function getPayrollAdjustmentRows(weekEnding:string,payrollCo:string){
  return queryReadOnly<PayrollAdjustmentRow>(`SELECT a.PayrollAdjustmentID id,a.EmployeeID employeeId,
    LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmLastName,'')))) employee,
    ISNULL(co.PullDownPayrollCoOnSiteName,'') company,ISNULL(co.PullDownPayrollCoOnSiteInitials,'') payrollCo,
    CONVERT(varchar(10),CAST(a.WeekEndingDate AS date),101) weekEnding,ISNULL(a.PayrollAdjustmentAmount,0) amount,
    ISNULL(a.PayrollAdjustmentNote,'') adjustmentNote,CAST('' AS varchar(500)) officeNote,CAST('' AS varchar(100)) userName,CAST('' AS varchar(40)) timestamp
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK)
    LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
    WHERE (@weekEnding='' OR a.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23)))
      AND (@payrollCo='' OR ISNULL(co.PullDownPayrollCoOnSiteInitials,'')=@payrollCo)
    ORDER BY a.WeekEndingDate DESC,e.EmLastName,e.EmFirstName,a.PayrollAdjustmentID DESC`,[{name:"weekEnding",value:weekEnding},{name:"payrollCo",value:payrollCo}]);
}

export function getXcelHrPayrollRows(weekEnding:string,payrollCo:string){
  return queryReadOnly<XcelHrPayrollRow>(`WITH work_rows AS (
    SELECT CONCAT('work-',t.EmployeeID,'-',t.PayrollCoOnSiteID,'-',CONVERT(char(10),CAST(t.WeekEndingDate AS date),23)) id,
      ISNULL(t.PayrollCoOnSiteInitials,'') payrollCo,ISNULL(e.EmFirstName,MAX(ISNULL(t.EmFirstName,''))) firstName,
      ISNULL(e.EmMiddle,'') middleInitial,ISNULL(e.EmLastName,MAX(ISNULL(t.EmLastName,''))) lastName,
      CONVERT(varchar(10),CAST(t.WeekEndingDate AS date),101) weekEnding,ISNULL(note.PayrollCheckNote,'') note,
      ISNULL(MAX(t.SiteState),'') state,ISNULL(MAX(t.WCC),'') wcc,ISNULL(MAX(t.GradeChange),'') trade,
      SUM(ISNULL(t.RegularHours,0)) regularHours,SUM(ISNULL(t.OvertimeHours,0)) overtimeHours,
      CASE WHEN SUM(ISNULL(t.RegularHours,0))=0 THEN NULL ELSE SUM(ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0))/NULLIF(SUM(ISNULL(t.RegularHours,0)),0) END payRate,
      SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) grossPay,
      ISNULL(MAX(e.SSNum),'') ssn,CAST(NULL AS float) overheadPercent,
      SUM(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll ELSE ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0) END) xcelHrAmount,'' otFlag
    FROM dbo.tblTracking t WITH (NOLOCK) LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
    OUTER APPLY (SELECT TOP (1) pc.PayrollCheckNote FROM dbo.tblPayrollCheckNotes pc WITH (NOLOCK) WHERE pc.EmployeeID=t.EmployeeID AND pc.PayrollCoOnSiteID=t.PayrollCoOnSiteID AND pc.AssignWeek=t.AssignWeek AND pc.AssignYear=t.AssignYear ORDER BY pc.PayrollCheckNoteID DESC) note
    WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23)) AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL AND (@payrollCo='' OR ISNULL(t.PayrollCoOnSiteInitials,'')=@payrollCo)
    GROUP BY t.EmployeeID,t.PayrollCoOnSiteID,t.PayrollCoOnSiteInitials,CAST(t.WeekEndingDate AS date),e.EmFirstName,e.EmMiddle,e.EmLastName,note.PayrollCheckNote
  ), adjustments AS (
    SELECT CONCAT('adjustment-',a.PayrollAdjustmentID),ISNULL(co.PullDownPayrollCoOnSiteInitials,''),ISNULL(e.EmFirstName,''),ISNULL(e.EmMiddle,''),ISNULL(e.EmLastName,''),
      CONVERT(varchar(10),CAST(a.WeekEndingDate AS date),101),ISNULL(a.PayrollAdjustmentNote,''),'','', '',CAST(NULL AS float),CAST(NULL AS float),CAST(NULL AS money),
      ISNULL(a.PayrollAdjustmentAmount,0),ISNULL(e.SSNum,''),CAST(NULL AS float),ISNULL(a.PayrollAdjustmentAmount,0),''
    FROM dbo.tblPayrollAdjustments a WITH (NOLOCK) LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite co WITH (NOLOCK) ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
    WHERE a.WeekEndingDate>=CONVERT(date,@weekEnding,23) AND a.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23)) AND (@payrollCo='' OR ISNULL(co.PullDownPayrollCoOnSiteInitials,'')=@payrollCo)
  ) SELECT * FROM work_rows UNION ALL SELECT * FROM adjustments ORDER BY payrollCo,lastName,firstName,note,id`,[{name:"weekEnding",value:weekEnding},{name:"payrollCo",value:payrollCo}]);
}
