"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProfilePhoto } from "@/components/dashboard/ProfilePhoto";
import {
  Btn,
  Field,
  Notice,
  SectionHeader,
  SkillChips,
  VerificationBadge,
  inputStyle,
  selectStyle,
  textareaStyle,
} from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import type { ProfileDto } from "@/lib/types";

export function ProfileTab({ profile, onSaved }: { profile: ProfileDto; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    bio: profile.bio ?? "",
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
    gender: profile.gender ?? "",
    universityName: profile.universityName ?? "",
    degreeProgram: profile.degreeProgram ?? "",
    currentSemester: profile.currentSemester ?? "",
    gpa: profile.gpa != null ? String(profile.gpa) : "",
    skills: profile.skills.join(", "),
    portfolioUrl: profile.portfolioUrl ?? "",
    resumeUrl: profile.resumeUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedSkills = useMemo(() => {
    return form.skills
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }, [form.skills]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Full name is required");
      return;
    }
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await api("/api/auth/profile", "PATCH", {
      ...form,
      gpa: form.gpa === "" ? null : parseFloat(form.gpa),
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

  const section = (icon: string, title: string, subtitle: string, children: React.ReactNode) => (
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
      <div style={{ paddingBottom: 14, marginBottom: 18, borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "4px 0 0" }}>{subtitle}</p>
      </div>
      <div className="mobile-dashboard-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader
        icon="✏️"
        title="Edit Profile"
        subtitle="Manage your public profile information, academic credentials, and portfolio links seen by hiring clients."
        action={
          <Link
            href={`/talents/${profile.id}`}
            target="_blank"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--navy)",
              textDecoration: "none",
              padding: "8px 14px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>👤</span> Preview Public Profile ↗
          </Link>
        }
      />

      {/* Identity Verification Summary Banner */}
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
          <span style={{ fontSize: 22 }}>🪪</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>Identity Verification</span>
              <VerificationBadge status={profile.verificationStatus} />
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
              {profile.verificationStatus === "VERIFIED"
                ? `Verified identity · Official legal name: ${profile.legalName ?? profile.name}${profile.idLast4 ? ` (ID ending ${profile.idLast4})` : ""}`
                : "Certificates are printed in the verified name on your government ID."}
            </div>
          </div>
        </div>

        {profile.verificationStatus !== "VERIFIED" && (
          <Link
            href="/talent/dashboard?tab=verification"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--navy)",
              textDecoration: "underline",
            }}
          >
            Go to Verification tab →
          </Link>
        )}
      </div>

      {/* Profile Photo Uploader */}
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
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>📸 Profile Photo</div>
        <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 16 }}>
          Upload a clear photo or professional headshot for client trust.
        </div>
        <ProfilePhoto name={profile.name} initialUrl={profile.avatarUrl} onChanged={onSaved} />
      </div>

      <form onSubmit={save}>
        {/* Personal Details */}
        {section(
          "👤",
          "Personal Information",
          "Your identity and contact details for client communications.",
          <>
            <Field label="Full Name" required hint="Display name on pitches and public profile">
              <input
                id="pf-name"
                value={form.name}
                onChange={set("name")}
                style={inputStyle()}
                required
                maxLength={120}
              />
            </Field>

            <Field label="Email Address" hint="Contact email (locked to your account login)">
              <input
                value={profile.email}
                disabled
                style={{ ...inputStyle(), background: "#F8FAFC", color: "var(--ink-subtle)", cursor: "not-allowed" }}
              />
            </Field>

            <Field label="Phone Number" hint="Optional, used for project updates">
              <input
                id="pf-phone"
                value={form.phone}
                onChange={set("phone")}
                style={inputStyle()}
                placeholder="+92 300 1234567"
              />
            </Field>

            <Field label="Location (City, Country)">
              <input
                id="pf-location"
                value={form.location}
                onChange={set("location")}
                style={inputStyle()}
                placeholder="Islamabad, Pakistan"
              />
            </Field>

            <Field label="Date of Birth">
              <input
                id="pf-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={set("dateOfBirth")}
                style={inputStyle()}
                max={new Date().toISOString().slice(0, 10)}
              />
            </Field>

            <Field label="Gender">
              <select id="pf-gender" value={form.gender} onChange={set("gender")} style={selectStyle()}>
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </Field>
          </>
        )}

        {/* Education */}
        {section(
          "🎓",
          "Academic Background",
          "Your university and degree qualifications.",
          <>
            <Field label="University / Academic Institute">
              <input
                id="pf-uni"
                value={form.universityName}
                onChange={set("universityName")}
                style={inputStyle()}
                placeholder="e.g. NUST / FAST / LUMS"
              />
            </Field>

            <Field label="Degree Program">
              <input
                id="pf-degree"
                value={form.degreeProgram}
                onChange={set("degreeProgram")}
                style={inputStyle()}
                placeholder="e.g. BS Computer Science"
              />
            </Field>

            <Field label="Current Semester / Academic Stage">
              <select id="pf-sem" value={form.currentSemester} onChange={set("currentSemester")} style={selectStyle()}>
                <option value="">Select current stage</option>
                {["1", "2", "3", "4", "5", "6", "7", "8"].map(s => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
                <option value="Graduated">Graduated / Alum</option>
                <option value="Not a student">Working Professional (Not a student)</option>
              </select>
            </Field>

            <Field label="GPA / CGPA (out of 4.0)">
              <input
                id="pf-gpa"
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={form.gpa}
                onChange={set("gpa")}
                style={inputStyle()}
                placeholder="e.g. 3.75"
              />
            </Field>
          </>
        )}

        {/* Skills & Bio */}
        {section(
          "🛠️",
          "Skills, Bio & Links",
          "Showcase your technical capabilities, background story, and portfolio.",
          <>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label="Technical Skills"
                hint="Comma-separated skills (up to 30). Clients filter candidates by these tags."
              >
                <textarea
                  id="pf-skills"
                  value={form.skills}
                  onChange={set("skills")}
                  rows={2}
                  style={textareaStyle()}
                  placeholder="e.g. React, TypeScript, Next.js, Node.js, Python, TailwindCSS, Figma, GraphQL"
                />
              </Field>

              {parsedSkills.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", marginBottom: 4 }}>
                    Live Skills Preview ({parsedSkills.length}):
                  </div>
                  <SkillChips skills={parsedSkills} max={20} />
                </div>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label="Professional Bio"
                hint={`Summary of what you build, your primary strengths, and project goals (${form.bio.length}/2000 chars)`}
              >
                <textarea
                  id="pf-bio"
                  value={form.bio}
                  onChange={set("bio")}
                  rows={4}
                  style={textareaStyle()}
                  placeholder="Tell clients about your experience, engineering interests, notable projects, and working style..."
                  maxLength={2000}
                />
              </Field>
            </div>

            <Field label="Portfolio Website">
              <input
                id="pf-portfolio"
                type="url"
                value={form.portfolioUrl}
                onChange={set("portfolioUrl")}
                style={inputStyle()}
                placeholder="https://yourportfolio.dev"
              />
            </Field>

            <Field label="Resume / CV Link">
              <input
                id="pf-resume"
                type="url"
                value={form.resumeUrl}
                onChange={set("resumeUrl")}
                style={inputStyle()}
                placeholder="https://drive.google.com/... or https://resume.io/..."
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="LinkedIn Profile URL">
                <input
                  id="pf-linkedin"
                  type="url"
                  value={form.linkedinUrl}
                  onChange={set("linkedinUrl")}
                  style={inputStyle()}
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </Field>
            </div>
          </>
        )}

        {/* Actions & Feedback */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
          <Btn
            type="submit"
            variant="primary"
            disabled={busy}
            style={{ padding: "12px 36px", fontSize: 15, fontWeight: 800 }}
          >
            {busy ? "Saving Changes…" : "Save Profile Changes"}
          </Btn>

          {saved && (
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
              ✓ Profile updated successfully!
            </span>
          )}
        </div>

        {error && <Notice kind="error">{error}</Notice>}
      </form>
    </div>
  );
}
