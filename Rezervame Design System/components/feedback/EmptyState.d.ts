import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface EmptyStateProps {
  icon?: GlyphName;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}
/** Empty state with soft icon circle, title, message and optional CTA. */
export declare const EmptyState: React.FC<EmptyStateProps>;
export default EmptyState;
