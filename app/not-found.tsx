import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto max-w-lg px-6 py-24 text-center">
    <p className="text-sm font-bold text-gold">404</p>
    <h1 className="mt-3 text-3xl font-bold text-navy">Page not found</h1>
    <p className="my-5 text-ink-muted">This link may have expired or the page may have moved.</p>
    <Link className="rounded-lg bg-navy px-5 py-3 font-bold text-white" href="/projects">Browse projects</Link>
  </main>;
}
