"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginPrompts } from "@/types/login-prompts";

export function LoginNotices({ initial }: { initial: LoginPrompts }) {
  const router = useRouter();
  const [prompts, setPrompts] = useState(initial);
  const [note, setNote] = useState("Late");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (navigationTimer.current) clearTimeout(navigationTimer.current); }, []);
  function openMenu() {
    setBusy(true);
    setError("");
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    navigationTimer.current = setTimeout(() => {
      setBusy(false);
      setError("Your notices are saved. Click Open Main Menu to retry opening the menu.");
    }, 15000);
    router.replace("/dashboard");
  }
  const late = !!prompts.noteDate;
  const due = prompts.reminders.filter(row => row.days !== null && row.days <= 0).length;
  async function proceed() {
    if (busy) return;
    if (completed) { openMenu(); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(late ? { action: "note", note } : { action: "complete" }), signal: AbortSignal.timeout(15000) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save the notice.");
      if (payload.complete) { setCompleted(true); openMenu(); return; }
      setPrompts(current => ({ ...current, noteDate: undefined }));
      setBusy(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the notice."); setBusy(false); }
  }
  return <main className="login-notices-backdrop">
    <section role="dialog" aria-modal="true" aria-labelledby="login-notice-title" className={`login-notice-window ${late ? "login-notice-late" : "login-notice-reminders"}`}>
      <header id="login-notice-title">{late ? "Login Late Notes" : "Reminder Notice"}</header>
      {late ? <form onSubmit={event => { event.preventDefault(); void proceed(); }}>
        <div className="login-notice-greeting"><div>{prompts.greeting} {prompts.displayName.split(" ")[0]},<br />Please note why you are logging in late.</div><button disabled={busy || !note.trim()} type="submit">{busy ? "Saving…" : "OK"}</button></div>
        <div className="login-notice-instructions">Select a Note from the dropdown list.<br />Or, if your reason is not in the list, you may type your own reason directly into the dropdown list box.</div>
        <div className="login-notice-note-grid"><div>Date</div><div>Note</div><input aria-label="Login date" readOnly value={prompts.noteDate?.split("-").slice(1).concat(prompts.noteDate.split("-")[0]).join("/") ?? ""} /><input aria-label="Reason for logging in late" autoFocus list="login-note-reasons" value={note} maxLength={2000} onChange={event => setNote(event.target.value)} disabled={busy} required /><datalist id="login-note-reasons">{prompts.reasons.map(reason => <option key={reason} value={reason} />)}</datalist></div>
        {error && <p role="alert" className="login-notice-error">{error}</p>}
        <footer>Record: 1 of 1</footer>
      </form> : <>
        <h1 className={due ? "login-notice-due" : ""}>{due === 0 ? "Nothing needs to be Renewed" : `${due} ${due === 1 ? "Item needs" : "Items need"} to be Renewed`}</h1>
        <div className="login-notice-reminder-list"><table><thead><tr><th>Item</th><th>Days to Renewal</th></tr></thead><tbody>{prompts.reminders.map(row => <tr key={row.id}><td>{row.item}</td><td>{row.days ?? "—"}</td></tr>)}{!prompts.reminders.length && <tr><td colSpan={2}>No renewal reminders.</td></tr>}</tbody></table></div>
        {error && <p role="alert" className="login-notice-error">{error}</p>}
        <div className="login-notice-actions"><button autoFocus disabled={busy} onClick={() => void proceed()}>{busy ? "Opening menu…" : completed ? "Open Main Menu" : "OK"}</button></div>
        <footer>Record: {prompts.reminders.length ? `1 of ${prompts.reminders.length}` : "0 of 0"}</footer>
      </>}
    </section>
  </main>;
}
