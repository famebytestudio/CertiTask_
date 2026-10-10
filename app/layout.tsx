import type { Metadata } from "next";
import "./globals.css";
import "./redesign.css";
import "./directory-verify.css";
import "./client-profile.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import IntroSplash from "@/components/IntroSplash";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  applicationName: "CertiTask",
  title: {
    default: "CertiTask — Connecting Students With Opportunities That Matter",
    template: "%s | CertiTask",
  },
  description:
    "CertiTask helps students discover career opportunities, manage certificates, build professional profiles, and connect with featured companies.",
  keywords: ["certifications", "task management", "compliance", "CertiTask"],
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/app-icon-128.png", type: "image/png", sizes: "128x128" },
      { url: "/app-icon-256.png", type: "image/png", sizes: "256x256" },
      { url: "/app-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/app-icon-256.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <IntroSplash
          clientImage={existsSync(join(process.cwd(), "public/client.jpg")) ? "/client.jpg" : "/client-placeholder.svg"}
          talentImage={existsSync(join(process.cwd(), "public/talent.jpg")) ? "/talent.jpg" : "/talent-placeholder.svg"}
          logo="/logo.png"
          brandName="CertiTask"
        />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
