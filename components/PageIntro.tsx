import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function PageIntro({ eyebrow, title, accent, description, children }: { eyebrow: string; title: string; accent: string; description: string; children?: ReactNode }) {
  return <section className="page-intro"><div className="ct-container page-intro-inner"><Reveal><p className="eyebrow"><span className="status-dot" />{eyebrow}</p><h1>{title}<br /><span className="hero-serif">{accent}</span></h1><p className="page-intro-description">{description}</p>{children && <div className="page-intro-actions">{children}</div>}</Reveal><div className="intro-art" aria-hidden="true"><span>✳</span><div><span>REAL PROJECTS</span><strong>Real proof.</strong><small>CERTITASK / YOUR NEXT CHAPTER</small></div></div></div></section>;
}
