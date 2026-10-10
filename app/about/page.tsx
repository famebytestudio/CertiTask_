import Link from "next/link";
import { PageIntro } from "@/components/PageIntro";
import { Reveal } from "@/components/Reveal";

export default function AboutPage() {
  return <div>
    <PageIntro eyebrow="THE STORY BEHIND CERTITASK" title="Talent is everywhere." accent="Opportunity should be, too." description="We’re building a place where your next step comes from what you can do. Real projects, meaningful feedback, and a record of your contribution." />
    <section className="ct-container home-section">
      <Reveal className="section-heading"><div><p className="eyebrow">WHY WE’RE HERE</p><h2>Experience starts<br />with an opportunity.</h2></div><p>You shouldn’t need a long résumé to show your potential. CertiTask connects people ready to learn by doing with clients who have real work to share.</p></Reveal>
      <div className="steps-grid">{[
        ["01 / DISCOVER", "Find work that fits.", "Explore focused briefs from individuals and organizations. Choose a project that matches your skills and gives you room to grow."],
        ["02 / COLLABORATE", "Make progress together.", "Apply independently or as a team. Share your work, learn from client feedback, and build something with a clear outcome."],
        ["03 / PROVE", "Take your work further.", "After approval, receive a certificate that others can verify. Your contribution becomes a concrete part of your professional story."],
      ].map(([number,title,copy],i)=><Reveal key={title} delay={i*90} className="step-card"><div className="step-top">{number}</div><h3>{title}</h3><p>{copy}</p></Reveal>)}</div>
    </section>
    <section className="ct-container"><Reveal className="about-values"><div><p className="eyebrow">WHAT WE BELIEVE</p><h2>Let the work<br /><span className="hero-serif">tell the story.</span></h2></div><div>{[
      ["Opportunity with purpose", "Practical projects bring learning and contribution together. Every brief is a chance to move forward."],
      ["Recognition with evidence", "Certificates reflect client-approved project outcomes. Each has a unique identity and a public verification record."],
      ["Progress at your pace", "Whether you’re a student, freelancer, or changing careers, you can start with the skills you have today."],
    ].map(([title,copy])=><article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></Reveal></section>
    <section className="ct-container home-section"><Reveal className="home-cta"><div><p className="eyebrow">YOUR STORY IS STILL BEING WRITTEN</p><h2>Make the next chapter<br /><span className="hero-serif">one worth sharing.</span></h2><Link href="/projects" className="ct-button ct-button-dark">Explore the possibilities ↗</Link></div></Reveal></section>
  </div>;
}
