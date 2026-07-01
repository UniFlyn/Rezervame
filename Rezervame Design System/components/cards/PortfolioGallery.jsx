import React from 'react';
import { Chip } from '../core/Chip.jsx';
import { PortfolioTile } from './PortfolioTile.jsx';

/**
 * Masonry portfolio gallery — composes PortfolioTile items in CSS columns,
 * with optional filter chips. images: string[] or { src, alt }[].
 */
export function PortfolioGallery({ images = [], filters = [], activeFilter, onFilter, columns = 4, gap = 12, onOpen, style }) {
  return (
    <div style={style}>
      {filters.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {filters.map((f) => (
            <Chip key={f} active={f === activeFilter} onClick={() => onFilter && onFilter(f)}>{f}</Chip>
          ))}
        </div>
      )}
      <div style={{ columnCount: columns, columnGap: gap }}>
        {images.map((img, i) => {
          const src = typeof img === 'string' ? img : img.src;
          const alt = (img && img.alt) || '';
          // Key by a stable identity (id/src), NOT the positional index, so that
          // when the filter changes React doesn't reuse a tile's DOM node for a
          // different image — which is what lets a click land on the wrong image.
          const key = (img && img.id) || src || i;
          return (
            <PortfolioTile
              key={key}
              src={src}
              alt={alt}
              onClick={onOpen ? () => onOpen(img, i) : undefined}
              style={{ breakInside: 'avoid', marginBottom: gap }}
            />
          );
        })}
      </div>
    </div>
  );
}
export default PortfolioGallery;
