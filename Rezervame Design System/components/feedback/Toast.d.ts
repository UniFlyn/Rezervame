import * as React from 'react';
import { GlyphName } from '../core/Glyph';
export interface ToastProps {
  tone?: 'success' | 'error' | 'warning' | 'info' | 'coral';
  title?: string;
  message?: string;
  icon?: GlyphName;
  onClose?: () => void;
  style?: React.CSSProperties;
}
/** Toast / notification snackbar with tone-coloured icon. */
export declare const Toast: React.FC<ToastProps>;
export default Toast;
