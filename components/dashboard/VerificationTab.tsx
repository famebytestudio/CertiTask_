"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Field, Notice, SectionHeader, VerificationBadge, inputStyle, selectStyle, formatDate } from "@/components/dashboard/ui";
import { api } from "@/components/dashboard/useDashboardData";
import { ID_TYPES, ID_TYPE_LABEL, type IdType } from "@/lib/verification";
import type { ProfileDto } from "@/lib/types";

interface DocMeta { id: string; type: string; mimeType: string; sizeBytes: number; createdAt: string }
interface VerificationRequestDto {
  id: string; kind: "IDENTITY" | "ORGANIZATION"; status: string; submittedAt: string; reviewedAt: string | null; rejectionReason: string | null;
  formData: { legalName?: string; idType?: string; idLast4?: string; authorizedPersonName?: string; registrationNumber?: string } | null;
  documents: DocMeta[];
}
interface State {
  user: { verificationStatus: string; verifiedAt: string | null; emailVerifiedAt: string | null; legalName: string | null; idType: string | null; idLast4: string | null; clientType: string | null; registrationNumber: string | null };
  requests: VerificationRequestDto[];
  unattachedDocuments: DocMeta[];
}

type Slot = "idFront" | "idBack" | "orgRegistration";
const SLOT_TYPE: Record<Slot, string> = { idFront: "ID_FRONT", idBack: "ID_BACK", orgRegistration: "ORG_REGISTRATION" };

