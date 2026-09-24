import Link from "next/link";
import { Button } from "@/components/Button";
import { PlanCards } from "@/components/billing/PlanCards";
import { FREE_POSTS, PERIOD_DAYS, planCatalog } from "@/lib/plans";

export const metadata = { title: "Pricing — CertiTask" };

/** Public pricing page for client publishing and talent project requests. */
export default function PricingPage() {
  const clientPlans = planCatalog("CLIENT");
  const talentPlans = planCatalog("TALENT");
  return (
    <div className="min-h-screen bg-paper text-ink">
      <section className="relative overflow-hidden bg-navy-dark text-paper">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,#C9A227_0,transparent_28%),linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_48%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-gold"><span className="h-px w-10 bg-gold" />CertiTask pricing</div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Choose the pace that fits your work.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-paper/75 sm:text-lg">Two ways to grow on CertiTask. Clients pay to publish stronger opportunities. Talents pay only when they need more application capacity.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#client-plans" className="inline-flex items-center rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy-dark transition hover:bg-gold-light">View client plans</a>
              <a href="#talent-plans" className="inline-flex items-center rounded-lg border border-paper/25 px-5 py-3 text-sm font-bold text-paper transition hover:border-gold hover:text-gold">View talent plans</a>
            </div>
          </div>
          <div className="mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-l-2 border-gold px-4"><div className="text-2xl font-extrabold">{FREE_POSTS}</div><div className="mt-1 text-xs text-paper/60">free starts for each role</div></div>
            <div className="border-l-2 border-paper/25 px-4"><div className="text-2xl font-extrabold">{PERIOD_DAYS}</div><div className="mt-1 text-xs text-paper/60">days per paid period</div></div>
            <div className="border-l-2 border-paper/25 px-4"><div className="text-2xl font-extrabold">$5</div><div className="mt-1 text-xs text-paper/60">starting plan price</div></div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <section id="client-plans" className="scroll-mt-28">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-navy/10 pb-6 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">01 / For clients</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Publish work people want.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Start with {FREE_POSTS} verified project posts free, then use a plan to reach talent with more volume and visibility.</p></div>
            <Link href="/auth/signup" className="text-sm font-bold text-navy underline decoration-gold decoration-2 underline-offset-4">Create a client account</Link>
          </div>
          <PlanCards plans={clientPlans} />
        </section>

        <section id="talent-plans" className="mt-20 scroll-mt-28 border-t border-navy/10 pt-12 lg:mt-24 lg:pt-16">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-navy/10 pb-6 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">02 / For talents</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Apply with intention.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Your first {FREE_POSTS} project requests are free. Choose a plan when you are ready to send more focused applications.</p></div>
            <Link href="/auth/signup?role=talent" className="text-sm font-bold text-navy underline decoration-gold decoration-2 underline-offset-4">Create a talent account</Link>
          </div>
          <PlanCards plans={talentPlans} quotaLabel="project request" />
        </section>

        <section className="mt-20 grid gap-5 border-t border-navy/10 pt-12 md:grid-cols-3">
          <div><div className="mb-3 text-2xl">01</div><h3 className="font-bold text-navy">Pay once, use freely</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Every plan is prepaid for {PERIOD_DAYS} days. There are no automatic charges.</p></div>
          <div><div className="mb-3 text-2xl">02</div><h3 className="font-bold text-navy">Checkout stays secure</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Safepay handles cards, Google Pay, and Pakistani wallets. CertiTask never stores card details.</p></div>
          <div><div className="mb-3 text-2xl">03</div><h3 className="font-bold text-navy">Change when ready</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Upgrade from your dashboard any time. Your plan history and receipts stay available.</p></div>
        </section>

        <section className="mt-16 flex flex-col items-start justify-between gap-6 bg-navy px-6 py-8 text-paper sm:flex-row sm:items-center sm:px-10">
          <div><h2 className="text-2xl font-extrabold">Ready for the next step?</h2><p className="mt-1 text-sm text-paper/70">Browse live opportunities or start publishing your own.</p></div>
          <div className="flex flex-wrap gap-3"><Button href="/projects" variant="gold">Browse projects</Button><Link href="/contact" className="inline-flex items-center rounded-lg border border-paper/25 px-5 py-2.5 text-sm font-bold text-paper hover:border-gold hover:text-gold">Talk to us</Link></div>
        </section>
      </main>
    </div>
  );
}
