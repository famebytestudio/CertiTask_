import { appUrl } from "@/lib/app-url";

export function isSameOrigin(request: Request): boolean {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;

  try {
    const sourceOrigin = new URL(source).origin;
    const requestOrigin = new URL(request.url).origin;
    const configuredOrigin = process.env.APP_URL || process.env.VERCEL_URL ? appUrl() : null;
    return sourceOrigin === requestOrigin || sourceOrigin === configuredOrigin;
  } catch {
    return false;
  }
}