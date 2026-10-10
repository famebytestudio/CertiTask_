"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./IntroSplash.module.css";

const MAX_WAIT = 9_000;

export interface IntroSplashProps {
  clientImage?: string;
  talentImage?: string;
  logo?: string;
  talentName?: string;
  projectName?: string;
  brandName?: string;
  onComplete?: () => void;
  /** Total animation duration in milliseconds; capped at 8s for the 9s failsafe. */
  duration?: number;
}

export default function IntroSplash({
  clientImage = "/client.jpg",
  talentImage = "/talent.jpg",
  logo = "/logo.png", // Replace with your logo in public, or pass the logo prop.
  talentName = "Your talent",
  projectName = "Your next great project",
  brandName = "CertiTask",
  onComplete,
  duration = 7_600,
}: IntroSplashProps) {
  const root = useRef<HTMLDivElement>(null);
  const callback = useRef(onComplete);
  const [visible, setVisible] = useState(true);
  useEffect(() => { callback.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const overlay = root.current;
    if (!overlay) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ms = Number.isFinite(duration) ? Math.max(800, Math.min(duration, 8_000)) : 7_600;
    let disposed = false;
    let finished = false;
    let locked = false;
    let frame = 0;
    const timers: number[] = [];
    const animations: Animation[] = [];
    const imageCleanups: Array<() => void> = [];
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    const activeElement = document.activeElement;
    const restore = () => {
      if (!locked) return;
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      locked = false;
      if (overlay.contains(document.activeElement) && activeElement instanceof HTMLElement) activeElement.focus({ preventScroll: true });
    };
    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      timers.forEach(window.clearTimeout);
      animations.forEach(animation => animation.cancel());
      imageCleanups.forEach(cleanup => cleanup());
      restore();
      setVisible(false);
      callback.current?.();
    };

    const animate = (element: Element, keyframes: Keyframe[], length = ms) => {
      const animation = element.animate(keyframes, { duration: length, fill: "both", easing: "linear" });
      animations.push(animation);
    };
    // Every moving element uses only transform and opacity. WAAPI avoids global
    // CSS animation-duration overrides; reduced motion is handled explicitly.
    const scene = (selector: string, start: number, end: number, entrance = "translateY(16px)", exit = "translateY(-12px)") => {
      overlay.querySelectorAll(selector).forEach(element => animate(element, [
        { offset: 0, opacity: 0, transform: entrance },
        { offset: start, opacity: 0, transform: entrance, easing: "cubic-bezier(.22,1,.36,1)" },
        { offset: start + .065, opacity: 1, transform: "none" },
        { offset: end - .04, opacity: 1, transform: "none", easing: "ease-in-out" },
        { offset: end, opacity: 0, transform: exit },
        { offset: 1, opacity: 0, transform: exit },
      ]));
    };
    const fadeScene = (selector: string, startAt: number, endAt: number) => {
      overlay.querySelectorAll(selector).forEach(element => animate(element, [
        { offset: 0, opacity: 0 },
        { offset: startAt, opacity: 0, easing: "ease-out" },
        { offset: startAt + .035, opacity: 1 },
        { offset: endAt - .035, opacity: 1, easing: "ease-in" },
        { offset: endAt, opacity: 0 },
        { offset: 1, opacity: 0 },
      ]));
    };
    const start = () => {
      if (disposed || finished) return;
      overlay.dataset.phase = motion.matches ? "reduced" : "playing";
      if (motion.matches) {
        // Keep the complete sequence through crossfades while removing all
        // translation, scaling, parallax, and flipping.
        fadeScene("[data-network]", 0, .37);
        fadeScene("[data-project]", .11, .32);
        fadeScene("[data-spark]", .22, .34);
        fadeScene("[data-checklist]", .34, .58);
        overlay.querySelectorAll("[data-tick]").forEach((tick, index) => animate(tick, [
          { offset: 0, opacity: 0 },
          { offset: .39 + index * .045, opacity: 0 },
          { offset: .42 + index * .045, opacity: 1 },
          { offset: 1, opacity: 1 },
        ]));
        fadeScene("[data-certificate]", .56, .83);
        fadeScene("[data-brand]", .8, 1);
        animate(overlay, [{ opacity: 1 }, { offset: .95, opacity: 1 }, { opacity: 0 }]);
        timers.push(window.setTimeout(finish, ms));
        return;
      }
      scene("[data-network]", 0, .37);
      scene("[data-checklist]", .34, .58);
      scene("[data-certificate]", .56, .83, "perspective(900px) translateY(110px) rotateX(65deg) scale(.9)", "translateY(-12px) scale(1.025)");
      overlay.querySelectorAll("[data-line]").forEach((line, index) => animate(line, [
        { offset: 0, transform: "scaleX(0)", opacity: 0 },
        { offset: .06, transform: "scaleX(0)", opacity: 1, easing: "ease-in-out" },
        { offset: .18 + index * .01, transform: "scaleX(1)", opacity: 1 },
        { offset: 1, transform: "scaleX(1)", opacity: 1 },
      ]));
      overlay.querySelectorAll("[data-project]").forEach((card, index) => {
        const startAt = .12 + index * .035;
        animate(card, [
          { offset: 0, opacity: 0, transform: "translateX(0) scale(.8)" },
          { offset: startAt, opacity: 0, transform: "translateX(0) scale(.8)", easing: "ease-out" },
          { offset: startAt + .02, opacity: 1, transform: "translateX(10px) scale(1)" },
          { offset: startAt + .12, opacity: 1, transform: "translateX(var(--travel)) scale(1)" },
          { offset: startAt + .145, opacity: 0, transform: "translateX(var(--travel)) scale(.8)" },
          { offset: 1, opacity: 0 },
        ]);
      });
      scene("[data-spark]", .22, .34, "scale(.2)", "scale(1.6)");
      overlay.querySelectorAll("[data-tick]").forEach((tick, index) => animate(tick, [
        { offset: 0, opacity: 0, transform: "scale(.65)" },
        { offset: .395 + index * .045, opacity: 0, transform: "scale(.65)", easing: "ease-out" },
        { offset: .425 + index * .045, opacity: 1, transform: "scale(1)" },
        { offset: 1, opacity: 1, transform: "scale(1)" },
      ]));
      animate(overlay.querySelector("[data-brand]")!, [
        { offset: 0, opacity: 0, transform: "translateY(12px) scale(.94)" },
        { offset: .8, opacity: 0, transform: "translateY(12px) scale(.94)", easing: "ease-out" },
        { offset: .88, opacity: 1, transform: "none" },
        { offset: 1, opacity: 1, transform: "none" },
      ]);
      animate(overlay, [{ opacity: 1 }, { offset: .95, opacity: 1, easing: "ease-out" }, { opacity: 0 }]);
      timers.push(window.setTimeout(finish, ms));
    };
    const preload = (src: string) => new Promise<void>(resolve => {
      const image = new window.Image();
      const settled = () => { image.onload = null; image.onerror = null; resolve(); };
      image.onload = settled;
      image.onerror = settled;
      image.src = src;
      imageCleanups.push(settled);
      if (image.complete) settled();
    });
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") finish(); };
    const change = () => { if (motion.matches) finish(); };
    overlay.addEventListener("click", finish);
    window.addEventListener("keydown", key);
    motion.addEventListener("change", change);
    frame = requestAnimationFrame(() => {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      locked = true;
      overlay.dataset.phase = "preloading";
      overlay.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
      // Bound image loading so missing or stalled assets cannot hold up the site.
      const deadline = new Promise<void>(resolve => timers.push(window.setTimeout(resolve, 900)));
      void Promise.race([Promise.all([preload(clientImage), preload(talentImage), preload(logo)]), deadline]).then(start);
    });
    timers.push(window.setTimeout(finish, MAX_WAIT));
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      animations.forEach(animation => animation.cancel());
      imageCleanups.forEach(cleanup => cleanup());
      overlay.removeEventListener("click", finish);
      window.removeEventListener("keydown", key);
      motion.removeEventListener("change", change);
      restore();
    };
  }, [clientImage, talentImage, logo, duration]);

  function lean(event: PointerEvent<HTMLDivElement>) {
    if (root.current?.dataset.phase !== "playing" || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 8;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 8;
    event.currentTarget.style.setProperty("--lean-x", x + "deg");
    event.currentTarget.style.setProperty("--lean-y", -y + "deg");
  }
  if (!visible) return null;
  return (
    <div ref={root} className={styles.overlay} data-intro-splash role="status" aria-label={`Introducing ${brandName}`}>
      <svg className={styles.grain} aria-hidden="true"><filter id="intro-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#intro-grain)" /></svg>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.network} data-network>
          <div className={styles.connection}><i data-line /><i data-line /></div>
          {[{ src: clientImage, label: "Client" }, { src: talentImage, label: "Talent" }].map((person, index) =>
            <div key={person.label} className={styles.avatarPosition} style={{ left: index ? "82%" : "18%" }}>
              <div className={styles.avatarLean} onPointerMove={lean} onPointerLeave={event => { event.currentTarget.style.setProperty("--lean-x", "0deg"); event.currentTarget.style.setProperty("--lean-y", "0deg"); }}>
                <div className={styles.avatar}>
                  <Image src={person.src} alt="" width={160} height={160} unoptimized onError={event => { event.currentTarget.src = index ? "/talent-placeholder.svg" : "/client-placeholder.svg"; }} />
                </div>
              </div>
              <p>{person.label}</p>
            </div>
          )}
          {[0, 1, 2].map(index => <div key={index} className={styles.project} data-project><span /><i /><i /><small>PROJECT 0{index + 1}</small></div>)}
          <div className={styles.spark} data-spark><svg viewBox="0 0 100 100"><path d="M50 5v22m0 46v22M5 50h22m46 0h22M18 18l16 16m32 32 16 16m0-64L66 34M34 66 18 82" /><circle cx="50" cy="50" r="8" /></svg></div>
          <p className={styles.caption}>A connection. A project. A possibility.</p>
        </div>
        <div className={styles.checklist} data-checklist>
          <p className={styles.eyebrow}>FROM PROMISE TO PROOF</p>
          {["Brief approved", "Work delivered", "Client confirmed"].map(label => <div className={styles.checkRow} key={label}><span><svg data-tick viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span>{label}</div>)}
        </div>
        <div className={styles.certificate} data-certificate>
          <div className={styles.certificateBorder}>
            <p className={styles.certificateBrand}>{brandName}</p>
            <h2>Certificate of<br />Project Completion</h2>
            <p className={styles.presented}>PRESENTED TO</p>
            <h3>{talentName}</h3>
            <p className={styles.projectName}>{projectName}</p>
            <p className={styles.verified}>CLIENT CONFIRMED · ACHIEVEMENT VERIFIED</p>
            <svg className={styles.seal} viewBox="0 0 100 120"><path d="m25 65-7 51 30-16 27 16-7-51" fill="#b7882c" /><circle cx="48" cy="46" r="38" fill="#E6B84C" /><circle cx="48" cy="46" r="29" fill="none" stroke="#fff2c3" /><path d="m32 46 11 11 21-25" fill="none" stroke="#77541b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <div className={styles.brand} data-brand>
          <Image src={logo} alt="" width={144} height={144} unoptimized onError={event => { event.currentTarget.src = "/app-icon-128.png"; }} />
          <h2>{brandName}<span>.</span></h2>
          <p>Real projects. Lasting proof.</p>
        </div>
      </div>
      <button type="button" className="absolute bottom-6 right-6 rounded-full border border-white/20 px-5 py-2.5 text-xs text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Skip intro <span aria-hidden="true" className="ml-2 text-white/40">Esc</span></button>
    </div>
  );
}
