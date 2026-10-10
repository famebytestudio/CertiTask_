import { NextResponse } from "next/server";
import { GOOGLE_AUTH_ENDPOINT, GOOGLE_OAUTH_COOKIE, googleRedirectUri, pkceChallenge, randomOAuthValue, safeNext, type GoogleOAuthState } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/auth/login?oauthError=not_configured", request.url));
  }

  const requestUrl = new URL(request.url);
  const intent = requestUrl.searchParams.get("intent") === "signup" ? "signup" : "signin";
  const role = requestUrl.searchParams.get("role") === "client" ? "CLIENT" : "TALENT";
  const clientType = role === "CLIENT" && requestUrl.searchParams.get("clientType") === "ORGANIZATION" ? "ORGANIZATION" : role === "CLIENT" ? "INDIVIDUAL" : null;
  const state: GoogleOAuthState = {
    state: randomOAuthValue(),
    nonce: randomOAuthValue(),
    verifier: randomOAuthValue(),
    intent,
    role,
    clientType,
    next: safeNext(requestUrl.searchParams.get("next")),
  };

  const authorizationUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: state.state,
    nonce: state.nonce,
    code_challenge: pkceChallenge(state.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
