"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpVerification } from "@/features/auth/otp/OtpVerification";

type SessionUser = { email: string; role: "client" | "talent" };

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("Session required");
        return response.json();
      })
      .then((result) => {
        if (active && result.user) setUser(result.user);
        else if (active) router.replace("/auth/login");
      })
      .catch(() => {
        if (active) router.replace("/auth/login");
      });
    return () => { active = false; };
  }, [router]);

  const handleVerified = useCallback(() => {
    window.setTimeout(() => {
      router.replace(user?.role === "client" ? "/client/dashboard" : "/talent/dashboard");
      router.refresh();
    }, 1500);
  }, [router, user?.role]);

  if (!user) {
    return <div className="otp-page"><div className="otp-card otp-loading-card" role="status"><span className="otp-spinner" /> Securing your account…</div></div>;
  }

  return <OtpVerification destination={user.email} onVerified={handleVerified} onChangeDestination={() => router.push("/auth/signup")} />;
}