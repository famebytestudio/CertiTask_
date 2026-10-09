"use client";

import Link from "next/link";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="mx-auto max-w-lg px-6 py-24 text-center">
    <h1 className="text-2xl font-bold text-navy">We couldn’t load this page</h1>
    <p className="my-5 text-ink-muted">Please try again in a moment.</p>
    <button className="rounded-lg bg-navy px-5 py-3 font-bold text-white" onClick={retry}>Try again</button>
    <Link className="ml-5 font-bold text-navy underline" href="/">Go home</Link>
  </main>;
}
