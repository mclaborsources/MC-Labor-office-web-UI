import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";

export const dynamic = "force-dynamic";
type Column = { TABLE_SCHEMA: string; TABLE_NAME: string; COLUMN_NAME: string };
type DataRow = Record<string, unknown>;
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const ACCESS_COLUMNS = [
  { label: "WCC", aliases: ["wcc", "wcccode", "codewcc", "pullDownWCC"] },
  { label: "Desc", aliases: ["desc", "description", "wccdesc", "wccdescription", "pulldownwccdesc"] },
  { label: "Contract With", aliases: ["contractwith", "contractwithname", "payrollcompany", "payrollco", "contractwithid", "contractwithpayrollcoid", "pulldowncontractwithpayrollcoid"] },
  { label: "Hide", aliases: ["hide", "hidden", "hidewcc", "wccishidden"] },
  { label: "State", aliases: ["state", "statecode", "statename", "wccstate", "wccstateid", "pulldownstateid"] },
  { label: "State Rate", aliases: ["staterate", "wccstaterate", "wccratestate", "wccstatewcrate"] },
  { label: "Penalty %", aliases: ["penalty", "penaltypercent", "penaltypct", "wccpenaltypercent", "wccpenalty"] },
  { label: "MLS Cost", aliases: ["mlscost", "wccmlscost", "mlsratecost"] },
  { label: "MLS Markup", aliases: ["mlsmarkup", "wccmlsmarkup"] },
  { label: "SS", aliases: ["ss", "socialsecurity", "wccss"] },
  { label: "Med", aliases: ["med", "medicare", "wccmed"] },
  { label: "State UI", aliases: ["stateui", "wccstateui"] },
  { label: "EMAC", aliases: ["emac", "wccemac"] },
  { label: "Fed UI", aliases: ["fedui", "federalui", "wccfedui"] },
  { label: "Co Exp Per Diem Per Hr", aliases: ["coexpperdiemperhr", "companyexpenseperdiemperhour", "perdiemperhour", "coexpperdiem"] },
  { label: "Tracking Wcc Rate", aliases: ["trackingwccrate", "wcctrackingrate"] },
  { label: "Rate Active", aliases: ["rateactive", "active"] },
  { label: "Code Wcc Rate", aliases: ["codewccrate", "wcccoderate"] },
  { label: "Base Wcc Rate", aliases: ["basewccrate", "basewcc", "basewccrate"] },
];

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.user?.roles.includes("admin")) return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 });
    const columns = await queryReadOnly<Column>(`SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME LIKE '%WCC%' OR COLUMN_NAME LIKE '%WCC%'`);
    const groups = new Map<string, Column[]>();
    for (const column of columns) {
      const key = `${column.TABLE_SCHEMA}.${column.TABLE_NAME}`;
      groups.set(key, [...(groups.get(key) ?? []), column]);
    }
    const candidates = [...groups.entries()].map(([name, fields]) => {
      const table = fields[0]?.TABLE_NAME ?? "";
      const names = fields.map(field => normalized(field.COLUMN_NAME));
      const score = (table.toLowerCase().includes("rate") ? 100 : 0)
        + (table.toLowerCase().includes("wcc") ? 50 : 0)
        + (names.some(field => field === "wcc" || field.endsWith("wcccode")) ? 20 : 0)
        + (names.some(field => field.includes("desc")) ? 10 : 0)
        + (names.some(field => field.includes("state")) ? 5 : 0);
      return { name, fields, score };
    }).filter(candidate => (candidate.fields[0]?.TABLE_NAME.toLowerCase().includes("wcc") || candidate.fields[0]?.TABLE_NAME.toLowerCase().includes("rate")) && candidate.fields.some(field => normalized(field.COLUMN_NAME).includes("wcc")))
      .sort((a, b) => b.score - a.score);
    if (candidates[0]) {
      const selected = candidates[0];
      const schema = selected.fields[0]?.TABLE_SCHEMA ?? "dbo";
      const table = selected.fields[0]?.TABLE_NAME ?? "";
      const expressions = ACCESS_COLUMNS.map(accessColumn => {
        const actual = selected.fields.find(field => accessColumn.aliases.includes(normalized(field.COLUMN_NAME)));
        if (!actual) return `CAST(NULL AS NVARCHAR(255)) AS [${accessColumn.label}]`;
        const actualName = `[rates].[${actual.COLUMN_NAME.replaceAll("]", "]]" )}]`;
        if (accessColumn.label === "Contract With" && normalized(actual.COLUMN_NAME).endsWith("id")) {
          return `(SELECT TOP (1) PullDownContractWith_PayrollCoName FROM tblPullDownContractWith_PayrollCo WITH (NOLOCK) WHERE PullDownContractWith_PayrollCoID=${actualName}) AS [Contract With]`;
        }
        if (accessColumn.label === "State" && normalized(actual.COLUMN_NAME).endsWith("id")) {
          return `(SELECT TOP (1) PullDownState FROM tblPullDownStates WITH (NOLOCK) WHERE PullDownStateID=${actualName}) AS [State]`;
        }
        return `${actualName} AS [${accessColumn.label}]`;
      });
      const rows = await queryReadOnly<DataRow>(`SELECT TOP (2000) ${expressions.join(", ")} FROM [${schema.replaceAll("]", "]]" )}].[${table.replaceAll("]", "]]" )}] AS rates`);
      return NextResponse.json({ ok: true, sourceTable: selected.name, columns: ACCESS_COLUMNS.map(column => column.label), rows, limited: rows.length === 2000 });
    }
    const rows = await queryReadOnly<DataRow>(`SELECT TOP (2000) ISNULL(WCC,'') AS WCC, ISNULL(SiteState,'') AS State, ISNULL(PayrollCoOnSiteInitials,'') AS [Contract With], MAX(ISNULL(WccTracking,0)) AS [Tracking Wcc Rate] FROM tblTracking WITH (NOLOCK) WHERE NULLIF(LTRIM(RTRIM(ISNULL(WCC,''))),'') IS NOT NULL GROUP BY WCC,SiteState,PayrollCoOnSiteInitials ORDER BY WCC,SiteState,PayrollCoOnSiteInitials`);
    return NextResponse.json({ ok: true, sourceTable: "tblTracking (WCC usage fallback)", columns: ACCESS_COLUMNS.map(column => column.label), rows, limited: rows.length === 2000, rateMasterFound: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load WCC rates.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Administrator") ? 403 : 500 });
  }
}
