"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CLIENT_TYPE_LABEL, PROJECT_CATEGORY_LABEL, statusLabel, type ClientType, type ProjectCategory, type VerificationStatus } from "@/lib/enums";

interface ClientDetail {
  id: string; name: string; clientType: ClientType | null; verificationStatus: VerificationStatus;
  bio: string | null; website: string | null; avatarUrl: string | null; location: string | null;
  industry: string | null; organizationSize: string | null; foundedYear: number | null;
  linkedinUrl: string | null; createdAt: string;
  _count: { projectsPosted: number; certificatesIssued: number };
  projectsPosted: Array<{ id: string; title: string; description: string; category: ProjectCategory;
    requiredSkills: string[]; status: string; deadline: string; teamCap: number;
    _count: { applications: number; submissions: number } }>;
}

function date(iso: string) { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

function ProjectCard({ project }: { project: ClientDetail["projectsPosted"][number] }) {
  return <Link href={`/projects/${project.id}`} className="client-profile-project">
    <div className="client-profile-project-top"><span>{PROJECT_CATEGORY_LABEL[project.category]}</span><span className={project.status === "ACTIVE" ? "is-active" : ""}>{statusLabel(project.status)}</span></div>
    <h3>{project.title}</h3><p>{project.description}</p>
    <div className="client-profile-project-skills">{project.requiredSkills.slice(0, 5).map(skill => <span key={skill}>{skill}</span>)}</div>
    <div className="client-profile-project-foot"><span>Due {date(project.deadline)}</span><span>{project.teamCap > 1 ? `Teams up to ${project.teamCap}` : "Individual work"}</span><strong>View brief ↗</strong></div>
  </Link>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/clients/${encodeURIComponent(String(params.id))}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Client not found"); return response.json(); })
      .then(data => setClient(data.client))
      .catch(reason => { if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Client not found"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [params.id]);

  if (loading) return <div className="client-profile-loading" role="status">Loading client profile…</div>;
  if (error || !client) return <div className="client-profile-loading"><div><h1>{error || "Client not found"}</h1><Link href="/clients" className="ct-text-link">Back to clients ↗</Link></div></div>;

  const open = client.projectsPosted.filter(project => project.status === "ACTIVE");
  const past = client.projectsPosted.filter(project => project.status !== "ACTIVE");
  return <div className="client-profile-page">
    <section className="client-profile-hero"><div className="ct-container"><Link href="/clients" className="client-profile-back">← All clients</Link><div className="client-profile-hero-inner"><div className="client-profile-identity"><div className="client-profile-avatar">{client.avatarUrl ? <Image unoptimized src={client.avatarUrl} width={90} height={90} alt="" /> : client.name.charAt(0).toUpperCase()}</div><div><p className="eyebrow">MEET THE CLIENT</p><h1>{client.name}</h1><div className="client-profile-badges">{client.clientType && <span>{CLIENT_TYPE_LABEL[client.clientType]}</span>}{client.verificationStatus === "VERIFIED" && <span className="verified">✓ Verified identity</span>}{client.industry && <span>{client.industry}</span>}</div></div></div><div className="client-profile-location">{client.location || "Working from anywhere"}</div></div></div></section>

    <main className="ct-container client-profile-content"><div className="client-profile-main">
      <section className="client-profile-section"><p className="eyebrow">THEIR STORY</p><h2>About {client.name}</h2><p className="client-profile-bio">{client.bio || "This client is ready to collaborate on meaningful projects."}</p>{client.foundedYear && <p className="client-profile-founded">Founded in {client.foundedYear}</p>}</section>
      <section className="client-profile-section"><div className="client-profile-section-title"><div><p className="eyebrow">READY FOR YOUR IDEAS</p><h2>Open projects <span>({open.length})</span></h2></div><Link href="/projects" className="ct-text-link">Explore all projects ↗</Link></div>{open.length ? <div className="client-profile-project-list">{open.map(project => <ProjectCard key={project.id} project={project} />)}</div> : <p className="client-profile-no-projects">No open projects from this client right now. Check back soon.</p>}</section>
      {past.length > 0 && <section className="client-profile-section"><p className="eyebrow">PREVIOUS WORK</p><h2>Past projects <span>({past.length})</span></h2><div className="client-profile-project-list">{past.map(project => <ProjectCard key={project.id} project={project} />)}</div></section>}
    </div><aside className="client-profile-side"><div className="client-profile-side-card"><p className="eyebrow">AT A GLANCE</p><h2>A track record<br /><span className="hero-serif">in the making.</span></h2><div className="client-profile-stat"><strong>{client._count.projectsPosted}</strong><span>projects posted</span></div><div className="client-profile-stat"><strong>{client._count.certificatesIssued}</strong><span>certificates issued</span></div><div className="client-profile-stat"><strong>{date(client.createdAt)}</strong><span>member since</span></div></div><div className="client-profile-side-card"><p className="eyebrow">CONNECT</p><h2>Find out more.</h2>{client.website && <a href={client.website} target="_blank" rel="noopener noreferrer">Website <span aria-hidden="true">↗</span></a>}{client.linkedinUrl && <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>}{!client.website && !client.linkedinUrl && <p>No links shared yet.</p>}</div></aside></main>
  </div>;
}
