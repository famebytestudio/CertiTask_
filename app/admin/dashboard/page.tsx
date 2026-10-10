"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminUiProvider, Badge, Icon, Spinner, StatusBadge, adminApi, useDebounced } from "@/components/admin/ui";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { UsersPanel, UserDrawer } from "@/components/admin/UsersPanel";
import { ProjectsPanel } from "@/components/admin/ProjectsPanel";
import { CertificatesPanel } from "@/components/admin/CertificatesPanel";
import { VerificationQueue } from "@/components/admin/VerificationQueue";
import { PaymentsPanel } from "@/components/admin/PaymentsPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { AuditPanel } from "@/components/admin/AuditPanel";

export type AdminTab = "dashboard" | "verifications" | "users" | "projects" | "certificates" | "payments" | "messages" | "audit";
const TABS: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "verifications", label: "Verifications", icon: "idcard" },
  { id: "users", label: "Users", icon: "users" },
  { id: "projects", label: "Projects", icon: "projects" },
  { id: "certificates", label: "Certificates", icon: "certificate" },
  { id: "payments", label: "Payments", icon: "card" },
  { id: "messages", label: "Messages", icon: "mail" },
  { id: "audit", label: "Audit log", icon: "list" },
];
const isTab = (v: string | null): v is AdminTab => TABS.some(t => t.id === v);

export default function AdminDashboardPage() {
  return (
    <AdminUiProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-slate-500"><Spinner /></div>}>
        <AdminShell />
      </Suspense>
    </AdminUiProvider>
  );
}