function DocumentUpload({ slot, label, hint, doc, onChange, disabled }: { slot: Slot; label: string; hint: string; doc: DocMeta | null; onChange: (d: DocMeta | null) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", SLOT_TYPE[slot]);
    try {
      const res = await fetch("/api/verification/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Upload failed"); return; }
      onChange(json.document as DocMeta);
    } catch { setError("Network error"); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!doc) return;
    await api(`/api/verification/documents/${doc.id}`, "DELETE");
    onChange(null);
  }

  return (
    <div style={{ border: `1.5px dashed ${doc ? "var(--success)" : "var(--border)"}`, borderRadius: 10, padding: 14, background: doc ? "rgba(56,161,105,0.04)" : "#FAFAFA" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--ink-subtle)", marginBottom: 10 }}>{hint}</div>
      {doc ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 700 }}>✓ Uploaded</span>
          <a href={`/api/verification/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--navy)", fontWeight: 600 }}>Preview</a>
          <span style={{ fontSize: 11, color: "var(--ink-subtle)" }}>{doc.sizeBytes < 1024 ? "<1" : Math.round(doc.sizeBytes / 1024)} KB · {doc.mimeType.split("/")[1].toUpperCase()}</span>
          {!disabled && <button type="button" onClick={remove} style={{ fontSize: 11, color: "#9B2C2C", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>}
        </div>
      ) : (
        <label style={{ display: "inline-block", padding: "8px 14px", background: "var(--navy)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: busy || disabled ? "not-allowed" : "pointer", opacity: busy || disabled ? 0.6 : 1 }}>
          {busy ? "Uploading…" : "Choose file"}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy || disabled} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
        </label>
      )}
      {error && <div style={{ fontSize: 12, color: "#9B2C2C", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export function VerificationTab({ profile, onChanged }: { profile: ProfileDto; onChanged: () => void }) {
  const router = useRouter();
  const isOrg = profile.role === "CLIENT" && profile.clientType === "ORGANIZATION";
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ legalName: profile.legalName ?? (isOrg ? "" : profile.name), authorizedPersonName: "", registrationNumber: profile.registrationNumber ?? "", idType: "CNIC" as IdType, idNumber: "" });
  const [docs, setDocs] = useState<Record<Slot, DocMeta | null>>({ idFront: null, idBack: null, orgRegistration: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/verification", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as State;
      setState(json);
      // Re-attach uploads from an unfinished attempt.
      const bySlot: Record<Slot, DocMeta | null> = { idFront: null, idBack: null, orgRegistration: null };
      for (const d of json.unattachedDocuments) {
        const slot = (Object.keys(SLOT_TYPE) as Slot[]).find(s => SLOT_TYPE[s] === d.type);
        if (slot) bySlot[slot] = d;
      }
      setDocs(bySlot);
    }
    setLoading(false);
  }, []);
  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  async function resend() {
    const r = await api<{ alreadyVerified?: boolean }>("/api/auth/resend-verification", "POST");
    if (r.ok) {
      router.push("/auth/verify-email");
    } else {
      setResent(r.error ?? "Could not send");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await api("/api/verification", "POST", {
      legalName: form.legalName, authorizedPersonName: form.authorizedPersonName, registrationNumber: form.registrationNumber,
      idType: form.idType, idNumber: form.idNumber,
      documentIds: { idFront: docs.idFront?.id, idBack: docs.idBack?.id, orgRegistration: docs.orgRegistration?.id },
    });
    setBusy(false);
    if (!r.ok) { setError(r.error ?? "Could not submit"); return; }
    setForm(f => ({ ...f, idNumber: "" }));
    await load();
    onChanged();
  }

  if (loading || !state) return <p style={{ color: "var(--ink-muted)" }}>Loading…</p>;

  const status = state.user.verificationStatus;
  const latest = state.requests[0];
  const emailOk = !!state.user.emailVerifiedAt;

  return (
    <div>
      <SectionHeader icon="🪪" title={isOrg ? "Organization verification" : "Identity verification"}
        subtitle={isOrg ? "Prove your organization is real. Verified clients can publish projects and their name appears on certificates as a Verified Organization." : profile.role === "CLIENT" ? "Verified clients can publish projects. Your legal name appears on certificates you issue." : "Certificates are issued in the legal name on your ID. Verification is reviewed by a person, usually within a day."} />

      {/* Step 1: email */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>1. Email address {emailOk ? <span style={{ color: "var(--success)" }}>✓ confirmed</span> : <span style={{ color: "#9B2C2C" }}>— not confirmed</span>}</div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{emailOk ? profile.email : `We sent a 6-digit code to ${profile.email}. Enter it to continue.`}</div>
          {resent && <div style={{ fontSize: 12, color: "var(--navy)", marginTop: 4 }}>{resent}</div>}
        </div>
        {!emailOk && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" small onClick={resend}>Resend code</Btn>
            <Btn variant="primary" small onClick={() => router.push("/auth/verify-email")}>Enter code</Btn>
          </div>
        )}
      </div>

      {/* Step 2: status */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>2. {isOrg ? "Organization documents" : "Government ID"}</div>
          <VerificationBadge status={status} />
        </div>
        {status === "VERIFIED" && (
          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
            Verified on {formatDate(state.user.verifiedAt)} · Legal name: <strong>{state.user.legalName}</strong>{state.user.idLast4 && <> · ID ending <strong>{state.user.idLast4}</strong></>}
            {isOrg && state.user.registrationNumber && <> · Reg. no. <strong>{state.user.registrationNumber}</strong></>}
          </div>
        )}
        {status === "PENDING_REVIEW" && latest && (
          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>Submitted {formatDate(latest.submittedAt)}. An admin is reviewing your documents; you&apos;ll get an email and a notification when it&apos;s decided.</div>
        )}
        {status === "REJECTED" && latest && (
          <Notice kind="error">Not approved on {formatDate(latest.reviewedAt)}. Reason: {latest.rejectionReason}. Fix the issue below and resubmit.</Notice>
        )}
      </div>

      {(status === "UNVERIFIED" || status === "REJECTED") && (
        <form onSubmit={submit} style={{ opacity: emailOk ? 1 : 0.55, pointerEvents: emailOk ? "auto" : "none" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {isOrg ? (
              <>
                <Field label="Registered legal name of the organization" required hint="Exactly as it appears on the registration document. Printed on certificates.">
                  <input id="v-legal" value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} style={inputStyle()} required maxLength={150} />
                </Field>
                <Field label="Registration / NTN / SECP number" required>
                  <input id="v-reg" value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} style={inputStyle()} required maxLength={60} />
                </Field>
                <DocumentUpload slot="orgRegistration" label="Registration proof" hint="SECP certificate of incorporation, NTN certificate or business registration. PDF or photo, max 5 MB." doc={docs.orgRegistration} onChange={d => setDocs({ ...docs, orgRegistration: d })} />
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Authorized person (you)</div>
                <Field label="Your full legal name" required hint="As on your ID. You are accountable for approvals made from this account.">
                  <input id="v-auth-name" value={form.authorizedPersonName} onChange={e => setForm({ ...form, authorizedPersonName: e.target.value })} style={inputStyle()} required maxLength={150} />
                </Field>
              </>
            ) : (
              <Field label="Full legal name" required hint="Exactly as on your ID. This is the name printed on your certificates.">
                <input id="v-legal" value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} style={inputStyle()} required maxLength={150} />
              </Field>
            )}
            <div className="mobile-dashboard-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="ID type" required>
                <select id="v-idtype" value={form.idType} onChange={e => setForm({ ...form, idType: e.target.value as IdType })} style={selectStyle()}>
                  {ID_TYPES.map(t => <option key={t} value={t}>{ID_TYPE_LABEL[t]}</option>)}
                </select>
              </Field>
              <Field label="ID number" required hint="Stored only as a one-way hash and the last 4 digits.">
                <input id="v-idnum" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} style={inputStyle()} placeholder={form.idType === "CNIC" ? "12345-1234567-1" : "Number as printed"} required autoComplete="off" />
              </Field>
            </div>
            <div className="mobile-dashboard-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <DocumentUpload slot="idFront" label="ID — front" hint="Clear photo or scan. All four corners visible. Max 5 MB." doc={docs.idFront} onChange={d => setDocs({ ...docs, idFront: d })} />
              <DocumentUpload slot="idBack" label="ID — back" hint="For a passport, upload the data page again." doc={docs.idBack} onChange={d => setDocs({ ...docs, idBack: d })} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 12 }}>
            Your documents are stored privately, visible only to CertiTask admins, and deleted 90 days after the decision. We keep only your verification status, legal name and the last 4 digits of the ID.
          </div>
          <Btn type="submit" disabled={busy || !docs.idFront || !docs.idBack || (isOrg && !docs.orgRegistration)} style={{ padding: "12px 28px", fontSize: 15 }}>
            {busy ? "Submitting…" : status === "REJECTED" ? "Resubmit for review" : "Submit for review"}
          </Btn>
          {error && <Notice kind="error">{error}</Notice>}
        </form>
      )}

      {state.requests.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>History</div>
          {state.requests.map(r => (
            <div key={r.id} style={{ fontSize: 12, color: "var(--ink-muted)", padding: "6px 0", borderBottom: "1px solid var(--line, var(--border))" }}>
              {formatDate(r.submittedAt)} — {r.status.toLowerCase().replace("_", " ")}{r.rejectionReason ? `: ${r.rejectionReason}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
