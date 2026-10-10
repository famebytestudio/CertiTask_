import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { appUrl } from "@/lib/app-url";

export const GOOGLE_OAUTH_COOKIE = "certitask_google_oauth";
export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleOAuthState = {
  state: string;
  nonce: string;
  verifier: string;
  intent: "signin" | "signup";
  role: "CLIENT" | "TALENT";
  clientType: "INDIVIDUAL" | "ORGANIZATION" | null;
  next: string | null;
};

const base64url = (value: Buffer) => value.toString("base64url");
export const randomOAuthValue = () => base64url(randomBytes(32));
export const pkceChallenge = (verifier: string) => base64url(createHash("sha256").update(verifier).digest());
export const googleRedirectUri = () => `${appUrl()}/api/auth/google/callback`;

export function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (value.startsWith("/auth/") || value.startsWith("/admin/")) return null;
  return value;
}

export async function verifyGoogleIdToken(idToken: string, clientId: string, nonce: string) {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    algorithms: ["RS256"],
  });
  if (payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== "string" || typeof payload.sub !== "string") {
    throw new Error("Google identity claims are invalid");
  }
  return {
    subject: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 120) : payload.email.split("@")[0],
  };
}
