import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/certificates/[id]/pdf": ["./public/signature.png"],
    "/api/submissions/[id]": ["./public/signature.png"],
    "/api/admin/verifications/[id]": ["./public/signature.png"],
  },
  // Old role URLs from before the Client/Talent rename.
  async redirects() {
    return [
      { source: "/company/:path*", destination: "/client/:path*", permanent: true },
      { source: "/student/:path*", destination: "/talent/:path*", permanent: true },
      { source: "/companies", destination: "/clients", permanent: true },
      { source: "/companies/:id", destination: "/clients/:id", permanent: true },
      { source: "/students/:id", destination: "/talents/:id", permanent: true },
    ];
  },
  async headers() {
    const scriptSource = process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      scriptSource,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
