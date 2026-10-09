"use client";

import Link from "next/link";
import { EmptyState, SectionHeader } from "@/components/dashboard/ui";
import { CertificateGrid } from "@/components/client/CertificatesTab";
import type { CertificateDto, CertificateHoldDto } from "@/lib/types";
import type { TalentTab } from "@/app/talent/dashboard/page";

export function CertificatesTab({
  certificates,
  holds,
  talentId,
  goTo,
}: {
  certificates: CertificateDto[];
  holds: CertificateHoldDto[];
  talentId: string;
  goTo: (t: TalentTab) => void;
}) {
  return (
    <div>
      <SectionHeader
        icon="🏅"
        title="My Certificates"
        subtitle="Permanent, tamper-proof credentials for completed client projects. Every certificate has a unique verification ID that anyone can verify online."
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href={`/talents/${talentId}`}
              target="_blank"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--navy)",
                textDecoration: "none",
                padding: "8px 16px",
                border: "1.5px solid var(--navy)",
                borderRadius: 8,
                background: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              <span>👤</span> View Public Portfolio ↗
            </Link>
          </div>
        }
      />

      {/* Identity Verification Hold Alert */}
      {holds.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(236,201,75,0.15) 0%, rgba(236,201,75,0.05) 100%)",
            border: "1.5px solid rgba(201,162,39,0.5)",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(201,162,39,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#744210", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🏅</span> {holds.length} Certificate{holds.length > 1 ? "s" : ""} Waiting for Identity Verification
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#744210", lineHeight: 1.5 }}>
                Your work was approved by the client! Complete your government ID verification so the certificate can be generated with your legal name.
              </p>
              <ul style={{ margin: "0 0 12px", paddingLeft: 20, fontSize: 13, color: "#744210" }}>
                {holds.map(h => (
                  <li key={h.id} style={{ marginBottom: 4 }}>
                    <strong>{h.project.title}</strong> — {h.project.client.name}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => goTo("verification")}
              style={{
                padding: "10px 18px",
                background: "#744210",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(116,66,16,0.2)",
              }}
            >
              Verify My Identity Now →
            </button>
          </div>
        </div>
      )}

      {/* Certificates Grid or Empty State */}
      {certificates.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No certificates earned yet"
          hint="Apply to projects, deliver quality solutions, and get approved by clients to build your verifiable credential portfolio."
          action={
            <button
              onClick={() => goTo("projects")}
              style={{
                padding: "10px 20px",
                background: "var(--navy)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Browse Open Projects →
            </button>
          }
        />
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Earned Credentials ({certificates.length})
            </div>
          </div>
          <CertificateGrid certificates={certificates} mode="earned" />
        </div>
      )}
    </div>
  );
}
