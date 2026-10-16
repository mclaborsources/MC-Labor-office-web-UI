import { queryReadOnly } from "@/lib/db/sql";

export interface CompanyContact {
  id: number; company: string; firstName: string; lastName: string; role: string;
  sort: number | null; active: boolean; phone: string; cell: string; email: string; notes: string;
}

export async function getCompanyContacts() {
  const [contacts, companies] = await Promise.all([
    queryReadOnly<CompanyContact>(`SELECT CompanyContactID id,ISNULL(CompanyContactCompany,'') company,ISNULL(CompanyContactFName,'') firstName,ISNULL(CompanyContactLName,'') lastName,ISNULL(CompanyContactRole,'') role,CompanyContactSort sort,CAST(ISNULL(CompanyContactActive,0) AS bit) active,ISNULL(CompanyContactPhone,'') phone,ISNULL(CompanyContactCell,'') cell,ISNULL(CompanyContactEmail,'') email,ISNULL(CompanyContactNotes,'') notes FROM dbo.tblCompanyContacts WITH (NOLOCK) ORDER BY CompanyContactSort,CompanyContactCompany,CompanyContactLName,CompanyContactFName,CompanyContactID`),
    queryReadOnly<{company:string}>(`SELECT DISTINCT LTRIM(RTRIM(CompanyContactCompany)) company FROM dbo.tblCompanyContacts WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(CompanyContactCompany,''))))>0 ORDER BY LTRIM(RTRIM(CompanyContactCompany))`),
  ]);
  return { contacts, companies: companies.map(row=>row.company) };
}
