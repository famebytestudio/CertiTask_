import { appUrl } from "@/lib/app-url";

export function isSameOrigin(request: Request): boolean {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;

  try {
    const sourceOrigin = new URL(source).origin;
    const requestUrl = new URL(request.url);
    const configuredOrigin = process.env.APP_URL || process.env.VERCEL_URL ? appUrl() : null;
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",", 1)[0]
      ?.trim();
    const protocol = forwardedProto || requestUrl.protocol.slice(0, -1);
    const hostOrigins = [
      request.headers.get("x-forwarded-host"),
      request.headers.get("host"),
    ]
      .map((host) => host?.split(",", 1)[0]?.trim())
      .filter((host): host is string => Boolean(host))
      .map((host) => new URL(`${protocol}://${host}`).origin);

    return sourceOrigin === requestUrl.origin
      || sourceOrigin === configuredOrigin
      || hostOrigins.includes(sourceOrigin);
  } catch {
    return false;
  }
}