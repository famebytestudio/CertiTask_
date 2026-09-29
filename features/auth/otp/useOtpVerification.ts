"use client";

import { useCallback, useRef, useState } from "react";

export type OtpStatus = "idle" | "verifying" | "success" | "error" | "expired" | "locked";

type VerificationResult = { success: true } | { success: false; message: string };

export function useOtpVerification(onSuccess?: () => void) {
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [resends, setResends] = useState(0);
  const [resending, setResending] = useState(false);
  const requestInFlight = useRef(false);

  const verifyOtp = useCallback(async (code: string): Promise<VerificationResult> => {
    if (requestInFlight.current || status === "success" || lockSeconds > 0) {
      return { success: false, message: "Please wait before trying again." };
    }

    requestInFlight.current = true;
    setStatus("verifying");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setStatus("success");
        onSuccess?.();
        return { success: true };
      }

      if (response.status === 429) {
        setStatus("locked");
        setLockSeconds(60);
        setMessage(result.error || "Too many attempts. Please wait before trying again.");
        return { success: false, message: result.error || "Too many attempts." };
      }

      if (result.expired) {
        setStatus("expired");
        setMessage(result.error || "This code has expired. Request a new one.");
        return { success: false, message: result.error || "This code has expired." };
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setStatus("locked");
        setLockSeconds(60);
        setMessage("Too many incorrect attempts. Try again in 1:00.");
      } else {
        setStatus("error");
        setMessage(`${result.error || "Incorrect code."} ${5 - nextAttempts} ${5 - nextAttempts === 1 ? "attempt" : "attempts"} left.`);
      }
      return { success: false, message: result.error || "Incorrect code." };
    } catch {
      setStatus("error");
      setMessage("We couldn’t reach the server. Check your connection and try again.");
      return { success: false, message: "Network error" };
    } finally {
      requestInFlight.current = false;
    }
  }, [attempts, lockSeconds, onSuccess, status]);

  const resendOtp = useCallback(async () => {
    if (resending || resends >= 3) return { success: false, message: "Resend limit reached." };
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        const error = result.error || "Couldn’t send a new code. Please try again.";
        setMessage(error);
        if (response.status === 429) {
          setStatus("locked");
          setLockSeconds(60);
        }
        return { success: false, message: error };
      }
      setResends((count) => count + 1);
      setAttempts(0);
      setStatus("idle");
      setMessage("");
      setLockSeconds(0);
      return { success: true, alreadyVerified: Boolean(result.alreadyVerified) };
    } catch {
      const error = "We couldn’t reach the server. Check your connection and try again.";
      setMessage(error);
      return { success: false, message: error };
    } finally {
      setResending(false);
    }
  }, [resends, resending]);

  const tickLock = useCallback(() => {
    setLockSeconds((seconds) => {
      if (seconds <= 1) {
        setStatus((current) => current === "locked" ? "idle" : current);
        return 0;
      }
      return seconds - 1;
    });
  }, []);

  return { status, message, attempts, lockSeconds, resends, resending, verifyOtp, resendOtp, tickLock };
}