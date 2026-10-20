"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Lock,
  LogIn,
  Monitor,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

export default function LoginPage({ officeStaff, initialError = "" }: { officeStaff?: { id: number; name: string }[]; initialError?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const [checkingChange, setCheckingChange] = useState(false);
  const [changeAccount, setChangeAccount] = useState<{ id: number; name: string; currentPassword: string } | null>(null);
  const [message, setMessage] = useState("");

  async function openPasswordChange() {
    if (submitting.current) return;
    const account = officeStaff?.find(staff => staff.id === Number(username));
    if (!account || !password) { setError("Select your account and enter your current password first."); return; }
    submitting.current = true; setCheckingChange(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", officeStaffId: account.id, currentPassword: password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Password change is unavailable.");
      setChangeAccount({ ...account, currentPassword: password });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to reach server."); }
    finally { submitting.current = false; setCheckingChange(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, officeStaffId: officeStaff ? Number(username) : undefined, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed.");
        submitting.current = false;
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.dispatchEvent(new Event("mc-office-session-changed"));
      router.push(data.needsSetup ? "/setup" : data.nextPath ?? "/tracking");
      router.refresh();
    } catch {
      setError("Unable to reach server.");
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mc-login-bg relative min-h-screen lg:grid lg:grid-cols-2">
      <div
        className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-12 py-16"
        aria-hidden
      >
        <div className="mc-login-orb mc-login-orb-1" />
        <div className="mc-login-orb mc-login-orb-2" />
        <div className="mc-login-orb mc-login-orb-3" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center mc-animate-in">
          <Logo size="hero" variant="on-dark" priority className="mb-10" />
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            MC Labor Office Portal
          </h2>
          <p className="mt-3 max-w-sm text-base text-slate-400 leading-relaxed">
            Modern web access for tracking, assignments, and office workflows.
          </p>
          <div className="mt-10 flex flex-col gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Icon icon={Monitor} size="sm" className="text-blue-400" />
              Office staff access
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Building2} size="sm" className="text-blue-400" />
              Side-by-side with Access
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex flex-col items-center text-center lg:hidden mc-animate-in">
            <Logo size="xl" priority className="mb-6" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to the MC Labor office portal.
            </p>
          </div>

          <div className="mc-login-card p-7 sm:p-9 mc-animate-in mc-animate-in-delay-1">
            <div className="mb-7 hidden lg:block">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mc-label" htmlFor="username">{officeStaff ? "Office staff" : "Username"}</label>
                <div className="relative">
                  <Icon
                    icon={User}
                    size="sm"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  {officeStaff ? <select id="username" value={username} onChange={e => setUsername(e.target.value)} className="mc-login-input mc-login-input-icon-left w-full" required disabled={loading || checkingChange || !officeStaff.length}>
                    <option value="">Select your name</option>
                    {officeStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                  </select> : <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mc-login-input mc-login-input-icon-left w-full"
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                  />}
                </div>
              </div>
              <div>
                <label className="mc-label" htmlFor="password">Password</label>
                <div className="flex items-center gap-2"><div className="relative min-w-0 flex-1">
                  <Icon
                    icon={Lock}
                    size="sm"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mc-login-input mc-login-input-icon-left w-full"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                </div>{officeStaff && <button type="button" className="shrink-0 rounded border border-slate-300 bg-white px-3 py-3 text-sm font-medium" disabled={loading || checkingChange} onClick={() => void openPasswordChange()}>{checkingChange ? "Checking…" : "Change"}</button>}</div>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 backdrop-blur-sm mc-animate-in"
                  role="alert"
                >
                  <Icon icon={AlertCircle} size="sm" className="mt-0.5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <Button data-action-status="complete"
                type="submit"
                variant="primary"
                disabled={loading || checkingChange}
                aria-busy={loading}
                className="w-full py-3 text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <span role="status" className="flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      aria-hidden
                    />
                    Logging in…
                  </span>
                ) : (
                  <>
                    <Icon icon={LogIn} size="sm" />
                    Sign in
                    <Icon icon={ArrowRight} size="sm" className="opacity-80" />
                  </>
                )}
              </Button>
            </form>
            {message && <p role="status" className="mt-4 text-sm text-green-800">{message}</p>}
            {changeAccount && <ChangePasswordDialog account={changeAccount} onClose={() => setChangeAccount(null)} onSaved={newPassword => { setPassword(newPassword); setChangeAccount(null); setError(""); setMessage("Password changed. Sign in with your new password."); }} />}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500 lg:hidden mc-animate-in mc-animate-in-delay-2">
            Office staff access · Connected to your office database
          </p>
        </div>
      </div>
    </div>
  );
}
