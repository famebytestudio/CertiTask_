import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** Resolve shared links to the signed-in account's dashboard. */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/auth/login?next=${encodeURIComponent(`/dashboard${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`)}`);
  redirect(`/${session.role.toLowerCase()}/dashboard${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`);
}
