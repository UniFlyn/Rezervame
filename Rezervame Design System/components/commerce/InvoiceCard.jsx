import React from 'react';
import { Badge } from '../core/Badge.jsx';
import { IconButton } from '../core/IconButton.jsx';

const STATUS = {
  paid: { tone: 'success', label: 'Pagada' },
  pending: { tone: 'warning', label: 'Pendiente' },
  cancelled: { tone: 'error', label: 'Cancelada' },
  refunded: { tone: 'info', label: 'Reembolsada' },
};

/**
 * Mobile invoice card — the stacked counterpart to InvoiceTable's row.
 * Invoice code stays on one line. Shows code, date, business, amount, status
 * and download/history actions. Use below the table's breakpoint.
 */
export function InvoiceCard({ invoice, currency = '$', onDownload, onHistory, style }) {
  const r = invoice || {};
  const st = STATUS[r.status] || STATUS.pending;
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 16, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rz-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.id}</span>
        <Badge tone={st.tone} size="sm">{st.label}</Badge>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.business}</div>
          <div style={{ fontSize: 13, color: 'var(--rz-gray-500)', marginTop: 2 }}>{r.date}</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--rz-coral)', flex: 'none' }}>{currency}{r.amount}</div>
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0 12px' }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <IconButton icon="clock" variant="soft" size="sm" onClick={() => onHistory && onHistory(r)} label="Historial" />
        <IconButton icon="download" variant="soft" size="sm" onClick={() => onDownload && onDownload(r)} label="Descargar" />
      </div>
    </div>
  );
}
export default InvoiceCard;
