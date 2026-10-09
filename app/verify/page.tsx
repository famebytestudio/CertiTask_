"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type CertificateStatus = "VERIFIED" | "REVOKED" | "DISPUTED";
type DisplayStatus = CertificateStatus | "INVALID";

interface Certificate {
  certId: string;
  recipientName: string;
  issuerName: string;
  issuerType: "INDIVIDUAL" | "ORGANIZATION";
  projectTitle: string;
  skills: string[];
  issuedAt: string;
  status: CertificateStatus;
  statusReason: string | null;
  signatureValid: boolean;
  fingerprint: string | null;
}

interface VerifyResponse {
  certificate: {
    certId: string; title: string; recipientName: string; issuerName: string;
    issuerType: "INDIVIDUAL" | "ORGANIZATION"; skills: string[]; issuedAt: string;
    status: string; statusReason: string | null; signatureValid: boolean; fingerprint?: string;
  };
}

const STATUS: Record<DisplayStatus, { label: string; title: string; detail: string; icon: string }> = {
  VERIFIED: { label: "Verified", title: "The work checks out.", detail: "This certificate is genuine and currently valid.", icon: "✓" },
  REVOKED: { label: "Revoked", title: "This certificate was revoked.", detail: "The issuer has withdrawn this credential. See their reason below.", icon: "!" },
  DISPUTED: { label: "Under dispute", title: "This certificate is under review.", detail: "The credential has been disputed and should be treated with caution.", icon: "!" },
  INVALID: { label: "Integrity failed", title: "We can’t verify this record.", detail: "The stored details do not match the certificate signature. Treat this credential as unverified and contact support.", icon: "!" },
};