function AdminShell() {
  const router = useRouter();
  const params = useSearchParams();
  const tab: AdminTab = isTab(params.get("tab")) ? (params.get("tab") as AdminTab) : "dashboard";
  const query = useMemo(() => { const o: Record<string, string> = {}; params.forEach((v, k) => { if (k !== "tab") o[k] = v; }); return o; }, [params]);
  const [counts, setCounts] = useState<{ pendingVerifications: number; unreadMessages: number; certificatesDisputed: number } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [authError, setAuthError] = useState(false);

  /** Navigate to a tab, optionally with a fresh query; `user` (drawer) is preserved across tabs. */
  const go = useCallback((next: AdminTab, q: Record<string, string | undefined> = {}) => {
    const sp = new URLSearchParams();
    sp.set("tab", next);
    for (const [k, v] of Object.entries(q)) if (v) sp.set(k, v);
    router.push(`/admin/dashboard?${sp.toString()}`);
    setNavOpen(false);
  }, [router]);
  const setQuery = useCallback((q: Record<string, string | undefined>) => go(tab, q), [go, tab]);
  const openUser = useCallback((id: string) => setQuery({ ...query, user: id }), [setQuery, query]);

  const refreshCounts = useCallback(async () => {
    const r = await adminApi<{ counts: { pendingVerifications: number; unreadMessages: number; certificatesDisputed: number } }>("/api/admin/overview?light=1");
    if (r.status === 401 || r.status === 403) { await fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); setAuthError(true); router.replace("/admin/login"); return; }
    if (r.ok && r.data) setCounts(r.data.counts);
  }, [router]);
  useEffect(() => { const t = setTimeout(() => { void refreshCounts(); }, 0); return () => clearTimeout(t); }, [refreshCounts]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Force a document navigation so no authenticated dashboard state remains
    // in the client router cache after the session has been destroyed.
    window.location.replace("/admin/login");
  }

  if (authError) return null;
  const badge = (id: AdminTab) => id === "verifications" ? counts?.pendingVerifications : id === "messages" ? counts?.unreadMessages : id === "certificates" ? counts?.certificatesDisputed : 0;
  const activeTab = TABS.find(item => item.id === tab) ?? TABS[0];
  const openItems = (counts?.pendingVerifications ?? 0) + (counts?.unreadMessages ?? 0) + (counts?.certificatesDisputed ?? 0);

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
      {TABS.map(t => {
        const n = badge(t.id) ?? 0;
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => go(t.id)} aria-current={active ? "page" : undefined}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-white text-navy shadow-[0_8px_24px_rgba(0,0,0,.16)]" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${active ? "bg-gold/20 text-[#8a6a0d]" : "bg-white/[0.06] text-white/70 group-hover:bg-white/10 group-hover:text-white"}`}><Icon name={t.icon} className="h-[17px] w-[17px]" /></span>
            <span className="flex-1 text-left">{t.label}</span>
            {n > 0 && <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-extrabold tabular-nums ${active ? "bg-navy text-white" : "bg-gold text-navy"}`}>{n}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-workspace flex min-h-screen bg-[#f5f7fa]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col bg-[#081d34] text-white shadow-[12px_0_40px_rgba(8,29,52,.08)] lg:flex">
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-black/20"><Icon name="shield" className="h-6 w-6" /></div>
          <div><div className="text-[17px] font-black leading-tight tracking-tight">CertiTask</div><div className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">Control centre</div></div>
        </div>
        <div className="px-5 pt-5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Workspace</div>
        {nav}
        <div className="border-t border-white/[0.08] p-3">
          <Link href="/" target="_blank" className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/55 transition hover:bg-white/[0.07] hover:text-white"><Icon name="external" className="h-4 w-4" /> Open public site</Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/55 transition hover:bg-red-500/15 hover:text-red-200"><Icon name="logout" className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#081d34] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4"><span className="flex items-center gap-2 font-extrabold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-navy"><Icon name="shield" className="h-5 w-5" /></span> CertiTask Admin</span><button onClick={() => setNavOpen(false)} aria-label="Close menu" className="rounded-lg p-2 hover:bg-white/10"><Icon name="x" /></button></div>
            {nav}
            <div className="border-t border-white/10 p-3"><button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:bg-red-500/20 hover:text-white"><Icon name="logout" className="h-4 w-4" /> Sign out</button></div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:px-8">
          <button onClick={() => setNavOpen(true)} className="rounded-xl p-2 text-navy hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Icon name="menu" /></button>
          <div className="hidden min-w-32 lg:block"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Admin workspace</div><div className="mt-0.5 text-sm font-extrabold text-navy">{activeTab.label}</div></div>
          <GlobalSearch go={go} openUser={openUser} />
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => go("verifications")} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-navy/20 hover:text-navy" aria-label={`${openItems} items need attention`}><Icon name="bell" className="h-5 w-5" />{openItems > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}</button>
            <div className="hidden text-right sm:block"><div className="text-xs font-bold text-navy">Super admin</div><div className="text-[10px] text-slate-400">Platform owner</div></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-xs font-black text-gold shadow-sm">SA</div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1400px]">
            {tab === "dashboard" && <DashboardPanel goTo={go} openUser={openUser} />}
            {tab === "verifications" && <VerificationQueue query={query} setQuery={setQuery} onDecided={refreshCounts} openUser={openUser} />}
            {tab === "users" && <UsersPanel query={query} setQuery={setQuery} onChanged={refreshCounts} />}
            {tab === "projects" && <ProjectsPanel query={query} setQuery={setQuery} onChanged={refreshCounts} openUser={openUser} />}
            {tab === "certificates" && <CertificatesPanel query={query} setQuery={setQuery} onChanged={refreshCounts} openUser={openUser} />}
            {tab === "payments" && <PaymentsPanel query={query} setQuery={setQuery} onChanged={refreshCounts} openUser={openUser} />}
            {tab === "messages" && <MessagesPanel query={query} setQuery={setQuery} onChanged={refreshCounts} openUser={openUser} />}
            {tab === "audit" && <AuditPanel query={query} setQuery={setQuery} openUser={openUser} />}
          </div>
        </main>
      </div>

      {/* The user drawer can be opened from any tab except Users (which renders its own). */}
      {tab !== "users" && <UserDrawer id={query.user ?? null} onClose={() => setQuery({ ...query, user: undefined })} onChanged={refreshCounts} />}
    </div>
  );
}

/* ─────────────────────────── global search ─────────────────────────── */

interface SearchResp {
  users: Array<{ id: string; name: string; email: string; role: string; verificationStatus: string; suspendedAt: string | null }>;
  projects: Array<{ id: string; title: string; status: string; client: { name: string } }>;
  certificates: Array<{ id: string; certId: string; recipientName: string; title: string; status: string }>;
}

function GlobalSearch({ go, openUser }: { go: (t: AdminTab, q?: Record<string, string>) => void; openUser: (id: string) => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 250);
  const [res, setRes] = useState<SearchResp | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let live = true;
    const term = dq.trim();
    const t = setTimeout(() => {
      if (term.length < 2) { setRes(null); return; }
      adminApi<SearchResp>(`/api/admin/search?q=${encodeURIComponent(term)}`).then(r => { if (live && r.ok && r.data) setRes(r.data); });
    }, 0);
    return () => { live = false; clearTimeout(t); };
  }, [dq]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); box.current?.querySelector("input")?.focus(); setOpen(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (fn: () => void) => { fn(); setOpen(false); setQ(""); };
  const empty = res && res.users.length + res.projects.length + res.certificates.length === 0;

  return (
    <div ref={box} className="relative w-full max-w-lg">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search users, projects, certificate IDs…  (Ctrl+K)" aria-label="Global search"
        className="w-full rounded-lg bg-slate-100 py-2 pl-9 pr-3 text-sm text-navy placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy" />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[70vh] overflow-y-auto rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
          {!res ? <div className="px-3 py-2 text-sm text-slate-500">Searching…</div> : empty ? <div className="px-3 py-2 text-sm text-slate-500">No matches for “{q}”.</div> : (
            <>
              {res.users.length > 0 && <Group title="Users">{res.users.map(u => <Item key={u.id} onClick={() => pick(() => openUser(u.id))} primary={u.name} secondary={u.email} right={<><Badge tone={u.role === "CLIENT" ? "navy" : "success"}>{u.role.toLowerCase()}</Badge>{u.suspendedAt && <Badge tone="danger">suspended</Badge>}</>} />)}</Group>}
              {res.projects.length > 0 && <Group title="Projects">{res.projects.map(p => <Item key={p.id} onClick={() => pick(() => go("projects", { project: p.id }))} primary={p.title} secondary={p.client.name} right={<StatusBadge status={p.status} />} />)}</Group>}
              {res.certificates.length > 0 && <Group title="Certificates">{res.certificates.map(c => <Item key={c.id} onClick={() => pick(() => go("certificates", { q: c.certId }))} primary={`${c.recipientName} · ${c.title}`} secondary={c.certId} right={<StatusBadge status={c.status} />} />)}</Group>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
const Group = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="mb-1"><div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</div>{children}</div>;
const Item = ({ onClick, primary, secondary, right }: { onClick: () => void; primary: string; secondary: string; right?: React.ReactNode }) => (
  <button onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-navy">{primary}</span><span className="block truncate text-xs text-slate-500">{secondary}</span></span>
    <span className="flex shrink-0 gap-1">{right}</span>
  </button>
);
