"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function getPasswordStrength(pwd: string): { level: number; label: string } {
  if (!pwd) return { level: 0, label: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return { level: score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
}

const STRENGTH_CLASS = ["", "weak", "fair", "good", "strong"];

export default function ResetPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"code" | "password" | "done">("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(password);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      window.setTimeout(() => {
        setCode(token);
        setStep("password");
      }, 0);
    }
  }, []);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStep("password");
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to reset password.");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-centered">
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        border: "1px solid rgba(201,162,39,0.08)",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: "50%",
        border: "1px solid rgba(201,162,39,0.12)",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
      }} />

      <div className="auth-centered-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Image src="/app-icon-256.png" alt="CertiTask" width={52} height={52} style={{ borderRadius: 14 }} />
        </div>

        {/* ── Step 1: Enter Code ── */}
        {step === "code" && (
          <>
            <h1 className="auth-heading" style={{ textAlign: "center" }}>Enter reset code</h1>
            <p className="auth-sub" style={{ textAlign: "center", marginBottom: 28 }}>
              Paste the reset token from your email to continue.
            </p>

            <form onSubmit={handleVerifyCode} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-code">Reset code</label>
                <div className="input-wrap">
                  <span className="input-icon"><KeyIcon /></span>
                  <input
                    id="reset-code"
                    type="text"
                    maxLength={128}
                    className={`form-input${error ? " has-error" : ""}`}
                    placeholder="Paste reset token from your email"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    style={{ letterSpacing: "0.05em", fontWeight: 600 }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                {error && <span className="field-error">{error}</span>}
              </div>

              <button
                type="submit"
                id="verify-code-submit"
                className={`btn-primary mt-4${loading ? " loading" : ""}`}
                disabled={loading || code.length < 20}
              >
                {loading ? <><span className="spinner" />Continuing…</> : "Continue"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Link href="/auth/forgot-password" style={{ fontSize: 13, color: "var(--ink-subtle)", textDecoration: "none" }}>
                ← Resend code
              </Link>
            </div>
          </>
        )}

        {/* ── Step 2: New Password ── */}
        {step === "password" && (
          <>
            <h1 className="auth-heading" style={{ textAlign: "center" }}>Set new password</h1>
            <p className="auth-sub" style={{ textAlign: "center", marginBottom: 28 }}>
              Choose a strong password you haven&apos;t used before.
            </p>

            <form onSubmit={handleResetPassword} noValidate>
              {/* New password */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New password</label>
                <div className="input-wrap">
                  <span className="input-icon"><LockIcon /></span>
                  <input
                    id="new-password"
                    type={showPass ? "text" : "password"}
                    className={`form-input${error ? " has-error" : ""}`}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="input-btn" onClick={() => setShowPass(v => !v)}>
                    <EyeIcon visible={showPass} />
                  </button>
                </div>
                {password && (
                  <>
                    <div className="password-strength">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`strength-bar${i <= strength.level ? ` ${STRENGTH_CLASS[strength.level]}` : ""}`} />
                      ))}
                    </div>
                    {strength.label && <span className="strength-label">{strength.label} password</span>}
                  </>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm password</label>
                <div className="input-wrap">
                  <span className="input-icon"><LockIcon /></span>
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    className={`form-input${error ? " has-error" : ""}`}
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="input-btn" onClick={() => setShowConfirm(v => !v)}>
                    <EyeIcon visible={showConfirm} />
                  </button>
                </div>
                {error && <span className="field-error">{error}</span>}
              </div>

              <button
                type="submit"
                id="reset-password-submit"
                className={`btn-primary btn-gold mt-4${loading ? " loading" : ""}`}
                disabled={loading || !password || !confirm}
              >
                {loading ? <><span className="spinner" />Resetting…</> : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div className="success-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 className="auth-heading" style={{ textAlign: "center", marginBottom: 10 }}>
              Password reset!
            </h2>
            <p className="auth-sub" style={{ textAlign: "center", marginBottom: 28 }}>
              Your password has been successfully updated. You can now sign in with your new password.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={() => router.push("/auth/login")}
              id="goto-login-btn"
            >
              Go to Login
            </button>
          </div>
        )}

        {step !== "done" && (
          <p className="auth-nav-text">
            Remember your password?{" "}
            <Link href="/auth/login" className="auth-link">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
