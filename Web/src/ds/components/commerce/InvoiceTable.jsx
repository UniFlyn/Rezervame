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
 * Invoice / transactions table. rows: [{ id, date, business, amount, status }].
 * Renders status badges and download/history row actions.
 */
export function InvoiceTable({
  rows = [], currency = '$',
  columns = ['Factura', 'Fecha', 'Negocio', 'Importe', 'Estado', 'Acciones'],
  onDownload, onHistory, style,
}) {
  const th = { padding: '16px 20px', fontSize: 12, fontWeight: 700, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase', color: 'var(--rz-navy)', textAlign: 'left' };
  const td = { padding: '18px 20px', fontSize: 14, color: 'var(--rz-gray-700)', verticalAlign: 'middle' };

  return (
    <div style={{
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', background: 'var(--surface-card)', boxShadow: 'var(--shadow-card)', ...style,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--rz-gray-100)' }}>
            {columns.map((c, i) => (
              <th key={c} style={{ ...th, textAlign: i >= 3 && i <= 4 ? 'center' : i === 5 ? 'right' : 'left' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const st = STATUS[r.status] || STATUS.pending;
            return (
              <tr key={r.id} style={{ borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                <td style={{ ...td, fontWeight: 700, color: 'var(--rz-navy)' }}>{r.id}</td>
                <td style={{ ...td, color: 'var(--rz-gray-500)' }}>{r.date}</td>
                <td style={{ ...td, fontWeight: 700, color: 'var(--rz-navy)' }}>{r.business}</td>
                <td style={{ ...td, fontWeight: 700, color: 'var(--rz-coral)', textAlign: 'center' }}>{currency}{r.amount}</td>
                <td style={{ ...td, textAlign: 'center' }}><Badge tone={st.tone} size="sm">{st.label}</Badge></td>
                <td style={{ ...td }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <IconButton icon="clock" variant="soft" size="sm" onClick={() => onHistory && onHistory(r)} label="Historial" />
                    <IconButton icon="download" variant="soft" size="sm" onClick={() => onDownload && onDownload(r)} label="Descargar" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export default InvoiceTable;
