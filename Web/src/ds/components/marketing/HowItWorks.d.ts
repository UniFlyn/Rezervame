import * as React from 'react';
export interface HowItWorksStep { icon: string; title: string; text: string; }
export interface HowItWorksProps {
  title?: string;
  subtitle?: string;
  /** Override the default five steps (Descubre…Califica). */
  steps?: HowItWorksStep[];
  /** 'light' (white, default) · 'accent' (soft coral wash). */
  variant?: 'light' | 'accent';
  /** Reduce vertical padding for tight pages. */
  compact?: boolean;
  /** Inner content container width (CSS length). Default 'var(--container-max)' (1280px). Pass a wider value (e.g. 'min(94vw, 1600px)') to align with widescreen page sections. */
  contentMax?: string;
  style?: React.CSSProperties;
}
/**
 * "Cómo funciona Rezervame" — five-step booking explainer with circular
 * Lucide-style icons + step badges. Horizontal on desktop, stacks on mobile.
 * @startingPoint section="Marketing" subtitle="How Rezervame works — 5 steps" viewport="1100x340"
 */
export declare const HowItWorks: React.FC<HowItWorksProps>;
export default HowItWorks;
