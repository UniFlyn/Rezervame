import * as React from 'react';
export type InvoiceStatus = 'paid' | 'pending' | 'cancelled' | 'refunded';
export interface InvoiceRow {
  id: string;
  date: string;
  business: string;
  amount: number | string;
  status: InvoiceStatus;
}
export interface InvoiceTableProps {
  rows: InvoiceRow[];
  currency?: string;
  columns?: string[];
  onDownload?: (row: InvoiceRow) => void;
  onHistory?: (row: InvoiceRow) => void;
  style?: React.CSSProperties;
}
/**
 * Invoice / transactions table with status badges + row actions.
 * @startingPoint section="Commerce" subtitle="Invoices table with status badges" viewport="900x360"
 */
export declare const InvoiceTable: React.FC<InvoiceTableProps>;
export default InvoiceTable;
