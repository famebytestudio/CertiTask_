import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/Button";

const processSteps = [
  ["01", "Find the right brief", "Browse focused projects from clients who need practical work completed."],
  ["02", "Make it happen", "Work independently or collaborate with a team while the client stays in the loop."],
  ["03", "Leave with proof", "Finish strong and receive a certificate backed by the client’s sign-off."],
];

const featureCards = [
  ["01", "Work that matters", "Trade tutorial projects for real briefs, real feedback, and outcomes you can talk about."],
  ["02", "Proof that travels", "Every certificate has a unique ID and a public verification page for recruiters and clients."],
  ["03", "A better way to hire", "Clients discover motivated talent through the work they have already completed."],
];

export default async function Home() {
  let dbClients: Array<{
    id: string;
    name: string;
    clientType: "INDIVIDUAL" | "ORGANIZATION" | null;
    verificationStatus: string;
    industry: string | null;
    bio: string | null;
    location: string | null;
    _count: { projectsPosted: number };
  }> = [];

  try {
    dbClients = await prisma.user.findMany({
      where: { role: "CLIENT", suspendedAt: null, projectsPosted: { some: { status: "ACTIVE" } } },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        clientType: true,
        verificationStatus: true,
        industry: true,
        bio: true,
        location: true,
        _count: { select: { projectsPosted: { where: { status: "ACTIVE" } } } },
      },
    });
  } catch (error) {
    console.error("Failed to fetch featured clients from database:", error);
  }

  const displayClients = dbClients.map((client) => ({
    ...client,
    tag: client.industry || (client.clientType === "ORGANIZATION" ? "Organization" : "Individual"),
    logoChar: client.name.charAt(0).toUpperCase(),
  }));

  return (
    <div className="min-h-screen overflow-hidden bg-paper">
      <section className="relative bg-navy-dark text-paper">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(201,162,39,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(201,162,39,.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -right-32 top-0 h-[32rem] w-[32rem] rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-32 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-gold">
                <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_#c9a227]" />
                Build. Do. Prove.
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-7xl">
                Experience is better when you can <span className="text-gold">prove it.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/70 sm:text-xl">
                CertiTask is where ambitious talent takes on real projects, and clients find people ready to make an impact.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button href="/projects" variant="gold" className="px-8 py-3.5 text-base">Explore projects <span className="ml-2">↗</span></Button>
                <Button href="/auth/signup" variant="outline" className="border-paper/50 px-8 py-3.5 text-base text-paper hover:border-paper hover:bg-paper hover:text-navy">Join CertiTask</Button>
              </div>
              <div className="mt-14 flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-wider text-paper/45">
                <span>Real briefs</span><span className="text-gold">•</span><span>Client sign-off</span><span className="text-gold">•</span><span>Public verification</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -left-7 top-14 h-24 w-24 rounded-3xl border border-gold/40 bg-gold/10" />
              <div className="relative rounded-[2rem] border border-white/15 bg-white/[.08] p-3 shadow-2xl backdrop-blur">
                <div className="rounded-[1.5rem] bg-paper p-6 text-navy sm:p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Verified credential</p>
                      <h2 className="mt-4 text-3xl font-black tracking-tight">Project complete.</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-2xl text-gold">✓</div>
                  </div>
                  <div className="mt-10 space-y-5 border-t border-navy/10 pt-5 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-ink-muted">Project</span><strong>API Integration</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-ink-muted">Issued to</span><strong>Jane Doe</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-ink-muted">Certificate ID</span><strong className="font-mono text-xs">CERT-333333</strong></div>
                  </div>
                  <div className="mt-7 flex items-center justify-between rounded-xl bg-navy px-4 py-3 text-xs text-paper">
                    <span>Anyone can verify this record</span><span className="font-bold text-gold">View ↗</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-3 rounded-2xl border border-green-300/20 bg-[#123b3a] px-4 py-3 text-xs font-bold text-green-200 shadow-lg">
                <span className="mr-2">●</span> Client verified
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-navy/10 bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-7 text-xs font-bold uppercase tracking-[.18em] text-ink-subtle sm:px-6 lg:px-8">
          <span>For students</span><span className="hidden text-gold sm:inline">✦</span><span>For freelancers</span><span className="hidden text-gold sm:inline">✦</span><span>For career changers</span><span className="hidden text-gold sm:inline">✦</span><span>For forward-thinking clients</span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">A smarter loop</p>
            <h2 className="mt-5 max-w-md text-4xl font-black leading-tight tracking-[-.04em] text-navy sm:text-5xl">From potential to proof in three steps.</h2>
            <p className="mt-6 max-w-sm leading-relaxed text-ink-muted">No empty claims. Just focused work, honest feedback, and a record of what you actually contributed.</p>
          </div>
          <div className="grid gap-4">
            {processSteps.map(([number, title, description]) => (
              <div key={number} className="group grid gap-5 rounded-2xl border border-navy/10 bg-white p-6 transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg sm:grid-cols-[72px_1fr]">
                <span className="text-4xl font-black tracking-tight text-gold/50 group-hover:text-gold">{number}</span>
                <div><h3 className="text-xl font-bold text-navy">{title}</h3><p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f0eee8] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">Why CertiTask</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-.04em] text-navy sm:text-5xl">Less noise. More evidence.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {featureCards.map(([number, title, description]) => (
              <div key={number} className="rounded-2xl bg-paper p-7 shadow-sm">
                <span className="text-xs font-bold text-gold">{number}</span>
                <h3 className="mt-12 text-2xl font-black tracking-tight text-navy">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-gold">Open doors</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em] text-navy">Clients posting now.</h2></div>
          <Button href="/clients" variant="outline">View all clients ↗</Button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {displayClients.length > 0 ? displayClients.map((client) => (
            <Link href={`/clients/${client.id}`} key={client.id} className="group rounded-2xl border border-navy/10 bg-white p-6 transition hover:-translate-y-1 hover:border-gold hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-xl font-black text-gold">{client.logoChar}</div>
                <div><h3 className="font-bold text-navy">{client.name}</h3><p className="mt-1 text-xs text-ink-muted">{client.tag}</p></div>
              </div>
              <p className="mt-7 line-clamp-2 text-sm leading-relaxed text-ink-muted">{client.bio || "Posting real projects on CertiTask."}</p>
              <div className="mt-6 flex justify-between border-t border-navy/10 pt-4 text-xs font-semibold text-ink-muted"><span>{client.location || "Remote"}</span><span className="text-gold">{client._count.projectsPosted} open projects ↗</span></div>
            </Link>
          )) : <div className="rounded-2xl border border-dashed border-navy/20 p-10 text-sm text-ink-muted md:col-span-3">More project partners are joining soon.</div>}
        </div>
      </section>

      <section className="bg-navy-dark px-4 py-24 text-center text-paper sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">Make your next move count</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-.04em] sm:text-6xl">Don’t just say you can. <span className="text-gold">Show it.</span></h2>
        <p className="mx-auto mt-6 max-w-xl text-paper/65">Take on meaningful work, build your track record, and let your results speak for you.</p>
        <div className="mt-9 flex justify-center"><Button href="/auth/signup" variant="gold" className="px-9 py-4 text-base">Start building proof ↗</Button></div>
      </section>
    </div>
  );
}
