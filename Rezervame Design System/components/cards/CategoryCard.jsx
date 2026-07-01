import React from 'react';

/**
 * Category / service-discovery tile (Home page).
 * Image-led, compact, near-square. Dark bottom gradient for legibility,
 * ONLY the category title overlaid — no description, count or caption.
 * Works in horizontal carousels and grids. Rounded, premium.
 */
export function CategoryCard({ image, title, aspect = '4 / 3', onClick, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        aspectRatio: aspect,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: 'var(--rz-gray-100)',
        boxShadow: hover ? '0 10px 24px rgba(2,48,71,0.12)' : '0 1px 4px rgba(2,48,71,0.05)',
        transition: 'box-shadow var(--dur-base) var(--ease-standard)',
        ...style,
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform var(--dur-slow) var(--ease-out)',
          }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(2,18,28,0.78) 0%, rgba(2,18,28,0.32) 42%, rgba(2,18,28,0) 68%)',
      }} />
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 13,
        color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: 1.22,
        letterSpacing: '0.1px', textShadow: '0 1px 6px rgba(0,0,0,0.3)',
      }}>{title}</div>
    </div>
  );
}
export default CategoryCard;
