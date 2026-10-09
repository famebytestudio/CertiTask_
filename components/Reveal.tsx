"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Content stays readable without JavaScript; motion is progressive enhancement. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      node.animate([{ opacity: 0, transform: "translateY(22px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
}
