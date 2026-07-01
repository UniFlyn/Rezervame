import React from 'react';

/** Avatar — circular user/business image with optional ring and status dot. */
export function Avatar({ src, alt = '', name = '', size = 44, ring = false, status, style }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '';
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: 'none' }}>
      <span style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--rz-navy-100)', color: 'var(--rz-navy)',
        fontWeight: 700, fontSize: size * 0.38,
        border: ring ? '2px solid var(--rz-coral)' : '1px solid var(--border-subtle)',
        boxShadow: ring ? '0 0 0 2px #fff' : 'none',
        ...style,
      }}>
        {src ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </span>
      {status && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: status === 'online' ? 'var(--rz-success)' : 'var(--rz-gray-400)',
          border: '2px solid #fff',
        }} />
      )}
    </span>
  );
}
export default Avatar;
