import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getDatabaseSettings } from "@/lib/config/database";
import { getInsuranceCertificateRequestRows, type CertificateRequestRange } from "@/lib/insuranceCertificateRequestSearch";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    if (!getDatabaseSettings()) return NextResponse.json({ ok: false, error: "The SQL Server connection is not configured. An administrator needs to configure it in Setup before this report can load records." }, { status: 503 });
    const rangeRaw = request.nextUrl.searchParams.get("range") ?? "recent";
    if (!["recent", "last2", "all"].includes(rangeRaw)) return NextResponse.json({ ok: false, error: "Choose a valid request range." }, { status: 400 });
    const rows = await getInsuranceCertificateRequestRows(rangeRaw as CertificateRequestRange);
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: status === 401 ? "Sign-in required." : "Insurance certificate requests could not be loaded from SQL Server." }, { status });
  }
}
