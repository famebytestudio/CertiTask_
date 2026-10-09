import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PLAN_TIERS, planForAudience, type PlanTier } from "@/lib/plans";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/auth/login?next=${encodeURIComponent(`/checkout?plan=${plan ?? ""}`)}`);
  if (session.role === "ADMIN") redirect("/admin/dashboard");
  if (!PLAN_TIERS.includes(plan as PlanTier)) {
    return <main className="mx-auto max-w-lg px-6 py-24 text-center"><h1 className="text-2xl font-bold text-navy">Choose a plan</h1><p className="my-4">Select a plan from your billing dashboard to continue.</p><Link className="font-bold underline" href={`/${session.role.toLowerCase()}/dashboard?tab=billing`}>View plans</Link></main>;
  }
  const def = planForAudience(plan as PlanTier, session.role);
  const createdAt = new Date().toISOString();
  return <CheckoutClient audience={session.role.toLowerCase() as "client" | "talent"} order={{
    id: `checkout-${def.tier}`, plan: def.tier, planName: def.name,
    items: [{ label: `${def.name} plan — 30 days (${def.postLimit ?? "unlimited"} ${session.role === "TALENT" ? "project requests" : "project posts"})`, amount: def.priceCents }],
    subtotal: def.priceCents, issuanceFee: 0, delivery: 0, total: def.priceCents, currency: "USD", createdAt,
  }} />;
}
