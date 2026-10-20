"use client";
import { useEffect, useState } from "react";

export function OfficeUserPresence() {
  const [names, setNames] = useState<string[] | null>(null);
  useEffect(() => {
    let active = true;
    async function update() {
      try {
        const response = await fetch("/api/auth/presence", { cache: "no-store" });
        if (!response.ok) throw new Error("Unavailable");
        const payload = await response.json() as { users: { name: string }[] };
        if (active) setNames(payload.users.map(user => user.name));
      } catch { if (active) setNames(null); }
    }
    void update();
    const timer = setInterval(() => void update(), 30_000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const text = names === null ? "Login activity unavailable" : names.length ? names.join(", ") : "No other users";
  return <span className="ac-tracking-users-value" title={text}>{text}</span>;
}
