import * as React from 'react';
export interface SelectOption { label: string; value: string; }
export interface SelectProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: (SelectOption | string)[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}
/** Dropdown select with coral focus + active option highlight. */
export declare const Select: React.FC<SelectProps>;
export default Select;
