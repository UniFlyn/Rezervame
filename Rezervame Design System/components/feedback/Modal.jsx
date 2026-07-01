import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/**
 * Centered modal dialog with scrim, rounded shell and close button.
 * Pass children for body content.
 */
export function Modal({ open = true, onClose, width = 520, showClose = true, children, style }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--overlay-scrim)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        animation: 'rz-fade 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: width,
          background: 'var(--surface-card)', borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-modal)', maxHeight: '90vh', overflowY: 'auto',
          animation: 'rz-pop 0.24s var(--ease-out)', ...style,
        }}
      >
        {showClose && (
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
            <IconButton icon="close" variant="soft" round size="sm" onClick={onClose} label="Cerrar" />
          </div>
        )}
        {children}
      </div>
      <style>{`@keyframes rz-fade{from{opacity:0}to{opacity:1}}@keyframes rz-pop{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
export default Modal;
