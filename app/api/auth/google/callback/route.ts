import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { background } from "@/lib/background";
import { attachPendingInvites } from "@/lib/teams";
import { createToken, hashPassword, setAuthCookie } from "@/lib/auth";
import { GOOGLE_OAUTH_COOKIE, GOOGLE_TOKEN_ENDPOINT, googleRedirectUri, safeNext, verifyGoogleIdToken, type GoogleOAuthState } from "@/lib/google-oauth";

function failure(request: Request, code: string, response?: NextResponse) {
  const target = new URL(`/auth/login?oauthError=${encodeURIComponent(code)}`, request.url);
  const result = response ?? NextResponse.redirect(target);
  if (response) result.headers.set("Location", target.toString());
  result.cookies.delete(GOOGLE_OAUTH_COOKIE);
  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const stored = (await cookies()).get(GOOGLE_OAUTH_COOKIE)?.value;
  let flow: GoogleOAuthState | null = null;
  try { flow = stored ? JSON.parse(stored) as GoogleOAuthState : null; } catch { flow = null; }

  if (url.searchParams.get("error")) return failure(request, "cancelled");
  if (!code || !returnedState || !flow || returnedState !== flow.state) return failure(request, "invalid_state");

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return failure(request, "not_configured");

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: googleRedirectUri(), grant_type: "authorization_code", code_verifier: flow.verifier }),
      cache: "no-store",
    });
    const tokens = await tokenResponse.json() as { id_token?: string };
    if (!tokenResponse.ok || !tokens.id_token) return failure(request, "token_exchange");

    const identity = await verifyGoogleIdToken(tokens.id_token, clientId, flow.nonce);
    let user = await prisma.user.findUnique({ where: { email: identity.email } });
    if (!user) {
      if (flow.intent !== "signup") return failure(request, "account_missing");
      user = await prisma.user.create({
        data: {
          email: identity.email,
          emailVerifiedAt: new Date(),
          name: identity.name,
          password: await hashPassword(randomBytes(48).toString("base64url")),
          role: flow.role,
          clientType: flow.clientType,
        },
      });
      await audit({ userId: user.id, role: user.role }, "user.signup_google", "user", user.id, { role: user.role, clientType: user.clientType });
      if (user.role === "TALENT") background("Attach team invitations", () => attachPendingInvites(user!));
    }
    if (user.suspendedAt) return failure(request, "suspended");

    const token = await createToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    await setAuthCookie(token);
    const destination = safeNext(flow.next) ?? (user.role === "CLIENT" ? "/client/dashboard" : "/talent/dashboard");
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.delete(GOOGLE_OAUTH_COOKIE);
    return response;
  } catch (error) {
    console.error("Google authentication error:", error);
    return failure(request, "failed");
  }
}
