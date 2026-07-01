import * as React from 'react';
export interface InvoiceRecord {
  id: string;
  date: string;
  business: string;
  amount: number | string;
  status: 'paid' | 'pending' | 'cancelled' | 'refunded';
}
export interface InvoiceCardProps {
  invoice: InvoiceRecord;
  currency?: string;
  onDownload?: (r: InvoiceRecord) => void;
  onHistory?: (r: InvoiceRecord) => void;
  style?: React.CSSProperties;
}
/**
 * Mobile invoice card — stacked counterpart to InvoiceTable's row (code on one
 * line, business, amount, status chip, download/history actions).
 * @startingPoint section="Commerce" subtitle="Mobile invoice card" viewport="360x200"
 */
export declare const InvoiceCard: React.FC<InvoiceCardProps>;
export default InvoiceCard;
