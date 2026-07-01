import * as React from 'react';
export interface BadgeProps {
  children: React.ReactNode;
  /** Status tone — success=PAGADA, warning=PENDIENTE, error=CANCELADA. */
  tone?: 'success' | 'warning' | 'error' | 'info' | 'coral' | 'navy' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  /** Leading dot in the current color. */
  dot?: boolean;
  uppercase?: boolean;
  style?: React.CSSProperties;
}
/** Pill status/label badge — reservation states, "Nuevo en la plataforma", counts. */
export declare const Badge: React.FC<BadgeProps>;
export default Badge;
