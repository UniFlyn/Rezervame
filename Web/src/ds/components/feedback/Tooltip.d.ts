import * as React from 'react';
export interface TooltipProps {
  label: string;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  style?: React.CSSProperties;
}
/** Hover tooltip with a dark navy bubble. */
export declare const Tooltip: React.FC<TooltipProps>;
export default Tooltip;
