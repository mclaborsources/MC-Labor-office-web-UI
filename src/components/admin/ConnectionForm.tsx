"use client";
import { useState } from "react";
import type { DatabaseSettings } from "@/lib/config/database";

export function ConnectionForm({ initial }: { initial: DatabaseSettings | null }) {
  const [settings, setSettings] = useState<DatabaseSettings>(initial ?? { server: "", database: "McLabor", user: "mclabor", password: "", instance: "", encrypt: true, trustServerCertificate: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  function update(patch: Partial<DatabaseSettings>) {
    setSettings({ ...settings, ...patch }); setMessage(""); setSuccess(false);
  }
  async function submit(action: "test" | "save") {
    setBusy(true); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/admin/connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, settings }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Connection failed.");
      setSuccess(true);
      setMessage(action === "test" ? "Connection successful. You can save these settings." : "Connection saved.");
      if (action === "save") window.location.assign("/dashboard");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to reach the app."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={(event) => { event.preventDefault(); void submit("save"); }} className="space-y-4">
    <fieldset disabled={busy} className="space-y-4">
      {([ ["server", "Server address", "192.168.4.166"], ["database", "Database", "McLabor"], ["user", "SQL username", "mclabor"], ["password", "SQL password", "Saved office password"], ["instance", "Instance name (optional)", "SQLEXPRESS"] ] as const).map(([key, label, placeholder]) => <label key={key} className="block text-sm font-medium">{label}
        <input className="mt-1 w-full rounded border border-slate-300 p-2" type={key === "password" ? "password" : "text"} autoComplete="off" required={key !== "instance" && key !== "password"} value={settings[key]} placeholder={placeholder} onChange={(event) => update({ [key]: event.target.value })} />
      </label>)}
      <label className="block text-sm font-medium">Port (optional)
        <input className="mt-1 w-full rounded border border-slate-300 p-2" type="number" min={1} max={65535} value={settings.port ?? ""} placeholder="1433" onChange={(event) => update({ port: event.target.value ? Number(event.target.value) : undefined })} />
      </label>
      <p className="text-xs text-slate-600">The office password is supplied automatically. Leave the password field empty to use it, or enter a replacement. Use either a port or an instance name.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.encrypt} onChange={(event) => update({ encrypt: event.target.checked })} />Encrypt connection</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.trustServerCertificate} onChange={(event) => update({ trustServerCertificate: event.target.checked })} />Trust server certificate (skip certificate verification)</label>
      <div className="flex gap-3">
        <button className="rounded border border-slate-400 px-4 py-2 disabled:opacity-50" type="button" onClick={(event) => { if (event.currentTarget.form?.reportValidity()) void submit("test"); }}>Test connection</button>
        <button className="rounded bg-[#7a3338] px-4 py-2 text-white disabled:opacity-50" type="submit">{busy ? "Connecting…" : "Save and continue"}</button>
      </div>
    </fieldset>
    {message && <p role="status" className={success ? "text-sm text-green-700" : "text-sm text-red-700"}>{message}</p>}
    {initial && <a className="inline-block text-sm underline" href="/admin/connection">Cancel</a>}
  </form>;
}
