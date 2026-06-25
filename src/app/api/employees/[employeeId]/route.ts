import { NextResponse } from "next/server";
import { getEmployeeById } from "@/lib/employees";
import type { ApiDetailResponse } from "@/types/search";
import type { EmployeeDetail } from "@/types/employee";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
): Promise<NextResponse<ApiDetailResponse<EmployeeDetail>>> {
  try {
    const { employeeId } = await params;

    if (!employeeId) {
      return NextResponse.json({ ok: false, data: null, error: "Employee ID is required." }, { status: 400 });
    }

    const employee = await getEmployeeById(employeeId);

    if (!employee) {
      return NextResponse.json({ ok: false, data: null, error: "Employee not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: employee });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load employee.";
    console.error("[api/employees/[employeeId]]", err);
    return NextResponse.json({ ok: false, data: null, error: message }, { status: 500 });
  }
}
