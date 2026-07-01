import * as React from 'react';
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
/** Checkbox with coral checked state. */
export declare const Checkbox: React.FC<CheckboxProps>;
export default Checkbox;
