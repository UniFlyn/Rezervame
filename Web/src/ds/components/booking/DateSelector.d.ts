import * as React from 'react';
export interface DateOption { date: string; weekday: string; day: number; disabled?: boolean; }
export interface DateSelectorProps {
  days?: DateOption[];
  count?: number;
  start?: Date | string;
  value?: string;
  onChange?: (date: string) => void;
  monthLabel?: string;
  style?: React.CSSProperties;
}
/**
 * Scrollable weekday + day pill date strip for booking.
 * @startingPoint section="Booking" subtitle="Day-strip date selector" viewport="700x150"
 */
export declare const DateSelector: React.FC<DateSelectorProps>;
export default DateSelector;
