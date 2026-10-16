import { queryReadOnlyUncached } from "@/lib/db/sql";

export interface WebsiteAccessRow {
  id: number;
  company: string;
  websiteName: string;
  address: string;
  username: string;
  password: string;
  notes: string;
  entryUser: string;
  entryDate: string;
  active: boolean;
  sort: string;
}

/** Admin-only website access rows, including the credentials shown in this screen. */
export function getWebsiteAccessRows() {
  return queryReadOnlyUncached<WebsiteAccessRow>(`SELECT WebsiteAccessID id,
    ISNULL(WebsiteAccessPayrollCoOnSiteName,'') company,ISNULL(WebsiteAccessName,'') websiteName,
    ISNULL(WebsiteAccessAddress,'') address,ISNULL(WebsiteAccessUser,'') username,ISNULL(WebsiteAccessPassword,'') password,
    ISNULL(WebsiteAccessNotes,'') notes,ISNULL(WebsiteAccessUserName,'') entryUser,
    CASE WHEN WebsiteAccessTimestamp IS NULL THEN '' ELSE CONVERT(varchar(10),WebsiteAccessTimestamp,101) END entryDate,
    CAST(ISNULL(WebsiteAccessActive,0) AS bit) active,ISNULL(CONVERT(varchar(20),WebsiteAccessSort),'') sort
    FROM dbo.tblWebsiteAccess WITH (NOLOCK)
    ORDER BY CASE
      WHEN WebsiteAccessName='IPG WC 2026' THEN 1
      WHEN WebsiteAccessName='Ramp payment portal' THEN 2
      WHEN WebsiteAccessName LIKE 'NH Business electric license%' THEN 3
      WHEN WebsiteAccessName LIKE 'NH Personal License%' THEN 4
      WHEN WebsiteAccessName='Schlager OCIP' THEN 5
      WHEN WebsiteAccessName='NY Taxes' THEN 6
      WHEN WebsiteAccessName='Elipse IPG Plumb' THEN 7
      WHEN WebsiteAccessName='IPG NY' THEN 8
      WHEN WebsiteAccessName='Mass TaxConnect' AND WebsiteAccessPayrollCoOnSiteName='Industrial Service Group, Inc.' THEN 9
      WHEN WebsiteAccessName='Neighborhood Health' AND WebsiteAccessPayrollCoOnSiteName='IPG' THEN 10
      WHEN WebsiteAccessName='Light House Printing' THEN 11
      WHEN WebsiteAccessName='Norton' THEN 12
      WHEN WebsiteAccessName='Mass TaxConnect' AND WebsiteAccessPayrollCoOnSiteName='Mc Labor Sources, Inc.' THEN 13
      WHEN WebsiteAccessName='Docusign' THEN 14
      WHEN WebsiteAccessName='DropBox' THEN 15
      WHEN WebsiteAccessName='Dunn & Bradstreet' THEN 16
      WHEN WebsiteAccessName='Mass TaxConnect' AND WebsiteAccessPayrollCoOnSiteName='T&R Home Care, Inc.' THEN 17
      WHEN WebsiteAccessName='First Advantage Background' THEN 18
      WHEN WebsiteAccessName='Bill.com' THEN 19
      WHEN WebsiteAccessName='Census Portal' THEN 20
      WHEN WebsiteAccessName='Accurate Background' THEN 21
      WHEN WebsiteAccessName='NY PFMLA' THEN 22
      ELSE 1000
    END,ISNULL(WebsiteAccessSort,999999),WebsiteAccessName,WebsiteAccessID`);
}

export async function getWebsiteAccessPassword(id: number) {
  const rows = await queryReadOnlyUncached<{ password: string }>(`SELECT ISNULL(WebsiteAccessPassword,'') password
    FROM dbo.tblWebsiteAccess WITH (NOLOCK) WHERE WebsiteAccessID=@id`, [{ name: "id", value: id }]);
  return rows[0]?.password ?? null;
}
