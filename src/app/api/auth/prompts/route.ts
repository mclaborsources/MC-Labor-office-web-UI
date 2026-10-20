import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readLoginPrompts, saveLoginNote } from "@/lib/auth/login-prompts";
import { hasSameOrigin } from "@/lib/auth/origin";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.officeStaffId) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
    return NextResponse.json(await readLoginPrompts(session), { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Login notices could not be loaded. Please retry." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user?.officeStaffId) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
    const body = await request.json();
    if (body.action === "note") {
      if (!session.loginNoteDate) return NextResponse.json({ error: "No login note is pending." }, { status: 409 });
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (!note || note.length > 2000) return NextResponse.json({ error: "Enter a note (up to 2,000 characters)." }, { status: 400 });
      await saveLoginNote(session.user, session.loginNoteDate, note, "Login Late");
      session.loginNoteDate = undefined;
      session.needsLoginPrompts = !!session.loginRemindersPending;
    } else if (body.action === "complete") {
      if (session.loginNoteDate) return NextResponse.json({ error: "Save your login note first." }, { status: 409 });
      session.loginRemindersPending = false;
      session.needsLoginPrompts = false;
    } else return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    await session.save();
    if (!session.needsLoginPrompts) {
      revalidatePath("/login");
      revalidatePath("/dashboard");
    }
    return NextResponse.json({ ok: true, complete: !session.needsLoginPrompts });
  } catch { return NextResponse.json({ error: "Login notice could not be saved. Please retry." }, { status: 503 }); }
}
