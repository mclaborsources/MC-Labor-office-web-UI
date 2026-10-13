import { queryReadOnly } from "@/lib/db/sql";

type CatalogColumn = { TABLE_SCHEMA: string; TABLE_NAME: string; COLUMN_NAME: string };
export type EmployeeResearchRow = Record<string, string | number | null>;

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const aliases = {
  id: ["employeeresearchid", "researchid", "id"],
  staffId: ["officestaffid", "staffid"],
  staff: ["staffname", "officestaffname", "researchstaffname"],
  screen: ["screenname", "researchscreen", "employeeresearchscreen", "formname"],
  type: ["researchtype", "employeeresearchtype", "type"],
  employeeId: ["employeeid", "researchemployeeid"],
  first: ["employeefirstname", "firstname", "emfirstName"],
  middle: ["employeemiddleinitial", "employeemiddle", "middleinitial", "mi", "emmiddle"],
  last: ["employeelastname", "lastname", "emlastname"],
  date: ["researchdate", "employeeresearchdate", "date", "startdate", "timestamp", "datetime"],
  start: ["starttime", "researchstarttime", "employeeresearchstarttime", "startdatetime"],
  end: ["endtime", "researchendtime", "employeeresearchendtime", "enddatetime"],
  seconds: ["timesec", "timeseconds", "durationseconds", "researchseconds", "duration", "elapsed"],
} as const;

export async function getEmployeeResearchRows(): Promise<EmployeeResearchRow[]> {
  const catalog = await queryReadOnly<CatalogColumn>(
    `SELECT TABLE_SCHEMA,TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME LIKE '%Research%' OR COLUMN_NAME LIKE '%Research%' ORDER BY TABLE_SCHEMA,TABLE_NAME,ORDINAL_POSITION`,
  );
  const tables = new Map<string, CatalogColumn[]>();
  for (const field of catalog) {
    const key = `${field.TABLE_SCHEMA}.${field.TABLE_NAME}`;
    tables.set(key, [...(tables.get(key) ?? []), field]);
  }
  const candidates = [...tables.entries()].filter(([, fields]) =>
    fields.some(field => normalized(field.TABLE_NAME).includes("employeeresearch"))
      || fields.some(field => normalized(field.COLUMN_NAME).includes("employeeresearch")),
  ).sort((a, b) => {
    const score = (fields: CatalogColumn[]) => {
      const names = fields.map(field => normalized(field.COLUMN_NAME));
      const mapped = (Object.values(aliases) as readonly (readonly string[])[]).filter(keys => names.some(name => keys.includes(name))).length;
      const name = normalized(fields[0]?.TABLE_NAME ?? "");
      return mapped * 10 + Number(name === "tblemployeeresearch") * 5 + Number(name.includes("employeeresearch"));
    };
    return score(b[1]) - score(a[1]);
  });
  const selected = candidates[0];
  if (!selected) throw new Error("The Employee Research SQL table was not found.");

  const [schema, table] = selected[0].split(".");
  const fields = selected[1];
  const find = (keys: readonly string[]) => fields.find(field => keys.includes(normalized(field.COLUMN_NAME)));
  const findByParts = (...parts: string[]) => fields.find(field => {
    const name = normalized(field.COLUMN_NAME);
    return parts.every(part => name.includes(part));
  });
  const quote = (value: string) => `[${value.replaceAll("]", "]]" )}]`;
  const col = (key: keyof typeof aliases) => {
    const exact = find(aliases[key]);
    if (exact) return exact;
    switch (key) {
      case "screen": return findByParts("screen") ?? findByParts("form");
      case "type": return findByParts("type");
      case "date": return findByParts("research", "date") ?? findByParts("timestamp") ?? findByParts("datetime");
      case "start": return findByParts("start", "time") ?? findByParts("start", "datetime");
      case "end": return findByParts("end", "time") ?? findByParts("end", "datetime");
      case "seconds": return findByParts("second") ?? findByParts("duration") ?? findByParts("elapsed");
      default: return undefined;
    }
  };
  const source = (key: keyof typeof aliases) => {
    const field = col(key);
    return field ? `r.${quote(field.COLUMN_NAME)}` : `CAST(NULL AS NVARCHAR(255))`;
  };
  const staffName = col("staff")
    ? `r.${quote(col("staff")!.COLUMN_NAME)}`
    : col("staffId")
      ? `(SELECT TOP (1) LTRIM(RTRIM(ISNULL(os.OfficeStaffFirstName,'')+' '+ISNULL(os.OfficeStaffLastName,''))) FROM tblOfficeStaff os WITH (NOLOCK) WHERE os.OfficeStaffID=r.${quote(col("staffId")!.COLUMN_NAME)})`
      : `CAST(NULL AS NVARCHAR(255))`;
  const employeeId = col("employeeId");
  const employeeName = (key: "first" | "middle" | "last", employeeColumn: string) => col(key)
    ? `ISNULL(${source(key)},'')`
    : employeeId
      ? `(SELECT TOP (1) ISNULL(e.${quote(employeeColumn)},'') FROM tblEmployee e WITH (NOLOCK) WHERE e.EmployeeID=r.${quote(employeeId.COLUMN_NAME)})`
      : `CAST(NULL AS NVARCHAR(255))`;
  const startColumn = col("start");
  const endColumn = col("end");
  const dateColumn = col("date");
  const startExpression = startColumn ? `r.${quote(startColumn.COLUMN_NAME)}` : `CAST(NULL AS NVARCHAR(255))`;
  const endExpression = endColumn ? `r.${quote(endColumn.COLUMN_NAME)}` : `CAST(NULL AS NVARCHAR(255))`;
  const dateExpression = dateColumn ? `r.${quote(dateColumn.COLUMN_NAME)}` : startColumn ? startExpression : `CAST(NULL AS DATETIME)`;
  const formatTime = (field: CatalogColumn | undefined, fallback: string) => field
    ? `CONVERT(VARCHAR(20),r.${quote(field.COLUMN_NAME)},100)`
    : fallback;
  const expressions = [
    `${source("id")} AS id`, `${staffName} AS [Staff Name]`, `${source("screen")} AS [Screen Name]`,
    `${source("type")} AS [Type]`, `${employeeName("first", "EmFirstName")} AS [First Name]`,
    `${employeeName("middle", "EmMiddle")} AS MI`, `${employeeName("last", "EmLastName")} AS [Last Name]`,
    `CONVERT(VARCHAR(10),${dateExpression},101) AS [Date]`, `${formatTime(startColumn, `CONVERT(VARCHAR(20),${startExpression},100)`)} AS [Start Time]`,
    `${formatTime(endColumn, `CONVERT(VARCHAR(20),${endExpression},100)`)} AS [End Time]`, `${source("seconds")} AS [Time Sec]`,
  ];
  const order = dateColumn ? `ORDER BY r.${quote(dateColumn.COLUMN_NAME)} DESC` : "";
  return queryReadOnly<EmployeeResearchRow>(`SELECT TOP (5000) ${expressions.join(", ")} FROM ${quote(schema)}.${quote(table)} r WITH (NOLOCK) ${order}`);
}
