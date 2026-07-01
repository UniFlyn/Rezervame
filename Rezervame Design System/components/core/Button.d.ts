import * as React from 'react';
import { GlyphName } from './Glyph';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. */
  variant?: 'primary' | 'dark' | 'outline' | 'soft' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** pill = fully rounded (hero CTAs); rounded = 12px (in-content). */
  shape?: 'pill' | 'rounded';
  fullWidth?: boolean;
  /** Uppercase + tracked label (e.g. REZERVAME, VER DISPONIBILIDAD). */
  uppercase?: boolean;
  /** Glyph name or a ReactNode rendered before the label. */
  leftIcon?: GlyphName | React.ReactNode;
  rightIcon?: GlyphName | React.ReactNode;
  loading?: boolean;
}
/**
 * Primary action element. `primary` (coral) for the main CTA, `dark` (navy) for
 * secondary emphasis, `outline` for repeated in-card booking actions (REZERVAME,
 * VER DISPONIBILIDAD). `soft` (coral tint) is for chips/filters/badges & low-
 * emphasis secondary actions only (e.g. "Promociones") — never a main booking CTA.
 *
 * Interaction: booking CTAs (`primary` + `outline`) fill solid brand red
 * (#FF5757) with white text on hover, and a darker red (#D83B3B) when pressed.
 * `outline` is white/coral-border at rest. Disabled = neutral fill, not-allowed.
 *
 * @startingPoint section="Core" subtitle="Buttons — coral, navy, outline, soft" viewport="700x150"
 */
export declare const Button: React.FC<ButtonProps>;
export default Button;
