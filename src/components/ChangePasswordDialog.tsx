"use client";
import { useRef, useState } from "react";

export function ChangePasswordDialog({ account, onClose, onSaved }: {
  account: { id: number; name: string; currentPassword: string };
  onClose: () => void; onSaved: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", officeStaffId: account.id, currentPassword: account.currentPassword, newPassword: password, confirmPassword: confirmation }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Password could not be changed.");
      onSaved(password);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to reach the server."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="change-password-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onKeyDown={event => { if (event.key === "Escape" && !busy) onClose(); }}>
      <h2 id="change-password-title" className="text-lg font-semibold">Change Password — {account.name}</h2>
      <p className="mt-2 text-sm text-slate-600">This changes your password for both Access and the web app.</p>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="block text-sm">New Password<input autoFocus className="mc-login-input mt-1 w-full" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} maxLength={1024} /></label>
        <label className="block text-sm">Verify Password<input className="mc-login-input mt-1 w-full" type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={busy} maxLength={1024} /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={busy} className="rounded border px-4 py-2">Cancel</button><button type="submit" disabled={busy} aria-busy={busy} className="rounded bg-blue-700 px-4 py-2 text-white">{busy ? "Saving…" : "OK"}</button></div>
      </form>
    </section>
  </div>;
}
