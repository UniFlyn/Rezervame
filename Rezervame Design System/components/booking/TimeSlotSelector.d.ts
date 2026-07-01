import * as React from 'react';
export interface TimeSlot { time: string; disabled?: boolean; }
export interface TimeSlotGroup { label: string; slots: (TimeSlot | string)[]; }
export interface TimeSlotSelectorProps {
  slots?: (TimeSlot | string)[];
  groups?: TimeSlotGroup[];
  value?: string;
  onChange?: (time: string) => void;
  columns?: number;
  style?: React.CSSProperties;
}
/** Grid of time-slot pills (optionally grouped by period). */
export declare const TimeSlotSelector: React.FC<TimeSlotSelectorProps>;
export default TimeSlotSelector;
