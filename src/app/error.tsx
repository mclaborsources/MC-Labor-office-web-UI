"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application page error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", padding: 32, background: "#d8d8d8", color: "#111", fontFamily: "Arial, sans-serif" }}>
      <section role="alert" style={{ maxWidth: 720, padding: 24, border: "1px solid #999", background: "#fff" }}>
        <h1 style={{ marginTop: 0 }}>This page ran into a problem</h1>
        <p>Your work on other pages is still available. Try loading this page again.</p>
        {process.env.NODE_ENV === "development" && <pre style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap", color: "#a00" }}>{error.message}</pre>}
        {error.digest && <p>Reference: {error.digest}</p>}
        <button onClick={reset} style={{ padding: "6px 12px" }}>Try again</button>
        <button onClick={() => window.location.assign("/")} style={{ padding: "6px 12px", marginLeft: 8 }}>Go to main menu</button>
      </section>
    </main>
  );
}
