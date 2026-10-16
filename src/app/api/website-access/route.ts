import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getWebsiteAccessRows } from "@/lib/websiteAccess";

async function requireAdmin() {
  const session = await requireSession();
  if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required.");
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ ok: true, rows: await getWebsiteAccessRows() });
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Unable to load website accounts.";
    return NextResponse.json({ ok: false, error }, { status: error === "Administrator sign-in required." ? 403 : 500 });
  }
}
