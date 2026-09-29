"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BOX_COUNT = 6;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(BOX_COUNT).fill(""));
  const [state, setState] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [destDashboard, setDestDashboard] = useState<string>("/client/dashboard");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── OTP input logic ── */
  function handleChange(index: number, value: string) {
    // Accept paste of all 6 digits at once
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, BOX_COUNT);
      const next = [...pasted.split(""), ...Array(BOX_COUNT).fill("")].slice(0, BOX_COUNT);
      setDigits(next);
      const focus = Math.min(pasted.length, BOX_COUNT - 1);
      inputs.current[focus]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return; // only digits
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < BOX_COUNT - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  /* ── Submit OTP ── */
  async function submit() {
    const otp = digits.join("");
    if (otp.length !== BOX_COUNT || state === "working") return;
    setState("working");
    setMessage("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const json = await res.json();
      if (res.ok) {
        const dest = json.role === "admin"
          ? "/admin/dashboard"
          : json.role === "talent"
          ? "/talent/dashboard"
          : "/client/dashboard";
        setDestDashboard(dest);
        setState("ok");
        // Auto-redirect to the dedicated dashboard after 1.2s
        setTimeout(() => {
          router.push(dest);
          router.refresh();
        }, 1200);
      } else {
        setState("error");
        setMessage(json.error ?? "Incorrect code. Please try again.");
        setDigits(Array(BOX_COUNT).fill(""));
        inputs.current[0]?.focus();
      }
    } catch {
      setState("error");
      setMessage("Network error. Please check your connection.");
    }
  }

  /* ── Resend OTP ── */
  async function resend() {
    if (resendState === "sending" || resendState === "sent") return;
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.ok) {
        setResendState("sent");
        setState("idle");
        setMessage("");
        setDigits(Array(BOX_COUNT).fill(""));
        inputs.current[0]?.focus();
        // Reset "Sent" label after 30 s so user can resend again
        setTimeout(() => setResendState("idle"), 30_000);
      } else {
        const json = await res.json();
        setResendState("error");
        setMessage(json.error ?? "Could not resend. Try again in a moment.");
        setTimeout(() => setResendState("idle"), 5_000);
      }
    } catch {
      setResendState("error");
      setMessage("Network error. Please try again.");
      setTimeout(() => setResendState("idle"), 5_000);
    }
  }

  const isComplete = digits.every((d) => d !== "");

  /* ── Styles ── */
  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "40px 36px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: "var(--shadow-md)",
  };

  /* ── Success state ── */
  if (state === "ok") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 20 }}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 8px" }}>Email verified!</h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 24px" }}>
            Redirecting you to your dashboard…
          </p>
          <Link href={destDashboard} style={{ display: "inline-block", padding: "11px 28px", background: "var(--navy)", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── OTP entry state ── */
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: 20 }}>
      <div style={card}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", margin: "0 0 8px" }}>Check your email</h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 28px" }}>
          We sent a 6-digit code to your email address. Enter it below — it expires in&nbsp;15&nbsp;minutes.
        </p>

        {/* OTP digit boxes */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              disabled={state === "working"}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              style={{
                width: 46,
                height: 54,
                textAlign: "center",
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "monospace",
                border: `2px solid ${state === "error" ? "#E53E3E" : d ? "var(--navy)" : "var(--border)"}`,
                borderRadius: 10,
                outline: "none",
                color: "var(--navy)",
                background: state === "working" ? "#F7F8FA" : "#fff",
                transition: "border-color 0.15s",
              }}
            />
          ))}
        </div>

        {/* Error / resent message */}
        {message && (
          <p style={{ fontSize: 13, color: state === "error" ? "#E53E3E" : "#2F855A", margin: "0 0 16px", fontWeight: 500 }}>
            {message}
          </p>
        )}
        {resendState === "sent" && !message && (
          <p style={{ fontSize: 13, color: "#2F855A", margin: "0 0 16px", fontWeight: 500 }}>
            ✓ A new code has been sent to your email.
          </p>
        )}

        {/* Verify button */}
        <button
          type="button"
          onClick={submit}
          disabled={!isComplete || state === "working"}
          style={{
            width: "100%",
            padding: "12px 0",
            background: isComplete && state !== "working" ? "var(--navy)" : "#C5CCD6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 15,
            cursor: isComplete && state !== "working" ? "pointer" : "not-allowed",
            marginBottom: 16,
            transition: "background 0.15s",
          }}
        >
          {state === "working" ? "Verifying…" : "Verify email"}
        </button>

        {/* Resend link */}
        <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 4px" }}>
          {"Didn't receive it? "}
          <button
            type="button"
            onClick={resend}
            disabled={resendState === "sending" || resendState === "sent"}
            style={{
              background: "none",
              border: "none",
              color: resendState === "sent" ? "#2F855A" : "var(--navy)",
              fontWeight: 700,
              fontSize: 13,
              cursor: resendState === "sending" || resendState === "sent" ? "default" : "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {resendState === "sending" ? "Sending…" : resendState === "sent" ? "Sent!" : "Resend code"}
          </button>
        </p>

        <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 16 }}>
          <Link href="/auth/login" style={{ color: "var(--ink-muted)" }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
