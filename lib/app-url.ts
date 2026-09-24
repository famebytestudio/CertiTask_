/**
 * Resolve the public origin used in emails, certificates, and external links.
 *
 * APP_URL should always be set in production to the canonical site URL.
 * Vercel fallbacks make preview deployments usable without changing local setup.
 */
export function appUrl(): string {
  const configured = process.env.APP_URL?.trim();
  const vercelHost = process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;
  const candidate = configured || (vercelHost ? `https://${vercelHost}` : null);

  if (!candidate) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_URL must be configured in production.");
    }
    return "http://localhost:3000";
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }

  return url.origin;
}
