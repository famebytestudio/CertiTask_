"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid admin credentials.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred during sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#07192d] text-paper">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-40 right-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-400/5 blur-3xl" />

      <aside className="relative hidden w-[46%] flex-col justify-between border-r border-white/10 p-10 lg:flex xl:p-16">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/app-icon-128.png" alt="CertiTask" width={42} height={42} className="rounded-xl" />
            <span className="text-xl font-bold tracking-tight">Certi<span className="text-gold">Task</span></span>
          </div>
          <div className="mt-28 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Control centre</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-[-0.04em] xl:text-6xl">
              Keep the standard <span className="text-gold">high.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-paper/60">
              Review platform activity, protect certificate integrity, and help every project meet the CertiTask standard.
            </p>
          </div>
          <div className="mt-16 grid max-w-md grid-cols-2 gap-3">
            {["Platform oversight", "Verified credentials", "Secure operations", "Audit-ready records"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-paper/70">
                <span className="mr-2 text-gold">✦</span>{item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-paper/35">© {new Date().getFullYear()} CertiTask · Restricted access</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/app-icon-128.png" alt="CertiTask" width={38} height={38} className="rounded-xl" />
            <span className="text-lg font-bold">Certi<span className="text-gold">Task</span></span>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white p-7 text-navy shadow-2xl shadow-black/20 sm:p-10">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Administrator access</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Welcome back.</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">Sign in to manage the CertiTask platform.</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.7 1.7 3.5-3.5" />
                </svg>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy" htmlFor="login-email">Administrator email</label>
                <div className="input-wrap">
                  <span className="input-icon"><MailIcon /></span>
                  <input id="login-email" type="email" className={`form-input${error ? " has-error" : ""}`} placeholder="admin@certitask.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy" htmlFor="login-password">Password</label>
                <div className="input-wrap">
                  <span className="input-icon"><LockIcon /></span>
                  <input id="login-password" type={showPass ? "text" : "password"} className={`form-input${error ? " has-error" : ""}`} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  <button type="button" className="input-btn" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? "Hide password" : "Show password"}><EyeIcon visible={showPass} /></button>
                </div>
              </div>

              {error && (
                <div className="field-error">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-3.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" id="login-submit" className={`btn-primary mt-2${loading ? " loading" : ""}`} disabled={loading || !email || !password}>
                {loading ? <><span className="spinner" />Authenticating…</> : "Enter admin console"}
              </button>
            </form>
          </div>
          <p className="mt-6 text-center text-xs text-paper/45">
            Not an administrator?{" "}
            <a href="/auth/login" className="font-bold text-gold hover:underline">Return to regular login</a>
          </p>
        </div>
      </main>
    </div>
  );
}
