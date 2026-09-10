"use client";
import { useState } from "react";

export function AccountSetupForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (fields.get("password") !== fields.get("confirm")) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/setup/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fields)) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save your account.");
      window.location.assign("/setup");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to reach the app."); }
    finally { setBusy(false); }
  }}>
    <fieldset disabled={busy} className="space-y-4">
      <label className="block text-sm font-medium">Administrator username<input autoFocus required name="username" autoComplete="username" maxLength={100} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
      <label className="block text-sm font-medium">Password<input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
      <label className="block text-sm font-medium">Confirm password<input required name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
      <p className="text-xs text-slate-600">Use at least 8 characters. This is your app login; SQL Server credentials are entered in the next form.</p>
      <button type="submit" className="w-full rounded bg-[#7a3338] px-4 py-2 text-white">{busy ? "Saving…" : "Continue to database connection"}</button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>;
}
