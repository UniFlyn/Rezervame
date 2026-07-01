import * as React from 'react';
export interface RadioProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
/** Radio button with coral selected state. */
export declare const Radio: React.FC<RadioProps>;
export default Radio;
