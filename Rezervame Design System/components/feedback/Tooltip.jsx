import React from 'react';

/** Tooltip wrapper — shows a dark bubble on hover. direction: top/bottom/left/right. */
export function Tooltip({ label, direction = 'top', children, style }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  }[direction];

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute', zIndex: 60, ...pos,
          background: 'var(--rz-navy)', color: '#fff',
          fontSize: 12, fontWeight: 500, lineHeight: 1.3,
          padding: '7px 11px', borderRadius: 'var(--radius-sm)',
          whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', pointerEvents: 'none',
        }}>{label}</span>
      )}
    </span>
  );
}
export default Tooltip;
