"use client";

import { useRouter } from "next/navigation";

export function EmployeeNameCell({ employeeId, name }: { employeeId: string; name: string }) {
  const router = useRouter();
  return <span className="employee-name-open" title="Double-click to open employee" onDoubleClick={() => router.push(`/employees/${employeeId}`)}>{name || "—"}</span>;
}
