import * as React from 'react';
import { GlyphName } from './Glyph';
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: GlyphName | React.ReactNode;
  trailing?: GlyphName | React.ReactNode;
  error?: string;
  helper?: string;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: React.CSSProperties;
}
/** Labelled text input with coral focus ring and optional icons / error state. */
export declare const Input: React.FC<InputProps>;
export default Input;
