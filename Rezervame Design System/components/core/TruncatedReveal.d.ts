import * as React from 'react';
export interface TruncatedRevealProps {
  /** Content to render (usually a string). */
  children?: React.ReactNode;
  /** Full text used for measuring + aria-label. Defaults to `children` when it is a string. */
  text?: string;
  /** Collapsed line count. 1 = single-line ellipsis. */
  lines?: number;
  /** Max lines when expanded on hover/focus, then ellipsis again. */
  expandLines?: number;
  /** Element/tag to render as (e.g. 'h5', 'span', 'p'). */
  as?: keyof JSX.IntrinsicElements;
  /** Unitless line-height (drives the expand/collapse height math). */
  lineHeight?: number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}
/**
 * Truncated text that expands IN PLACE on hover / focus / tap (no tooltip),
 * revealing the full value up to `expandLines`, then retracts on leave.
 * @startingPoint section="Components" subtitle="Truncated text → in-place hover expand" viewport="320x140"
 */
export declare const TruncatedReveal: React.FC<TruncatedRevealProps>;
export default TruncatedReveal;
