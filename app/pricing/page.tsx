import { PageIntro } from "@/components/PageIntro";
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
      <PageIntro eyebrow="ROOM TO GROW" title="Your ambition." accent="Your pace." description="Start free, then choose a 30-day plan when you’re ready for more. Clear limits, useful features, and room for your next chapter."><a href="#client-plans" className="ct-button ct-button-dark">For clients ↗</a><a href="#talent-plans" className="ct-text-link">For talent ↗</a></PageIntro>

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
          <div><div className="mb-3 text-2xl">02</div><h3 className="font-bold text-navy">Compare every plan</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Plan features and prices remain visible while online purchasing is temporarily unavailable.</p></div>
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
