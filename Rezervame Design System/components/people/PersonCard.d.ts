import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface PersonCardProps {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  note?: string;
  /** Render a glyph avatar instead of initials (e.g. "user" for "Para mí"). */
  icon?: GlyphName;
  variant?: 'manage' | 'select';
  /** select variant — coral ring + check. */
  selected?: boolean;
  /** Override the secondary line (select variant). */
  subtitle?: React.ReactNode;
  onSelect?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  style?: React.CSSProperties;
}
/** A saved person you can book for — manageable row or selectable option. */
export declare const PersonCard: React.FC<PersonCardProps>;
export default PersonCard;
