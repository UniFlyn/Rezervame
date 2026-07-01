import * as React from 'react';
export interface TabItem { label: string; value: string; }
export interface TabsProps {
  /** Array of {label, value} or plain strings. */
  items: (TabItem | string)[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
/** Segmented pill tabs with a white active pill (venue page sections). */
export declare const Tabs: React.FC<TabsProps>;
export default Tabs;
