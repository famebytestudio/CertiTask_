"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"working" | "ok" | "error">(token ? "working" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email address…" : "This link is missing its token.");
  const called = useRef(false);

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok) {
          setState("ok");
        } else {
          setState("error");
          setMessage(json.error ?? "This link is invalid or has expired.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 20 }}>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: 36, maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>
          {state === "working" ? "⏳" : state === "ok" ? "✅" : "⚠️"}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 8px" }}>
          {state === "working" ? "Confirming your email…" : state === "ok" ? "Email confirmed!" : "Link not valid"}
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 20px" }}>
          {state === "ok"
            ? "You can now apply to projects or post them. Next step: identity verification in your dashboard."
            : message}
        </p>
        <Link
          href={state === "ok" ? "/dashboard" : "/auth/login"}
          style={{ display: "inline-block", padding: "10px 22px", background: "var(--navy)", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}
        >
          {state === "ok" ? "Go to dashboard" : "Go to sign in"}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmail /></Suspense>;
}
