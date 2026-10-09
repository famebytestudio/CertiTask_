"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const links = [
  ["Explore projects", "/projects"], ["Our clients", "/clients"],
  ["How it works", "/#how-it-works"], ["Pricing", "/pricing"], ["Verify", "/verify"],
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)} aria-label="CertiTask home"><Logo className="brand-symbol" />CertiTask<span className="brand-period">.</span></Link>
        <div className="desktop-links">{links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</div>
        <div className="desktop-actions"><Link href="/auth/login">Log in</Link><Link href="/auth/signup" className="ct-button ct-button-dark">Get started <span aria-hidden="true">↗</span></Link></div>
        <button className="nav-toggle" aria-expanded={open} aria-controls="site-mobile-menu" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? "×" : "☰"}</span></button>
      </nav>
      {open && <div className="mobile-links" id="site-mobile-menu">{links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}<div className="mobile-nav-actions"><Link href="/auth/login" onClick={() => setOpen(false)}>Log in</Link><Link href="/auth/signup" className="ct-button ct-button-dark" onClick={() => setOpen(false)}>Get started ↗</Link></div></div>}
    </header>
  );
}
