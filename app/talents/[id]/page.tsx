"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CLIENT_TYPE_LABEL, PROJECT_CATEGORY_LABEL, type ClientType, type ProjectCategory, type VerificationStatus } from "@/lib/enums";

interface TalentDetail {
  id: string;
  name: string;
  verificationStatus: VerificationStatus;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  universityName: string | null;
  degreeProgram: string | null;
  currentSemester: string | null;
  skills: string[];
  portfolioUrl: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  _count: { certificatesEarned: number; teamMemberships: number };
  certificatesEarned: Array<{
    id: string; certId: string; title: string; issuerName: string; issuerType: ClientType; skills: string[]; issuedAt: string;
    project: { id: string; title: string; category: ProjectCategory };
  }>;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TalentDetailPage() {
  const params = useParams();
  const [talent, setTalent] = useState<TalentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/talents/${params.id}`);
        if (!res.ok) throw new Error("Profile not found");
        const data = await res.json();
        setTalent(data.talent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Profile not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-navy font-bold">Loading…</p></div>;
  if (error || !talent) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <p className="text-red-600 font-bold">{error || "Profile not found"}</p>
        <Link href="/" className="text-gold hover:underline mt-4 inline-block">← Home</Link>
      </div>
    </div>
  );

  const verified = talent.verificationStatus === "VERIFIED";

  return (
    <div className="min-h-screen bg-paper">
      <section className="bg-gradient-to-b from-navy-dark to-navy text-paper py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="h-20 w-20 rounded-full bg-gold flex items-center justify-center text-navy font-bold text-2xl shrink-0 overflow-hidden">{talent.avatarUrl ? <Image unoptimized src={talent.avatarUrl} width={80} height={80} alt={`${talent.name}'s profile photo`} className="h-full w-full object-cover" /> : talent.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold mb-2 break-words">{talent.name}</h1>
              <div className="flex flex-wrap gap-3 text-paper/90 text-sm items-center">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${verified ? "bg-green-500/20 text-green-200" : "bg-white/10 text-paper/70"}`}>{verified ? "✓ Identity verified" : "Identity not yet verified"}</span>
                {talent.degreeProgram && <span>● {talent.degreeProgram}</span>}
                {talent.universityName && <span>● {talent.universityName}</span>}
                {talent.location && <span>● {talent.location}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-xl border border-navy/5 p-8">
                <h2 className="text-2xl font-bold text-navy mb-4">About</h2>
                <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">{talent.bio || "No bio yet."}</p>
              </div>

              <div className="bg-white rounded-xl border border-navy/5 p-8">
                <h2 className="text-2xl font-bold text-navy mb-6">Verified certificates ({talent.certificatesEarned.length})</h2>
                {talent.certificatesEarned.length === 0 ? (
                  <p className="text-ink/70">No certificates yet.</p>
                ) : (
                  <div className="space-y-4">
                    {talent.certificatesEarned.map(c => (
                      <Link key={c.id} href={`/certificates/${c.certId}`} className="block border border-gold/30 bg-[#FFFDF5] rounded-lg p-5 hover:border-gold transition-colors">
                        <div className="flex justify-between items-start gap-3 flex-wrap mb-1">
                          <div>
                            <span className="text-[10px] font-bold text-gold uppercase">{PROJECT_CATEGORY_LABEL[c.project.category]}</span>
                            <h3 className="font-bold text-navy text-lg">{c.title}</h3>
                          </div>
                          <span className="text-xs font-mono text-ink/60">{c.certId}</span>
                        </div>
                        <p className="text-sm text-ink/80">Issued by <strong>{c.issuerName}</strong> ({CLIENT_TYPE_LABEL[c.issuerType]}) · {fmt(c.issuedAt)}</p>
                        {c.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {c.skills.slice(0, 6).map(s => <span key={s} className="text-[11px] font-semibold text-navy bg-navy/5 border border-navy/10 rounded px-2 py-0.5">{s}</span>)}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {talent.skills.length > 0 && (
                <div className="bg-white rounded-xl border border-navy/5 p-6">
                  <h3 className="font-bold text-navy mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {talent.skills.map(s => <span key={s} className="px-3 py-1 bg-navy/5 text-navy rounded-full text-xs font-semibold border border-navy/10">{s}</span>)}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl border border-navy/5 p-6">
                <h3 className="font-bold text-navy mb-4">Education</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-ink/60">University:</span> <span className="font-semibold text-navy">{talent.universityName || "—"}</span></p>
                  <p><span className="text-ink/60">Program:</span> <span className="font-semibold text-navy">{talent.degreeProgram || "—"}</span></p>
                  <p><span className="text-ink/60">Semester:</span> <span className="font-semibold text-navy">{talent.currentSemester || "—"}</span></p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-navy/5 p-6">
                <h3 className="font-bold text-navy mb-4">Links</h3>
                <div className="space-y-3 text-sm">
                  {talent.portfolioUrl && <a href={talent.portfolioUrl} target="_blank" rel="noopener noreferrer" className="block text-gold hover:underline break-all">🌐 Portfolio</a>}
                  {talent.linkedinUrl && <a href={talent.linkedinUrl} target="_blank" rel="noopener noreferrer" className="block text-gold hover:underline">💼 LinkedIn</a>}
                  {talent.resumeUrl && <a href={talent.resumeUrl} target="_blank" rel="noopener noreferrer" className="block text-gold hover:underline">View resume / CV</a>}
                  {!talent.portfolioUrl && !talent.linkedinUrl && !talent.resumeUrl && <p className="text-ink/60">No links added.</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-navy/5 p-6">
                <h3 className="font-bold text-navy mb-4">Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-ink/70 text-sm">Projects joined</span><span className="font-bold text-navy">{talent._count.teamMemberships}</span></div>
                  <div className="flex justify-between"><span className="text-ink/70 text-sm">Certificates</span><span className="font-bold text-navy">{talent._count.certificatesEarned}</span></div>
                  <div className="flex justify-between"><span className="text-ink/70 text-sm">Member since</span><span className="font-bold text-navy">{fmt(talent.createdAt)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
