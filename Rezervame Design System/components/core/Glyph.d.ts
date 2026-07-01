import * as React from 'react';
export type GlyphName =
  | "search" | "mapPin" | "navigation" | "clock" | "calendar" | "star" | "heart" | "bell"
  | "chevronRight" | "chevronDown" | "chevronLeft" | "check" | "checkCircle"
  | "phone" | "mail" | "share" | "plus" | "plusCircle" | "close" | "download"
  | "print" | "lock" | "user" | "users" | "send" | "grid" | "arrowRight" | "list"
  | "home" | "creditCard" | "shield" | "scissors" | "sparkles" | "filter"
  | "edit" | "settings";

export interface GlyphProps extends React.SVGProps<SVGSVGElement> {
  /** Icon name from the Rezervame UI glyph set. */
  name: GlyphName;
  /** Pixel size (width = height). Default 20. */
  size?: number | string;
  /** Use a filled style (star, heart). */
  filled?: boolean;
  /** Stroke width. Default 2 (Lucide native). */
  strokeWidth?: number;
}
/** Rezervame's UI icon set — authentic Lucide geometry (2px stroke, currentColor). Use for all UI iconography inside components. */
export declare const Glyph: React.FC<GlyphProps>;
export default Glyph;
