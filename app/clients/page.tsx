"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CLIENT_TYPE_LABEL, type ClientType, type VerificationStatus } from "@/lib/enums";

interface ApiClient {
  id: string;
  name: string;
  clientType: ClientType | null;
  verificationStatus: VerificationStatus;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  industry: string | null;
  _count: { projectsPosted: number; certificatesIssued: number };
}

const filters = ["All", "Organization", "Individual"] as const;
type Filter = (typeof filters)[number];

function ClientCard({ client, index }: { client: ApiClient; index: number }) {
  return <Link href={`/clients/${client.id}`} className="client-directory-card" style={{ animationDelay: `${Math.min(index, 5) * 65}ms` }}>
    <div className="client-directory-card-top">
      <div className="client-directory-avatar">{client.avatarUrl ? <Image unoptimized src={client.avatarUrl} width={64} height={64} alt="" /> : client.name.charAt(0).toUpperCase()}</div>
      <span className="client-directory-arrow" aria-hidden="true">↗</span>
    </div>
    <div className="client-directory-meta"><span>{client.clientType ? CLIENT_TYPE_LABEL[client.clientType] : "Client"}</span>{client.verificationStatus === "VERIFIED" && <span className="client-directory-verified"><span aria-hidden="true">✓</span> Verified</span>}</div>
    <h3>{client.name}</h3>
    <p>{client.bio || "Posting real projects and looking for people ready to bring ideas to life."}</p>
    <div className="client-directory-tags">{client.industry && <span>{client.industry}</span>}{client.location && <span>{client.location}</span>}{!client.industry && !client.location && <span>Open to collaboration</span>}</div>
    <div className="client-directory-card-foot"><span><strong>{client._count.projectsPosted}</strong> open project{client._count.projectsPosted === 1 ? "" : "s"}</span><span><strong>{client._count.certificatesIssued}</strong> certificates issued</span></div>
  </Link>;
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [showAll, setShowAll] = useState(false);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/clients", { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Unable to load clients"); return response.json(); })
      .then(data => setClients(data.clients ?? []))
      .catch(error => { if (error.name !== "AbortError") setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter(client => {
      const matchesType = filter === "All" || (client.clientType && CLIENT_TYPE_LABEL[client.clientType] === filter);
      const matchesSearch = !query || [client.name, client.bio, client.industry, client.location].some(value => value?.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
  }, [clients, search, filter]);
  const visible = showAll ? filtered : filtered.slice(0, 6);
  const filtersActive = search.trim() !== "" || filter !== "All";

  return <div className="clients-redesign">
    <section className="clients-hero"><div className="ct-container clients-hero-grid">
      <div><p className="eyebrow"><span className="status-dot" /> THE PEOPLE BEHIND THE PROJECTS</p><h1>Meet the clients<br /><span className="hero-serif">making things happen.</span></h1><p>Good work starts with a good brief. Find the people and organizations creating real opportunities on CertiTask.</p><a href="#meet-clients" className="ct-button ct-button-dark">Explore clients <span aria-hidden="true">↗</span></a></div>
      <div className="clients-hero-art" aria-hidden="true"><span className="clients-hero-flower">✳</span><div className="clients-art-card"><span>BETTER, TOGETHER</span><div className="clients-art-avatars"><i>A</i><i>C</i><i>✦</i></div><strong>The right people<br />change everything.</strong><small>YOUR NEXT COLLABORATION STARTS HERE</small></div><span className="clients-art-spark">↗</span></div>
    </div></section>

    <main className="ct-container clients-content" id="meet-clients">
      <div className="clients-content-heading"><div><p className="eyebrow">FIND YOUR FIT</p><h2>People worth <span className="hero-serif">meeting.</span></h2></div><p>Browse clients with open projects and discover where your skills could make a difference.</p></div>
      <div className="clients-filter-panel">
        <label className="clients-search" htmlFor="client-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg><span className="sr-only">Search clients</span><input id="client-search" type="search" placeholder="Search by name, industry, or location" value={search} onChange={event => { setSearch(event.target.value); setShowAll(false); }} /></label>
        <div className="clients-filter-row"><div className="clients-filter-tabs" role="group" aria-label="Client type">{filters.map(option => <button key={option} type="button" aria-pressed={filter === option} onClick={() => { setFilter(option); setShowAll(false); }}>{option}</button>)}</div>{filtersActive && <button className="clients-clear" onClick={() => { setSearch(""); setFilter("All"); setShowAll(false); }}>Clear filters ×</button>}</div>
      </div>

      <div className="clients-result-line" aria-live="polite"><span>{loading ? "Finding clients…" : `${filtered.length} ${filtered.length === 1 ? "client" : "clients"} to explore`}</span><span>{filter === "All" ? "All clients" : `${filter} clients`} <span aria-hidden="true">✳</span></span></div>
      {loading ? <div className="clients-card-grid" aria-label="Loading clients">{[0, 1, 2].map(i => <div key={i} className="client-card-skeleton" />)}</div>
        : loadError ? <div className="clients-empty"><span aria-hidden="true">↗</span><h3>We couldn’t load clients right now.</h3><p>Please refresh the page and try again.</p></div>
        : filtered.length ? <><div className="clients-card-grid">{visible.map((client, index) => <ClientCard key={client.id} client={client} index={index} />)}</div>{!showAll && filtered.length > 6 && <button className="clients-show-all" onClick={() => setShowAll(true)}>See all {filtered.length} clients <span aria-hidden="true">↗</span></button>}</>
        : <div className="clients-empty"><span aria-hidden="true">✳</span><h3>{filtersActive ? "No clients match just yet." : "The first clients are on their way."}</h3><p>{filtersActive ? "Try another name, location, or client type." : "Have a project to share? Be one of the first to post an opportunity."}</p>{filtersActive ? <button className="ct-button ct-button-dark" onClick={() => { setSearch(""); setFilter("All"); }}>Clear filters ↗</button> : <Link href="/auth/signup?role=client" className="ct-button ct-button-dark">Create a client account ↗</Link>}</div>}
    </main>

    <section className="ct-container clients-cta-wrap"><div className="clients-cta"><div><p className="eyebrow">HAVE AN IDEA IN MIND?</p><h2>Your project could be<br /><span className="hero-serif">someone’s big break.</span></h2><p>Share a brief, meet motivated talent, and make something worth showing.</p><Link href="/auth/signup?role=client" className="ct-button ct-button-dark">Post your project ↗</Link></div><span aria-hidden="true">✳</span></div></section>
  </div>;
}
