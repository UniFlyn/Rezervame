import React from 'react';

/**
 * Portfolio tile / masonry image item.
 * Image-first, minimal (no text). Rounded corners, supports any aspect ratio
 * for masonry composition. Optional hover: soft zoom + shadow. Click to open a
 * lightbox/gallery. Keep it simple and image-focused.
 */
export function PortfolioTile({ src, alt = '', aspect, rounded = 'var(--radius-md)', onClick, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        borderRadius: rounded,
        overflow: 'hidden',
        background: 'var(--rz-gray-100)',
        cursor: onClick ? 'pointer' : 'default',
        aspectRatio: aspect || undefined,
        boxShadow: hover ? 'var(--shadow-md)' : 'none',
        transition: 'box-shadow var(--dur-base) var(--ease-standard)',
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%', height: aspect ? '100%' : 'auto', objectFit: 'cover', display: 'block',
          transform: hover ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform var(--dur-slow) var(--ease-out)',
        }}
      />
    </div>
  );
}
export default PortfolioTile;
