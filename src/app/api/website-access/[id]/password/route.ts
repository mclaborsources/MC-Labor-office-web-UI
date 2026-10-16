import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getWebsiteAccessPassword } from "@/lib/websiteAccess";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!session.user?.roles.includes("admin")) return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 });
    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: "Invalid website account." }, { status: 400 });
    const password = await getWebsiteAccessPassword(id);
    if (password === null) return NextResponse.json({ ok: false, error: "Website account not found." }, { status: 404 });
    return NextResponse.json({ ok: true, password }, { headers: { "Cache-Control": "no-store, private" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
  }
}
