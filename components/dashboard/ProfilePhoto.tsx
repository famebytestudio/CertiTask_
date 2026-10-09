"use client";

import Image from "next/image";
import { useState } from "react";

export function ProfilePhoto({ name, initialUrl, onChanged }: { name: string; initialUrl: string | null; onChanged: () => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload(file: File) {
    if (!file.size || file.size > 2 * 1024 * 1024) { setError("Choose a non-empty image up to 2 MB."); return; }
    setBusy(true); setError(null);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/auth/avatar", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Photo upload failed");
      setUrl(data.avatarUrl); onChanged();
    } catch (error) { setError(error instanceof Error ? error.message : "Photo upload failed"); }
    finally { setBusy(false); }
  }
  return <div className="mb-6 rounded-xl border border-navy/10 bg-white p-5">
    <div className="flex items-center gap-4">
      {url ? <Image unoptimized src={url} width={64} height={64} alt={`${name}'s profile photo`} className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>}
      <div><label className="cursor-pointer text-sm font-bold text-navy">{busy ? "Uploading…" : "Upload profile photo"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} /></label><p className="mt-1 text-xs text-ink-muted">Public photo · JPG, PNG, or WebP · up to 2 MB</p></div>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
