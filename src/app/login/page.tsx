"use client";

import { useState } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed.");
        return;
      }

      router.push("/tracking");
      router.refresh();
    } catch {
      setError("Unable to reach server.");
    } finally {
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
              Read-only Phase 1
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
                <label className="mc-label" htmlFor="username">Username</label>
                <div className="relative">
                  <Icon
                    icon={User}
                    size="sm"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mc-login-input mc-login-input-icon-left w-full"
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mc-label" htmlFor="password">Password</label>
                <div className="relative">
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
                </div>
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

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-3 text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      aria-hidden
                    />
                    Signing in…
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
          </div>

          <p className="mt-8 text-center text-xs text-slate-500 lg:hidden mc-animate-in mc-animate-in-delay-2">
            Read-only Phase 1 · Side-by-side with Access
          </p>
        </div>
      </div>
    </div>
  );
}
