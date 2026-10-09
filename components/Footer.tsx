import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="ct-container footer-grid">
        <div><Link href="/" className="wordmark"><Logo className="brand-symbol" />CertiTask.</Link><p>Good work deserves to be seen.<br />Build your experience. Leave with proof.</p><Link href="/auth/signup" className="footer-invite">Your next chapter starts here <span aria-hidden="true">↗</span></Link></div>
        <div><h2>Make your move</h2><Link href="/projects">Explore projects</Link><Link href="/clients">Meet the clients</Link><Link href="/pricing">Plans & pricing</Link><Link href="/auth/signup">Join CertiTask</Link></div>
        <div><h2>Get to know us</h2><Link href="/about">Our story</Link><Link href="/#how-it-works">How it works</Link><Link href="/verify">Verify a certificate</Link><Link href="/contact">Let’s talk</Link></div>
      </div>
      <div className="ct-container footer-bottom"><span>© {new Date().getFullYear()} CertiTask</span><span>Real projects. Lasting proof.</span><Link href="/admin/login">Admin access ↗</Link></div>
    </footer>
  );
}
