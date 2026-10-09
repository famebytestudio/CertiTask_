"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useState } from "react";
import Link from "next/link";
import { ProfilePhoto } from "@/components/dashboard/ProfilePhoto";
import {
  Btn,
  Field,
  Notice,
  SectionHeader,
  VerificationBadge,
  inputStyle,
  selectStyle,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import { CLIENT_TYPE_LABEL } from "@/lib/enums";
import type { ProfileDto } from "@/lib/types";

const INDUSTRIES = [
  "Technology & Software",
  "Finance & FinTech",
  "Healthcare & Biotech",
  "Education & EdTech",
  "Retail & E-commerce",
  "Media & Creative Agency",
  "Consulting & Professional Services",
  "Non-profit & Social Impact",
  "Government & Public Sector",
  "Other",
];

const SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-1000 employees",
  "1001+ employees",
];

export function ProfileTab({ profile, onSaved }: { profile: ProfileDto; onSaved: () => void }) {
  const isOrg = profile.clientType === "ORGANIZATION";
  const [form, setForm] = useState({
    name: profile.name ?? "",
    bio: profile.bio ?? "",
    website: profile.website ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    industry: profile.industry ?? "",
    organizationSize: profile.organizationSize ?? "",
    foundedYear: profile.foundedYear ? String(profile.foundedYear) : "",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await api("/api/auth/profile", "PATCH", {
      ...form,
      foundedYear: form.foundedYear ? parseInt(form.foundedYear) : null,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save profile");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
    onSaved();
  }

  const section = (icon: React.ReactNode, title: string, subtitle: string, children: React.ReactNode) => (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ paddingBottom: 12, marginBottom: 18, borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "4px 0 0" }}>{subtitle}</p>
      </div>
      <div className="mobile-dashboard-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader
        icon={<WorkspaceIcon name="edit" />}
        title="Edit Organization Profile"
        subtitle={`Registered as ${profile.clientType ? CLIENT_TYPE_LABEL[profile.clientType] : "Client"}. Talent sees this profile when viewing your project challenges.`}
        action={
          <Link
            href={`/clients/${profile.id}`}
            target="_blank"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--navy)",
              textDecoration: "none",
              padding: "8px 16px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span><WorkspaceIcon name="building" /></span> View Public Client Page ↗
          </Link>
        }
      />

      {/* Verification Status Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "16px 20px",
          border: "1px solid var(--border)",
          borderRadius: 14,
          marginBottom: 20,
          background: profile.verificationStatus === "VERIFIED" ? "rgba(56,161,105,0.04)" : "#FAFAFA",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}><WorkspaceIcon name="verification" /></span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                {isOrg ? "Organization Verification" : "Identity Verification"}
              </span>
              <VerificationBadge status={profile.verificationStatus} />
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
              {profile.verificationStatus === "VERIFIED"
                ? `Verified organization · Registered legal name: ${profile.legalName ?? profile.name}${profile.registrationNumber ? ` (Reg: ${profile.registrationNumber})` : ""}`
                : "Complete verification to unlock live project publishing and certified badge."}
            </div>
          </div>
        </div>
      </div>

      {/* Profile / Brand Photo */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>
          <WorkspaceIcon name="camera" /> {isOrg ? "Organization Logo" : "Profile Picture"}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 16 }}>
          Upload a high-resolution logo or picture displayed on project listings and certificates.
        </div>
        <ProfilePhoto name={profile.name} initialUrl={profile.avatarUrl} onChanged={onSaved} />
      </div>

      <form onSubmit={save}>
        {/* Organization / Personal Info */}
        {section(
          isOrg ? <WorkspaceIcon name="building" /> : <WorkspaceIcon name="profile" />,
          isOrg ? "Organization Details" : "Account Information",
          "Public company information and industry categorization.",
          <>
            <Field label={isOrg ? "Organization Legal / Trading Name" : "Full Display Name"} required>
              <input
                id="pf-name"
                value={form.name}
                onChange={set("name")}
                style={inputStyle()}
                required
                maxLength={200}
              />
            </Field>

            <Field label="Headquarters / Location">
              <input
                id="pf-location"
                value={form.location}
                onChange={set("location")}
                style={inputStyle()}
                placeholder="e.g. Islamabad, Pakistan or Remote"
              />
            </Field>

            {isOrg && (
              <>
                <Field label="Primary Industry">
                  <select id="pf-industry" value={form.industry} onChange={set("industry")} style={selectStyle()}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Organization Size">
                  <select id="pf-size" value={form.organizationSize} onChange={set("organizationSize")} style={selectStyle()}>
                    <option value="">Select company size</option>
                    {SIZES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Founded Year">
                  <input
                    id="pf-founded"
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    value={form.foundedYear}
                    onChange={set("foundedYear")}
                    style={inputStyle()}
                    placeholder="e.g. 2020"
                  />
                </Field>
              </>
            )}
          </>
        )}

        {/* Contact & Links */}
        {section(
          <WorkspaceIcon name="globe" />,
          "Contact & Online Presence",
          "Where candidates can learn more about your brand and verify credibility.",
          <>
            <Field label="Official Website">
              <input
                id="pf-website"
                type="url"
                value={form.website}
                onChange={set("website")}
                style={inputStyle()}
                placeholder="https://yourcompany.com"
              />
            </Field>

            <Field label="LinkedIn Company Page">
              <input
                id="pf-linkedin"
                type="url"
                value={form.linkedinUrl}
                onChange={set("linkedinUrl")}
                style={inputStyle()}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </Field>

            <Field label="Contact Phone">
              <input
                id="pf-phone"
                value={form.phone}
                onChange={set("phone")}
                style={inputStyle()}
                placeholder="+92 300 1234567"
              />
            </Field>
          </>
        )}

        {/* About & Mission */}
        {section(
          <WorkspaceIcon name="edit" />,
          isOrg ? "About the Organization" : "Introduction",
          "Share your mission, products, and what kind of talent challenges you post.",
          <>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label={isOrg ? "Company Description & Mission" : "About You"}
                hint={`Overview displayed on your client profile (${form.bio.length}/2000 chars)`}
              >
                <textarea
                  id="pf-bio"
                  value={form.bio}
                  onChange={set("bio")}
                  rows={4}
                  style={textareaStyle()}
                  placeholder={
                    isOrg
                      ? "Describe your company's mission, what products you build, and the types of projects talent can collaborate on..."
                      : "Brief introduction of who you are and the types of projects you publish..."
                  }
                  maxLength={2000}
                />
              </Field>
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
          <Btn
            type="submit"
            variant="primary"
            disabled={busy}
            style={{ padding: "12px 36px", fontSize: 15, fontWeight: 800 }}
          >
            {busy ? "Saving Changes…" : "Save Organization Profile"}
          </Btn>

          {saved && (
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
              ✓ Profile saved successfully!
            </span>
          )}
        </div>

        {error && <Notice kind="error">{error}</Notice>}
      </form>
    </div>
  );
}
