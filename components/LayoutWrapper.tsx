"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define which paths should NOT render the public marketing Navbar and Footer
  const isAuthOrDashboard =
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/talent/") ||
    pathname?.startsWith("/client/") ||
    pathname?.startsWith("/admin/") ||
    pathname === "/checkout" ||
    pathname?.startsWith("/api") ||
    pathname?.startsWith("/certificates/") ||
    pathname?.startsWith("/payment/"); // checkout flow renders full-screen

  if (isAuthOrDashboard) {
    return <div className="app-surface min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" className="public-content flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
