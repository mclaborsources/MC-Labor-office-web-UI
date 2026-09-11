"use client";
import { useState } from "react";
import type { DatabaseSettings } from "@/lib/config/database";

export function ConnectionForm({ initial }: { initial: DatabaseSettings | null }) {
  const [settings, setSettings] = useState<DatabaseSettings>(initial ?? { server: "", database: "McLabor", user: "mclabor", password: "", instance: "", encrypt: true, trustServerCertificate: true });
  const [busy, setBusy] = useState(false);
  const [cancelled, setCancelled] = useState(false);
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
      setMessage(action === "test" ? "Connection successful. Click OK to save." : "Connection saved.");
      if (action === "save") window.location.assign("/dashboard");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to reach the app."); }
    finally { setBusy(false); }
  }
  const inputClass = "h-7 w-full border border-[#929292] bg-white px-1.5 text-sm text-black shadow-inner focus:outline-2 focus:outline-[#555580]";
  const buttonClass = "min-w-20 border border-[#999] bg-gradient-to-b from-white to-[#dedede] px-4 py-1 text-sm text-black shadow-sm disabled:opacity-50";
  if (cancelled) return <div className="border border-[#89869f] bg-[#c4c2c4] p-8 text-center text-sm">
    <p>Connection setup cancelled. No changes were saved.</p>
    <button type="button" className={`${buttonClass} mt-4`} onClick={() => setCancelled(false)}>Connect to SQL Server</button>
  </div>;
  return <div className="grid gap-3 md:grid-cols-2">
    <form onSubmit={(event) => { event.preventDefault(); void submit("save"); }} className="flex min-h-80 flex-col justify-center border border-[#77738c] bg-[#c4c2c4] p-3">
      <fieldset disabled={busy} className="space-y-2">
        {([["server", "Server", "192.168.4.166"], ["database", "Database", "McLabor"], ["user", "Login", "mclabor"], ["password", "Password", "SQL password"]] as const).map(([key, label, placeholder]) => <label key={key} className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2 text-sm text-black">{label}
          <input autoFocus={key === "server"} className={`${inputClass} ${key === "user" || key === "password" ? "max-w-44" : ""}`} type={key === "password" ? "password" : "text"} autoComplete="off" required={key !== "password"} value={settings[key]} placeholder={placeholder} onChange={(event) => update({ [key]: event.target.value })} />
        </label>)}
        <div className="flex justify-center gap-4 pt-4">
          <button className={buttonClass} type="submit">{busy ? "Connecting…" : "OK"}</button>
          <button className={buttonClass} type="button" onClick={() => { if (initial) window.location.assign("/admin/connection"); else setCancelled(true); }}>Cancel</button>
        </div>
        <details className="pt-4 text-xs text-[#333]">
          <summary className="cursor-pointer">Advanced connection settings</summary>
          <div className="space-y-3 pt-3">
            <label className="block">Instance name (optional)<input className={inputClass} value={settings.instance} placeholder="SQLEXPRESS" onChange={(event) => update({ instance: event.target.value })} /></label>
            <label className="block">Port (optional)<input className={inputClass} type="number" min={1} max={65535} value={settings.port ?? ""} placeholder="1433" onChange={(event) => update({ port: event.target.value ? Number(event.target.value) : undefined })} /></label>
            <p>Use either an instance name or a port.</p>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.encrypt} onChange={(event) => update({ encrypt: event.target.checked })} />Encrypt connection</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.trustServerCertificate} onChange={(event) => update({ trustServerCertificate: event.target.checked })} />Trust server certificate</label>
            <button className={buttonClass} type="button" onClick={(event) => { if (event.currentTarget.form?.reportValidity()) void submit("test"); }}>Test connection</button>
          </div>
        </details>
      </fieldset>
      {message && <p role="status" className={`mt-3 text-sm ${success ? "text-green-800" : "text-red-800"}`}>{message}</p>}
    </form>
    <aside className="border border-[#77738c] bg-[#c4c2c4] p-3 text-sm text-[#38365e]">
      <div className="border border-[#aaa] bg-white text-[#252525]">
        <div className="border-b border-[#aaa] bg-[#fff5b7] px-2 py-1 text-xs">Object Explorer — example</div>
        <div className="space-y-2 p-3 font-mono text-xs">
          <p>▣ <mark className="bg-yellow-200">192.168.4.166</mark></p>
          <p className="pl-4">└ Databases</p>
          <p className="pl-8">└ <mark className="bg-yellow-200">McLabor</mark></p>
        </div>
      </div>
      <div className="mt-3 space-y-3 bg-[#ecebef] p-3 leading-relaxed">
        <p>In Microsoft SQL Server Management Studio, find the server IP address or name and enter it in the <strong>Server</strong> box.</p>
        <p>Find the database name under Databases and enter it in the <strong>Database</strong> box.</p>
        <p>Enter your SQL <strong>Login</strong> and <strong>Password</strong>. Leave the password blank only if an office password is already configured.</p>
        <p>Click <strong>OK</strong> to test and save the connection.</p>
      </div>
    </aside>
  </div>;
}
