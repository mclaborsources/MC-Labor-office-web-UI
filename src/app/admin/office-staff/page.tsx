import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AccessButton } from "@/components/access/AccessButton";
import { AccessFieldGrid } from "@/components/access/AccessFieldGrid";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getOfficeStaffList } from "@/lib/admin";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function OfficeStaffPage({ searchParams }: PageProps) {
  const session = await getSessionOrDefault();
  const params = await searchParams;
  const staff = await getOfficeStaffList();
  const selected =
    staff.find((s) => s.staffId === params.id) ?? staff.find((s) => s.active) ?? staff[0];

  return (
    <AppShell userDisplayName={session.user?.displayName}>
      <div className="ac-panel mb-2">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#bcbcbc] bg-[#2a2a2a] px-2 py-1 text-[11px] font-bold text-white">
          <span>Edit Office Staff</span>
          <AccessButton xs disabled className="ml-auto">
            Close
          </AccessButton>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-[#bcbcbc] bg-[#ececec] p-2">
          <AccessButton disabled>New</AccessButton>
          <AccessButton disabled>Save</AccessButton>
          <AccessButton disabled>Modify Permissions</AccessButton>
          <AccessButton disabled>Cancel</AccessButton>
          <AccessButton disabled variant="warn">
            Delete
          </AccessButton>
          <AccessButton disabled>Clear Sort</AccessButton>
          <AccessButton disabled>Modify Permissions by Feature</AccessButton>
        </div>

        <div className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {selected ? (
              <>
                <AccessFieldGrid
                  columns={2}
                  fields={[
                    { label: "First Name", value: selected.firstName },
                    { label: "Last Name", value: selected.lastName },
                    { label: "Initials", value: selected.initials },
                    { label: "Title", value: selected.title },
                    { label: "Password", value: "****" },
                    { label: "Active?", value: selected.active ? "Yes" : "No" },
                    { label: "Profile?", value: selected.profile ? "Yes" : "No" },
                    { label: "Can Delete?", value: selected.canDelete ? "Yes" : "No" },
                    { label: "Email", value: selected.email, wide: true },
                    { label: "Emp Research?", value: selected.employeeResearch ? "Yes" : "No" },
                  ]}
                />
                <p className="mt-2 text-[10px] italic text-[#6a6a6a]">
                  Email permission flags (health ins alarm, AR BCC, tracking report) — read-only
                  list pending; no passwords loaded.
                </p>
              </>
            ) : (
              <p className="text-[11px] italic text-[#6a6a6a]">No office staff records loaded.</p>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="ac-grid mc-scroll-smooth" style={{ maxHeight: "50vh" }}>
              <table>
                <thead>
                  <tr>
                    <th>Initials</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Active?</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.staffId} className={selected?.staffId === s.staffId ? "bg-[#d8e8ff]" : ""}>
                      <td>
                        <Link href={`/admin/office-staff?id=${s.staffId}`} className="font-semibold">
                          {s.initials || "—"}
                        </Link>
                      </td>
                      <td>{s.firstName || "—"}</td>
                      <td>{s.lastName || "—"}</td>
                      <td>{s.active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ac-recordbar">
              <span className="font-mono">Record: 1 of {staff.length}</span>
              <span className="text-[#7a7a7a]">No Filter</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#6a6a6a]">
        Read-only view of <code className="font-mono">tblOfficeStaff</code>. Writes disabled.
      </p>
    </AppShell>
  );
}
