"use client";

type Props = {
  intent: "signin" | "signup";
  role?: "client" | "talent";
  clientType?: "INDIVIDUAL" | "ORGANIZATION";
};

export function GoogleAuthButton({ intent, role, clientType }: Props) {
  function begin() {
    const params = new URLSearchParams({ intent });
    if (role) params.set("role", role);
    if (role === "client" && clientType) params.set("clientType", clientType);
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) params.set("next", next);
    // OAuth must leave the Next.js client router and perform a full redirect.
    const authUrl = new URL("/api/auth/google", window.location.origin);
    authUrl.search = params.toString();
    window.location.href = authUrl.toString();
  }

  return (
    <button type="button" className="google-auth-button" onClick={begin}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 01-1.94 2.94v2.53h3.14c1.84-1.69 2.91-4.19 2.91-7.31Z"/><path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.44-2.36l-3.14-2.53c-.87.58-1.98.93-3.3.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.61A9.74 9.74 0 0012 21.75Z"/><path fill="#FBBC05" d="M6.56 13.78A5.86 5.86 0 016.25 12c0-.62.11-1.22.31-1.78V7.61H3.32A9.74 9.74 0 002.25 12c0 1.57.38 3.06 1.07 4.39l3.24-2.61Z"/><path fill="#EA4335" d="M12 6.21c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.36 9.36 0 0012 2.25a9.74 9.74 0 00-8.68 5.36l3.24 2.61c.77-2.3 2.91-4.01 5.44-4.01Z"/></svg>
      Continue with Google
    </button>
  );
}
