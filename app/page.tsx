import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/Reveal";
export const dynamic = "force-dynamic";

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
    <div className="home-redesign">
      <section className="ct-container home-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> SMALL STARTS. REAL POSSIBILITIES.</div>
          <h1>Your potential.<br />Real projects.<br /><span className="hero-serif">Lasting proof.</span></h1>
          <p>A place to turn what you know into what you’ve done. Work with real clients, grow with a team, and earn proof that opens doors.</p>
          <div className="hero-actions"><Link href="/projects" className="ct-button ct-button-dark">Find your next project <span aria-hidden="true">↗</span></Link><Link href="/auth/signup?role=client" className="ct-text-link">I’m here to hire <span aria-hidden="true">→</span></Link></div>
          <div className="hero-footnote"><span className="tiny-check">✓</span> Start free <span>·</span> Build at your pace <span>·</span> Make it count</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a project becoming a verified certificate">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <span className="art-spark" aria-hidden="true">✳</span>
          <div className="project-preview">
            <div className="preview-top"><span className="preview-icon">↗</span><span>YOUR NEXT CHAPTER</span><span className="preview-dots">•••</span></div>
            <div className="preview-tags"><span>Design & development</span><span>Example project</span></div>
            <h2>Make something<br />worth showing.</h2>
            <p>A fresh idea. A real brief.<br />A chance to do your best work.</p>
            <div className="preview-skills"><span>Creativity</span><span>Collaboration</span><span>You</span></div>
            <div className="preview-progress"><span>From idea to impact</span><strong>100%</strong><div><i /></div></div>
            <div className="preview-bottom"><div className="avatar-stack"><span>Y</span><span>T</span><span>✦</span></div><span>Better, together.</span><span className="circle-arrow">↗</span></div>
          </div>
          <div className="credential-preview"><div className="credential-seal">✓</div><div><span>THE WORK SPEAKS FOR ITSELF</span><strong>Project complete.</strong><small>A certificate you can share with confidence.</small></div><span className="credential-star" aria-hidden="true">✳</span></div>
          <span className="art-caption">An illustration of your next milestone.</span>
        </div>
      </section>
      <div className="audience-band"><div className="ct-container"><span>Room for every kind of ambition.</span><strong>Students</strong><i>✳</i><strong>Freelancers</strong><i>✳</i><strong>Career changers</strong><i>✳</i><strong>Forward thinkers</strong></div></div>
      <section className="ct-container home-section" id="how-it-works">
        <Reveal className="section-heading"><div><p className="eyebrow">THE WAY FORWARD</p><h2>A little initiative.<br /><span className="hero-serif">A whole lot of possibility.</span></h2></div><p>No endless loop of needing experience to get experience. Just a clear path from your first brief to your next big thing.</p></Reveal>
        <div className="steps-grid">{[
          ["01", "Find your spark.", "Explore projects that match your skills and curiosity. Find a brief that makes you want to get started.", "↗"],
          ["02", "Do the good work.", "Go solo or bring a team. Turn ideas into something real, with feedback from the people you’re building for.", "✳"],
          ["03", "Own your progress.", "Get your work approved and earn a publicly verifiable certificate. Your contribution, made visible.", "✓"],
        ].map(([number, title, copy, icon], index) => <Reveal key={number} delay={index * 90} className="step-card"><div className="step-top"><span>{number} /</span><span className="step-icon" aria-hidden="true">{icon}</span></div><h3>{title}</h3><p>{copy}</p></Reveal>)}</div>
      </section>
      <section className="ct-container"><Reveal className="proof-section"><div className="proof-visual" aria-hidden="true"><span className="proof-orbit">✳</span><div className="proof-sheet"><span>CERTITASK / CREDENTIAL</span><div className="proof-stamp">✓</div><strong>More than a line<br />on your résumé.</strong><div className="proof-line" /><div className="proof-line short" /><small>REAL WORK. REAL RECOGNITION.</small></div></div><div className="proof-copy"><p className="eyebrow">BUILT ON WHAT YOU DO</p><h2>Potential is a start.<br /><em>Proof is a step ahead.</em></h2><p>Every approved project tells a story about your skills. Make yours easy to share, easy to verify, and hard to overlook.</p><ul><li><span>✓</span> Client-approved project outcomes</li><li><span>✓</span> A unique, publicly verifiable certificate</li><li><span>✓</span> A growing record of your contribution</li></ul><Link href="/verify" className="ct-text-link">See how verification works ↗</Link></div></Reveal></section>
      <section className="ct-container home-section">
        <Reveal className="section-heading"><div><p className="eyebrow">REAL PEOPLE. REAL OPPORTUNITIES.</p><h2>Your next collaborator<br />could be right here.</h2></div><Link href="/clients" className="ct-text-link">Meet all clients ↗</Link></Reveal>
        <div className="client-preview-grid">{displayClients.length > 0 ? displayClients.map((client, i) => <Reveal key={client.id} delay={i * 75}><Link href={"/clients/" + client.id} className="client-preview-card"><div className="client-card-top"><span className="client-initial">{client.logoChar}</span><span className="client-tag">{client.tag}</span></div><h3>{client.name}</h3><p>{client.bio || "Bringing meaningful projects and fresh opportunities to CertiTask."}</p><div className="client-card-bottom"><span>{client.location || "Remote"}</span><strong>{client._count.projectsPosted} open projects ↗</strong></div></Link></Reveal>) : <div className="opportunity-empty"><span aria-hidden="true">↗</span><div><h3>Be the start of someone’s next chapter.</h3><p>Have a project in mind? Bring your brief and connect with motivated talent.</p></div><Link href="/auth/signup" className="ct-button ct-button-dark">Post a project ↗</Link></div>}</div>
      </section>
      <section className="ct-container home-cta-wrap"><Reveal className="home-cta"><div><p className="eyebrow">HERE’S TO WHAT’S NEXT</p><h2>You bring the ambition.<br /><span className="hero-serif">We’ll bring the possibilities.</span></h2><Link href="/auth/signup" className="ct-button ct-button-dark">Let’s make it happen ↗</Link></div><span className="cta-flower" aria-hidden="true">✳</span></Reveal></section>
    </div>
  );
}
