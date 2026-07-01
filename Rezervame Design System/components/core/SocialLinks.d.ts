import * as React from 'react';
import { SocialName } from './SocialIcon';
import { SocialButtonVariant, SocialButtonSize } from './SocialIconButton';

export interface SocialLinkItem {
  name: SocialName;
  href?: string;
  label?: string;
}

export interface SocialLinksProps {
  /** Names, or {name, href, label} objects. Default all four brands. */
  items?: Array<SocialName | SocialLinkItem>;
  /** Color treatment applied to every button. Default 'footer'. */
  variant?: SocialButtonVariant;
  /** Button diameter in px. Default 40. */
  size?: SocialButtonSize;
  /** Gap between buttons in px. Default 10. */
  gap?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** A row of SocialIconButtons. */
export function SocialLinks(props: SocialLinksProps): JSX.Element;

export default SocialLinks;
