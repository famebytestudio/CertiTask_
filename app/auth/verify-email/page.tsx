"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"ready" | "working" | "ok" | "error">(token ? "ready" : "error");
  const [message, setMessage] = useState(token ? "Click below to confirm your email address." : "This link is missing its token.");

  async function verify() {
    if (!token || state !== "ready") return;
    setState("working");
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const json = await res.json();
      if (res.ok) setState("ok"); else { setState("error"); setMessage(json.error ?? "This link is invalid or has expired."); }
    } catch {
      setState("error"); setMessage("Network error. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 20 }}>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: 36, maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{state === "working" ? "⏳" : state === "ok" ? "✅" : state === "ready" ? "✉️" : "⚠️"}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 8px" }}>
          {state === "working" ? "Confirming your email…" : state === "ok" ? "Email confirmed" : state === "ready" ? "Confirm your email" : "Link not valid"}
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 20px" }}>
          {state === "ok" ? "You can now apply to projects or post them. Next step: identity verification in your dashboard." : message}
        </p>
        {state === "ready" && <button type="button" onClick={verify} style={{ display: "inline-block", padding: "10px 22px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>
          Confirm email
        </button>}
        <Link href="/auth/login" style={{ display: "inline-block", padding: "10px 22px", background: "var(--navy)", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmail /></Suspense>;
}
