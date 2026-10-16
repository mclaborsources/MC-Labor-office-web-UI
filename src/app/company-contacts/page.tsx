import { AppShell } from "@/components/layout/AppShell";
import { CompanyContactsScreen } from "@/components/company-contacts/CompanyContactsScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getCompanyContacts, type CompanyContact } from "@/lib/companyContacts";

export default async function CompanyContactsPage(){
  const session=await getSessionOrDefault();let initial={contacts:[] as CompanyContact[],companies:[] as string[]};let error="";
  try{initial=await getCompanyContacts();}catch{error="Company contacts could not be loaded from the office database.";}
  return <AppShell userDisplayName={session.user?.displayName} fullWidth fillViewport><CompanyContactsScreen initialContacts={initial.contacts} companies={initial.companies} initialError={error}/></AppShell>;
}
