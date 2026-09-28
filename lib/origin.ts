import { appUrl } from "@/lib/app-url";

export function isSameOrigin(request: Request): boolean {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;

  try {
    const sourceOrigin = new URL(source).origin;
    const requestOrigin = new URL(request.url).origin;
    const configuredOrigin = process.env.APP_URL || process.env.VERCEL_URL ? appUrl() : null;
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
    const forwardedOrigin = forwardedHost
      ? `${forwardedProto || new URL(request.url).protocol.replace(":", "")}://${forwardedHost}`
      : null;

    return sourceOrigin === requestOrigin
      || sourceOrigin === configuredOrigin
      || sourceOrigin === forwardedOrigin;
  } catch {
    return false;
  }
}