import * as React from 'react';

export type SocialName = 'instagram' | 'facebook' | 'linkedin' | 'x' | 'tiktok' | 'youtube';

export interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  /** Which brand mark to render. */
  name: SocialName;
  /** Pixel size (width = height). Default 20. */
  size?: number;
  /** Fill color. Default 'currentColor'. */
  color?: string;
  style?: React.CSSProperties;
}

/** Solid brand glyph (Instagram, Facebook, LinkedIn, X), fill-only, inherits currentColor. */
export function SocialIcon(props: SocialIconProps): JSX.Element | null;

/** Raw SVG inner-path strings keyed by social name (24×24 grid). */
export const SOCIAL_ICONS: Record<SocialName, string>;
/** Human-readable labels keyed by social name. */
export const SOCIAL_LABELS: Record<SocialName, string>;

export default SocialIcon;
