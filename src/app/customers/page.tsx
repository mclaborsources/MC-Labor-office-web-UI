import { AppShell } from "@/components/layout/AppShell";
import { CustomerSearchScreen } from "@/components/customers/CustomerSearchScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOfficeStaffList } from "@/lib/admin";
import { getCustomerUserFlagOptions } from "@/lib/customers";
import type { FilterOption } from "@/types/search";
import type { CustomerSearchRow } from "@/types/customer";

const DUMMY_CUSTOMERS: CustomerSearchRow[] = [
  {
    customerId: "1001", customerName: "Harbor Point Construction", customerType: "General Contractor", salesman: "Maria Santos", status: "Active",
    phone: "(617) 555-0101", email: "office@harborpoint.example", street: "125 Summer Street", city: "Boston", state: "MA", zip: "02110",
    noCommunication: "", act: "12", lastWeekEnding: "07/18/2026", firstWeekEnding: "01/10/2026", internetSalesReadyUser: "MSantos", internetSalesReadyDate: "01/05/2026", internetSalesReady: "X",
    lastActionUser: "MSantos", lastActionDate: "07/20/2026", lastAction: "Follow-up call", futureCallUser: "MSantos", futureCallUserDate: "07/27/2026", futureCallUserTime: "10:00 AM", futureCall: "Quarterly check-in", futureCallHistory: "", salesHStatus: "Current", contacts: "3", licenseNumber: "MA-CS-10482", licenseIssueDate: "03/12/2021", licenseExpireDate: "03/12/2027", salesPackageSentFilter: "X", salesPackageSentDate: "01/06/2026", salesPackageSentUser: "MSantos", contactCount: "3",
  },
  {
    customerId: "1002", customerName: "Granite State Electric", customerType: "Electrical", salesman: "David Chen", status: "Active",
    phone: "(603) 555-0102", email: "dispatch@graniteelectric.example", street: "44 Elm Street", city: "Manchester", state: "NH", zip: "03101",
    noCommunication: "", act: "8", lastWeekEnding: "07/18/2026", firstWeekEnding: "02/07/2026", internetSalesReadyUser: "DChen", internetSalesReadyDate: "02/02/2026", internetSalesReady: "X", lastActionUser: "DChen", lastActionDate: "07/17/2026", lastAction: "Sent rate sheet", futureCallUser: "DChen", futureCallUserDate: "07/24/2026", futureCallUserTime: "2:30 PM", futureCall: "Review staffing needs", futureCallHistory: "", salesHStatus: "Current", contacts: "2", licenseNumber: "NH-ELEC-8831", licenseIssueDate: "06/01/2020", licenseExpireDate: "06/01/2027", salesPackageSentFilter: "X", salesPackageSentDate: "02/03/2026", salesPackageSentUser: "DChen", contactCount: "2",
  },
  {
    customerId: "1003", customerName: "Beacon Mechanical Services", customerType: "Mechanical", salesman: "James Wilson", status: "Active",
    phone: "(401) 555-0103", email: "projects@beaconmechanical.example", street: "78 Dyer Street", city: "Providence", state: "RI", zip: "02903",
    noCommunication: "", act: "6", lastWeekEnding: "07/11/2026", firstWeekEnding: "03/14/2026", internetSalesReadyUser: "JWilson", internetSalesReadyDate: "03/09/2026", internetSalesReady: "X", lastActionUser: "JWilson", lastActionDate: "07/15/2026", lastAction: "Site visit", futureCallUser: "JWilson", futureCallUserDate: "07/29/2026", futureCallUserTime: "9:00 AM", futureCall: "Project kickoff", futureCallHistory: "", salesHStatus: "Current", contacts: "4", licenseNumber: "RI-MECH-2205", licenseIssueDate: "09/18/2019", licenseExpireDate: "09/18/2026", salesPackageSentFilter: "X", salesPackageSentDate: "03/10/2026", salesPackageSentUser: "JWilson", contactCount: "4",
  },
  {
    customerId: "1004", customerName: "North Shore Masonry", customerType: "Masonry", salesman: "Maria Santos", status: "Prospect",
    phone: "(978) 555-0104", email: "estimating@northshoremasonry.example", street: "210 Rantoul Street", city: "Beverly", state: "MA", zip: "01915",
    noCommunication: "", act: "3", lastWeekEnding: "", firstWeekEnding: "", internetSalesReadyUser: "MSantos", internetSalesReadyDate: "06/22/2026", internetSalesReady: "X", lastActionUser: "MSantos", lastActionDate: "07/14/2026", lastAction: "Proposal sent", futureCallUser: "MSantos", futureCallUserDate: "07/23/2026", futureCallUserTime: "11:30 AM", futureCall: "Proposal follow-up", futureCallHistory: "", salesHStatus: "New", contacts: "1", licenseNumber: "MA-MAS-5319", licenseIssueDate: "11/04/2022", licenseExpireDate: "11/04/2026", salesPackageSentFilter: "X", salesPackageSentDate: "06/23/2026", salesPackageSentUser: "MSantos", contactCount: "1",
  },
  {
    customerId: "1005", customerName: "Summit Roofing Group", customerType: "Roofing", salesman: "David Chen", status: "Active",
    phone: "(508) 555-0105", email: "crew@summitroofing.example", street: "16 Main Street", city: "Worcester", state: "MA", zip: "01608",
    noCommunication: "", act: "15", lastWeekEnding: "07/18/2026", firstWeekEnding: "11/08/2025", internetSalesReadyUser: "DChen", internetSalesReadyDate: "11/03/2025", internetSalesReady: "X", lastActionUser: "DChen", lastActionDate: "07/21/2026", lastAction: "Confirmed crew", futureCallUser: "DChen", futureCallUserDate: "08/03/2026", futureCallUserTime: "8:30 AM", futureCall: "August scheduling", futureCallHistory: "", salesHStatus: "Current", contacts: "3", licenseNumber: "MA-ROOF-7712", licenseIssueDate: "04/15/2018", licenseExpireDate: "04/15/2027", salesPackageSentFilter: "X", salesPackageSentDate: "11/04/2025", salesPackageSentUser: "DChen", contactCount: "3",
  },
  {
    customerId: "1006", customerName: "Metro Interior Systems", customerType: "Drywall", salesman: "Alicia Brown", status: "Active",
    phone: "(781) 555-0106", email: "operations@metrointeriors.example", street: "90 Commerce Way", city: "Woburn", state: "MA", zip: "01801",
    noCommunication: "", act: "10", lastWeekEnding: "07/18/2026", firstWeekEnding: "12/06/2025", internetSalesReadyUser: "ABrown", internetSalesReadyDate: "12/01/2025", internetSalesReady: "X", lastActionUser: "ABrown", lastActionDate: "07/18/2026", lastAction: "Updated contact", futureCallUser: "ABrown", futureCallUserDate: "07/30/2026", futureCallUserTime: "1:00 PM", futureCall: "Labor forecast", futureCallHistory: "", salesHStatus: "Current", contacts: "5", licenseNumber: "MA-DRY-9024", licenseIssueDate: "07/22/2017", licenseExpireDate: "07/22/2027", salesPackageSentFilter: "X", salesPackageSentDate: "12/02/2025", salesPackageSentUser: "ABrown", contactCount: "5",
  },
  {
    customerId: "1007", customerName: "Seacoast Plumbing Co.", customerType: "Plumbing", salesman: "James Wilson", status: "Inactive",
    phone: "(207) 555-0107", email: "admin@seacoastplumbing.example", street: "33 Commercial Street", city: "Portland", state: "ME", zip: "04101",
    noCommunication: "X", act: "4", lastWeekEnding: "05/30/2026", firstWeekEnding: "01/17/2026", internetSalesReadyUser: "JWilson", internetSalesReadyDate: "01/12/2026", internetSalesReady: "X", lastActionUser: "JWilson", lastActionDate: "06/02/2026", lastAction: "Account paused", futureCallUser: "", futureCallUserDate: "", futureCallUserTime: "", futureCall: "", futureCallHistory: "", salesHStatus: "Inactive", contacts: "2", licenseNumber: "ME-PLMB-4106", licenseIssueDate: "02/28/2020", licenseExpireDate: "02/28/2027", salesPackageSentFilter: "X", salesPackageSentDate: "01/13/2026", salesPackageSentUser: "JWilson", contactCount: "2",
  },
  {
    customerId: "1008", customerName: "Cambridge Site Works", customerType: "Site Contractor", salesman: "Alicia Brown", status: "Prospect",
    phone: "(617) 555-0108", email: "bids@cambridgesiteworks.example", street: "52 First Street", city: "Cambridge", state: "MA", zip: "02141",
    noCommunication: "", act: "2", lastWeekEnding: "", firstWeekEnding: "", internetSalesReadyUser: "ABrown", internetSalesReadyDate: "07/01/2026", internetSalesReady: "X", lastActionUser: "ABrown", lastActionDate: "07/16/2026", lastAction: "Introductory call", futureCallUser: "ABrown", futureCallUserDate: "07/28/2026", futureCallUserTime: "3:00 PM", futureCall: "Discuss bid calendar", futureCallHistory: "", salesHStatus: "New", contacts: "1", licenseNumber: "MA-SITE-6820", licenseIssueDate: "05/09/2023", licenseExpireDate: "05/09/2027", salesPackageSentFilter: "X", salesPackageSentDate: "07/02/2026", salesPackageSentUser: "ABrown", contactCount: "1",
  },
  {
    customerId: "1009", customerName: "Pioneer Steel Erectors", customerType: "Structural Steel", salesman: "Maria Santos", status: "Active",
    phone: "(413) 555-0109", email: "field@pioneersteel.example", street: "400 Industry Avenue", city: "Springfield", state: "MA", zip: "01104",
    noCommunication: "", act: "18", lastWeekEnding: "07/18/2026", firstWeekEnding: "09/13/2025", internetSalesReadyUser: "MSantos", internetSalesReadyDate: "09/08/2025", internetSalesReady: "X", lastActionUser: "MSantos", lastActionDate: "07/19/2026", lastAction: "Safety review", futureCallUser: "MSantos", futureCallUserDate: "08/05/2026", futureCallUserTime: "10:30 AM", futureCall: "Fall manpower plan", futureCallHistory: "", salesHStatus: "Current", contacts: "4", licenseNumber: "MA-STEEL-3467", licenseIssueDate: "08/30/2016", licenseExpireDate: "08/30/2026", salesPackageSentFilter: "X", salesPackageSentDate: "09/09/2025", salesPackageSentUser: "MSantos", contactCount: "4",
  },
  {
    customerId: "1010", customerName: "Greenline Landscaping", customerType: "Landscaping", salesman: "David Chen", status: "Active",
    phone: "(860) 555-0110", email: "scheduling@greenlineland.example", street: "72 Park Road", city: "Hartford", state: "CT", zip: "06106",
    noCommunication: "", act: "7", lastWeekEnding: "07/18/2026", firstWeekEnding: "04/04/2026", internetSalesReadyUser: "DChen", internetSalesReadyDate: "03/30/2026", internetSalesReady: "X", lastActionUser: "DChen", lastActionDate: "07/13/2026", lastAction: "Schedule confirmed", futureCallUser: "DChen", futureCallUserDate: "07/31/2026", futureCallUserTime: "9:30 AM", futureCall: "August crew request", futureCallHistory: "", salesHStatus: "Current", contacts: "2", licenseNumber: "CT-LAND-1928", licenseIssueDate: "10/11/2021", licenseExpireDate: "10/11/2026", salesPackageSentFilter: "X", salesPackageSentDate: "03/31/2026", salesPackageSentUser: "DChen", contactCount: "2",
  },
];

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;

  const search = params.search ?? "";
  const salesmanId = params.salesmanId ?? "";
  const customerTypeId = params.customerTypeId ?? "";
  const statusId = params.statusId ?? "";
  const city = params.city ?? "";
  const state = params.state ?? "";
  const sortKey = params.sortKey ?? "";
  const sortDirection = params.sortDirection === "desc" ? "desc" : "asc";
  const customers = DUMMY_CUSTOMERS;
  const [customerUserFlagOptions, officeStaff] = await Promise.all([
    getCustomerUserFlagOptions(),
    getOfficeStaffList(),
  ]);
  const fallbackLastActionUsers: FilterOption[] = Array.from(
    new Set(customers.map((customer) => customer.lastActionUser).filter(Boolean)),
  ).sort().map((value) => ({ value, label: value }));
  const lastActionUsers = officeStaff.length > 0
    ? officeStaff
        .filter((staff) => staff.initials)
        .map((staff) => ({
          value: staff.initials,
          label: `${staff.initials} — ${[staff.firstName, staff.lastName].filter(Boolean).join(" ")}${staff.active ? "" : " (Inactive)"}`,
        }))
    : fallbackLastActionUsers;

  return (
    <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth>
      <CustomerSearchScreen
        customers={customers}
        salesmen={[]}
        customerTypes={[]}
        statuses={[]}
        cities={[]}
        states={[]}
        customerUserFlagOptions={customerUserFlagOptions}
        lastActionUsers={lastActionUsers}
        currentSearch={search}
        currentSalesmanId={salesmanId}
        currentCustomerTypeId={customerTypeId}
        currentStatusId={statusId}
        currentCity={city}
        currentState={state}
        currentSortKey={sortKey}
        currentSortDirection={sortDirection}
        page={1}
        pageSize={10}
        total={customers.length}
        hasMore={false}
      />
    </AppShell>
  );
}
