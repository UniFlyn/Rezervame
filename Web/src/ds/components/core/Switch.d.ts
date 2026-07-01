import * as React from 'react';
export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
/** Toggle switch — coral when on. */
export declare const Switch: React.FC<SwitchProps>;
export default Switch;
