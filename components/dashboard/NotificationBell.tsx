"use client";

import { WorkspaceIcon } from "@/components/dashboard/WorkspaceIcon";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface Item { id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }
interface PopupPosition { left: number; top: number; maxHeight: number }

function ago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell({ light = false }: { light?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.notifications ?? []);
      setUnread(json.unread ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    const iv = setInterval(() => { void load(); }, 60_000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && !popupRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || !light) return;
    const updatePosition = () => {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds) return;
      const maxHeight = Math.min(420, window.innerHeight - 24);
      const width = Math.min(340, window.innerWidth - 32);
      setPopupPosition({
        left: Math.min(Math.max(16, bounds.left), window.innerWidth - width - 16),
        top: Math.max(12, Math.min(bounds.bottom + 8, window.innerHeight - maxHeight - 12)),
        maxHeight,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, light]);

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems(items.map(i => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
  }

  async function openItem(n: Item) {
    if (!n.readAt) {
      void fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
      setItems(items.map(i => i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i));
      setUnread(u => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  const popup = (
    <div
      ref={popupRef}
      style={{
        position: light ? "fixed" : "absolute",
        left: light ? popupPosition?.left : undefined,
        right: light ? undefined : 0,
        top: light ? popupPosition?.top : 44,
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: light ? popupPosition?.maxHeight : undefined,
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Notifications</span>
        {unread > 0 && <button onClick={markAll} style={{ fontSize: 11, color: "var(--navy)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>}
      </div>
      <div style={{ maxHeight: light && popupPosition ? popupPosition.maxHeight - 48 : 380, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--ink-subtle)" }}>Nothing yet.</div>
        ) : items.map(n => (
          <button key={n.id} onClick={() => openItem(n)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: n.readAt ? "#fff" : "rgba(201,162,39,0.08)", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{n.title}</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
            <div style={{ fontSize: 10, color: "var(--ink-subtle)", marginTop: 4 }}>{ago(n.createdAt)}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open}
        style={{ position: "relative", width: 36, height: 36, borderRadius: 10, background: light ? "var(--paper)" : "rgba(255,255,255,0.1)", border: light ? "1px solid var(--border)" : "1px solid rgba(255,255,255,0.2)", color: light ? "var(--navy)" : "#fff", fontSize: 16, cursor: "pointer" }}>
        <WorkspaceIcon name="bell" />
        {unread > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "#E53E3E", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (light
        ? popupPosition && createPortal(popup, document.body)
        : popup)}
    </div>
  );
}
