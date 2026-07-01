import * as React from 'react';
import { SocialName } from './SocialIcon';

export type SocialButtonVariant = 'footer' | 'neutral' | 'coral' | 'dark';
export type SocialButtonSize = 32 | 40 | 48;

export interface SocialIconButtonProps {
  /** Which brand mark to render. */
  name: SocialName;
  /** Optional link target — renders an <a> (new tab) instead of a <button>. */
  href?: string;
  /** Color treatment. Default 'footer'. */
  variant?: SocialButtonVariant;
  /** Button diameter in px. Default 40. */
  size?: SocialButtonSize;
  disabled?: boolean;
  /** Accessible label (defaults to the brand name). */
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/** Circular brand button wrapping a SocialIcon, with hover/pressed/disabled states. */
export function SocialIconButton(props: SocialIconButtonProps): JSX.Element;

export default SocialIconButton;
