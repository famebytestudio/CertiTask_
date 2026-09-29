"use client";

import { useEffect, useState } from "react";
import { OtpInput } from "./OtpInput";
import { useOtpVerification } from "./useOtpVerification";

type OtpVerificationProps = {
  destination: string;
  onVerified: () => void;
  onChangeDestination?: () => void;
  length?: number;
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 1)}${"•".repeat(Math.min(5, Math.max(3, name.length - 1)))}@${domain}`;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function OtpVerification({ destination, onVerified, onChangeDestination, length = 6 }: OtpVerificationProps) {
  const [code, setCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(45);
  const [toast, setToast] = useState("");
  const { status, message, lockSeconds, resends, resending, verifyOtp, resendOtp, tickLock } = useOtpVerification(onVerified);
  const locked = status === "locked" && lockSeconds > 0;
  const isDisabled = status === "verifying" || status === "success" || locked;
  const canResend = resendSeconds === 0 && !resending && resends < 3;
  const progress = Math.max(0, resendSeconds / 45);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (!lockSeconds) return;
    const timer = window.setTimeout(tickLock, 1000);
    return () => window.clearTimeout(timer);
  }, [lockSeconds, tickLock]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleResend() {
    const result = await resendOtp();
    if (result.success) {
      setCode("");
      setResendSeconds(45);
      setToast(result.alreadyVerified ? "Your email is already verified." : "New code sent");
      if (result.alreadyVerified) onVerified();
    }
  }

  const expired = status === "expired";
  const success = status === "success";

  return (
    <div className="otp-page">
      <div className="otp-backdrop otp-backdrop-one" />
      <div className="otp-backdrop otp-backdrop-two" />
      <section className={`otp-card${status === "error" ? " has-error" : ""}`} aria-labelledby="otp-heading">
        <div className={`otp-emblem${success ? " is-success" : ""}`} aria-hidden="true">
          {success ? (
            <svg viewBox="0 0 48 48" className="otp-success-icon"><path d="m13 25 7 7 16-17" /></svg>
          ) : (
            <svg viewBox="0 0 48 48" className="otp-shield-icon"><path d="M24 5 39 11v11c0 10-6.3 16.7-15 21-8.7-4.3-15-11-15-21V11L24 5Z" /><path d="M18 24h12M24 18v12" /></svg>
          )}
        </div>

        <p className="otp-eyebrow">ACCOUNT SECURITY</p>
        <h1 id="otp-heading">{success ? "You’re verified" : expired ? "Code expired" : "Verify your account"}</h1>
        <p className="otp-description">
          {success
            ? "Your email is confirmed. Taking you to your account…"
            : expired
              ? "That code has expired. Request a fresh code to continue."
              : <>We sent a 6-digit code to <strong>{maskEmail(destination)}</strong>{onChangeDestination && <> <button type="button" className="otp-text-button" onClick={onChangeDestination}>Change</button></>}.</>}
        </p>

        {!expired && (
          <>
            <OtpInput
              length={length}
              value={code}
              onChange={setCode}
              onComplete={(value) => void verifyOtp(value)}
              status={status}
              disabled={isDisabled}
            />
            <div className="otp-status-slot" aria-live="polite" aria-atomic="true">
              {status === "verifying" && <span className="otp-status-working"><span className="otp-spinner" />Checking your code…</span>}
              {status === "error" && <span className="otp-status-error">{message}</span>}
              {status === "locked" && <span className="otp-status-error">{message} {lockSeconds > 0 && `(${formatTime(lockSeconds)})`}</span>}
              {success && <span className="otp-status-success">Email verified successfully.</span>}
            </div>
            <button
              className="otp-submit"
              type="button"
              disabled={code.length !== length || isDisabled}
              onClick={() => void verifyOtp(code)}
            >
              {status === "verifying" ? <><span className="otp-spinner" />Verifying</> : success ? "Verified" : "Verify email"}
              {status !== "verifying" && !success && <span aria-hidden="true">→</span>}
            </button>
          </>
        )}

        {expired && <div className="otp-status-slot otp-status-error" aria-live="polite">{message}</div>}

        <div className="otp-resend-row">
          {resends >= 3 ? (
            <p className="otp-resend-limit">You’ve used all 3 code requests. Please try again later.</p>
          ) : canResend || expired ? (
            <button className="otp-resend-button" type="button" onClick={() => void handleResend()} disabled={resending || locked}>
              {resending ? <><span className="otp-spinner" />Sending…</> : "Request new code"}
            </button>
          ) : (
            <div className="otp-countdown" aria-live="polite">
              <svg className="otp-countdown-ring" viewBox="0 0 36 36" aria-hidden="true">
                <circle className="otp-countdown-track" cx="18" cy="18" r="15.5" />
                <circle className="otp-countdown-progress" cx="18" cy="18" r="15.5" style={{ strokeDashoffset: `${97.4 * (1 - progress)}` }} />
              </svg>
              <span>Resend code in <strong>{formatTime(resendSeconds)}</strong></span>
            </div>
          )}
        </div>

        <p className="otp-footnote">Check your spam folder if it doesn’t arrive.</p>
        {toast && <div className="otp-toast" role="status">{toast}</div>}
        <div className="otp-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
      </section>
    </div>
  );
}

export const otpVerificationProps = {
  destination: "Email address shown in masked form",
  onVerified: "Called after successful verification",
  onChangeDestination: "Optional callback for changing the email address",
  length: "Code length; defaults to 6",
};