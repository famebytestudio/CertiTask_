"use client";

import { useEffect, useRef } from "react";
import type { OtpStatus } from "./useOtpVerification";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  status?: OtpStatus;
  disabled?: boolean;
  autoSubmit?: boolean;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  status = "idle",
  disabled = false,
  autoSubmit = true,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (status !== "error") return;
    const timer = window.setTimeout(() => {
      onChange("");
      refs.current[0]?.focus();
    }, 480);
    return () => window.clearTimeout(timer);
  }, [onChange, status]);

  useEffect(() => {
    if (disabled || !("OTPCredential" in window) || !navigator.credentials) return;
    const controller = new AbortController();
    const credentials = navigator.credentials as CredentialsContainer & {
      get(options?: CredentialRequestOptions & { otp?: { transport: string[] } }): Promise<Credential | null>;
    };
    credentials.get({ otp: { transport: ["sms"] }, signal: controller.signal } as CredentialRequestOptions & { otp: { transport: string[] } })
      .then((credential) => {
        const code = (credential as (Credential & { code?: string }) | null)?.code;
        if (!code) return;
        const digits = code.replace(/\D/g, "").slice(0, length);
        onChange(digits);
        if (autoSubmit && digits.length === length) completeRef.current?.(digits);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [autoSubmit, disabled, length, onChange]);

  function update(nextValue: string) {
    const digits = nextValue.replace(/\D/g, "").slice(0, length);
    onChange(digits);
    if (autoSubmit && digits.length === length) completeRef.current?.(digits);
  }

  function handleInput(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = value.split("");
      next[index] = "";
      update(next.join(""));
      return;
    }
    const next = value.split("");
    digits.slice(0, length - index).split("").forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    update(next.join(""));
    refs.current[Math.min(index + digits.length, length - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      const next = value.split("");
      if (next[index]) next[index] = "";
      else if (index > 0) {
        next[index - 1] = "";
        refs.current[index - 1]?.focus();
      }
      update(next.join(""));
    } else if (event.key === "Delete") {
      const next = value.split("");
      next[index] = "";
      update(next.join(""));
    }
  }

  return (
    <div className={`otp-inputs otp-inputs-${length} otp-state-${status}`} role="group" aria-label={`${length}-digit verification code`}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => { refs.current[index] = element; }}
          className={`otp-digit${value[index] ? " is-filled" : ""}`}
          type="text"
          value={value[index] || ""}
          aria-label={`Digit ${index + 1} of ${length}`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          disabled={disabled}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => {
            event.preventDefault();
            handleInput(index, event.clipboardData.getData("text"));
          }}
        />
      ))}
    </div>
  );
}