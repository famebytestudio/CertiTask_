"use client";

import { useEffect, useState } from "react";
import { Modal, Notice } from "@/components/dashboard/ui";
import { PlanCards, type PlanCatalogItem } from "@/components/billing/PlanCards";
import type { PlanTier } from "@/lib/plans";

/** Shown when publishing or applying is blocked by billing. */
export function PlanRequiredModal({ reason, onClose, audience = "client" }: { reason: "PLAN_REQUIRED" | "LIMIT_REACHED"; onClose: () => void; audience?: "client" | "talent" }) {
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [current, setCurrent] = useState<PlanTier | null>(null);
  const [freePosts, setFreePosts] = useState(2);

  useEffect(() => {
    let live = true;
    fetch("/api/billing", { cache: "no-store" }).then(r => r.json()).then(d => { if (!live) return; setPlans(d.plans ?? []); setCurrent(d.entitlement?.subscription?.plan ?? null); setFreePosts(d.freePosts ?? 2); }).catch(() => {});
    return () => { live = false; };
  }, []);

  return (
    <Modal
      title={reason === "LIMIT_REACHED" ? audience === "talent" ? "This period's requests are used up" : "This period's posts are used up" : audience === "talent" ? "Choose a plan to keep applying" : "Choose a plan to keep posting"}
      subtitle={reason === "LIMIT_REACHED" ? "Upgrade to a bigger plan — a new 30-day period starts today." : audience === "talent" ? `You've used your ${freePosts} free project requests. Pick a plan to keep applying after payment.` : `You've used your ${freePosts} free project posts. Your project is saved as a draft; pick a plan and it can go live right after payment.`}
      onClose={onClose}
      maxWidth={860}
    >
      <Notice kind="warning">Online payments are temporarily unavailable. These plans are displayed for comparison only.</Notice>
      {plans.length === 0 ? <p style={{ color: "var(--ink-muted)" }}>Loading plans…</p> : <PlanCards plans={plans} current={current} displayOnly compact quotaLabel={audience === "talent" ? "project request" : undefined} />}
    </Modal>
  );
}