export default function VerifyPage() {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<Certificate | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const lookup = useCallback(async (raw: string) => {
    const query = raw.trim().toUpperCase();
    if (!query) return;
    setLoading(true); setSearched(false); setError(null); setLastQuery(query);
    try {
      const response = await fetch(`/api/verify/${encodeURIComponent(query)}`);
      if (response.ok) {
        const { certificate: cert } = (await response.json()) as VerifyResponse;
        const knownStatus = cert.status === "VERIFIED" || cert.status === "REVOKED" || cert.status === "DISPUTED";
        setResult({
          certId: cert.certId, recipientName: cert.recipientName, issuerName: cert.issuerName,
          issuerType: cert.issuerType, projectTitle: cert.title, skills: cert.skills ?? [],
          issuedAt: new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          status: cert.status === "REVOKED" || cert.status === "DISPUTED" ? cert.status : "VERIFIED",
          statusReason: cert.statusReason ?? null, signatureValid: knownStatus && cert.signatureValid !== false,
          fingerprint: cert.fingerprint ?? null,
        });
      } else {
        setResult(null);
        if (response.status === 429) setError("Too many lookups from your network. Please try again in a little while.");
        else if (response.status !== 404) setError("The verification service is unavailable. Please try again shortly.");
      }
    } catch {
      setResult(null); setError("Could not reach the verification service. Check your connection and try again.");
    } finally { setSearched(true); setLoading(false); }
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("id");
    if (fromUrl) { setCertId(fromUrl); void lookup(fromUrl); }
  }, [lookup]);

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void lookup(certId); };
  const displayStatus: DisplayStatus | null = result ? (result.signatureValid ? result.status : "INVALID") : null;

  return <div className="verify-redesign">
    <section className="verify-hero"><div className="ct-container verify-hero-grid"><div><p className="eyebrow"><span className="status-dot" /> THE PROOF BEHIND THE PROGRESS</p><h1>Every achievement<br />has a story.<br /><span className="hero-serif">Verify this one.</span></h1><p>Enter a CertiTask certificate ID to see who earned it, who issued it, and whether it’s currently valid.</p><a href="#verification-tool" className="ct-text-link">Check a certificate <span aria-hidden="true">↗</span></a></div><div className="verify-hero-art" aria-hidden="true"><span className="verify-orbit">✳</span><div className="verify-art-sheet"><span>CERTITASK / CREDENTIAL</span><div className="verify-art-seal">✓</div><strong>Good work.<br />Proven.</strong><small>UNIQUE ID · PUBLIC RECORD · REAL IMPACT</small></div><span className="verify-art-check">✦ A record you can trust</span></div></div></section>

    <main className="ct-container verify-main" id="verification-tool"><div className="verify-intro"><p className="eyebrow">CERTIFICATE LOOKUP</p><h2>Let’s check the <span className="hero-serif">details.</span></h2><p>Find the ID on the certificate PDF or on its public certificate page.</p></div>
      <form className="verify-search-card" onSubmit={submit}><label htmlFor="certificateId">Certificate ID</label><div className="verify-input-row"><div className="verify-input-shell"><span aria-hidden="true">#</span><input id="certificateId" type="text" autoComplete="off" spellCheck={false} placeholder="CERT-XXXX-XXXX-XXXX" value={certId} onChange={event => setCertId(event.target.value)} required aria-describedby="certificateId-help" /></div><button type="submit" className="ct-button ct-button-dark" disabled={loading || !certId.trim()}>{loading ? "Checking…" : "Verify certificate"}<span aria-hidden="true">↗</span></button></div><p id="certificateId-help">We’ll check the record, signature, and current status.</p></form>

      <div aria-live="polite" aria-busy={loading}>
        {loading && <div className="verify-loading" role="status"><span className="verify-spinner" aria-hidden="true" /> Checking the certificate record…</div>}
        {!loading && searched && result && displayStatus && <section className={`verify-result verify-result-${displayStatus.toLowerCase()}`} aria-label="Verification result"><div className="verify-result-head"><span className="verify-result-icon" aria-hidden="true">{STATUS[displayStatus].icon}</span><div><p className="eyebrow">VERIFICATION RESULT</p><h3>{STATUS[displayStatus].title}</h3><p>{STATUS[displayStatus].detail}</p></div><span className="verify-status-pill">{STATUS[displayStatus].label}</span></div>
          <div className="verify-result-body"><div className="verify-fact"><span>AWARDED TO</span><strong>{result.recipientName}</strong></div><div className="verify-fact"><span>ISSUED BY</span><strong>{result.issuerName}</strong><small>{result.issuerType === "ORGANIZATION" ? "Organization" : "Individual"}</small></div><div className="verify-fact"><span>PROJECT</span><strong>{result.projectTitle}</strong></div><div className="verify-fact"><span>DATE ISSUED</span><strong>{result.issuedAt}</strong></div></div>
          {result.skills.length > 0 && <div className="verify-skills"><span>SKILLS DEMONSTRATED</span><div>{result.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div>}
          {result.statusReason && result.status !== "VERIFIED" && <p className="verify-reason"><strong>Issuer’s reason:</strong> {result.statusReason}</p>}
          <div className="verify-record"><div><span>CERTIFICATE ID</span><code>{result.certId}</code></div>{result.fingerprint && <div><span>SIGNATURE FINGERPRINT</span><code title="Fingerprint of the stored certificate signature">{result.fingerprint}</code><small>Compare this with the fingerprint on the PDF.</small></div>}</div>
          <Link href={`/certificates/${encodeURIComponent(result.certId)}`} className="verify-record-link">Open certificate page <span aria-hidden="true">↗</span></Link>
        </section>}
        {!loading && searched && !result && <div className="verify-not-found" role="status"><span aria-hidden="true">?</span><div><p className="eyebrow">NO CONFIRMED MATCH</p><h3>{error ? "We couldn’t complete the lookup." : "We couldn’t find that certificate."}</h3><p>{error ?? <>Check the ID <strong>{lastQuery}</strong> against the certificate, then try again.</>}</p></div></div>}
        {!loading && !searched && <div className="verify-help"><span className="verify-help-icon" aria-hidden="true">✳</span><div><p className="eyebrow">HOW IT WORKS</p><h3>Proof you can follow.</h3><p>Each CertiTask certificate has a unique ID and a digital signature. A lookup shows its issuer, recipient, project, and latest status.</p></div><div className="verify-help-steps"><span><b>01</b> Enter the ID</span><span><b>02</b> Check the record</span><span><b>03</b> Share with confidence</span></div></div>}
      </div>
    </main>
  </div>;
}
