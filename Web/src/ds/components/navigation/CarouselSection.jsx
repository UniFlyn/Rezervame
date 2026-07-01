import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

/**
 * Home/discovery section row — Fresha-style.
 *
 * align="left" (default): section title on the LEFT, optional "Ver todos →"
 *   link on the far RIGHT (top-right of the section).
 * align="center": title + subtitle CENTERED (category section header). No link.
 *
 * In both modes the prev/next arrows are CIRCULAR and sit at the SIDES of the
 * card row, vertically centered — integrated with the carousel, never in the
 * header. They appear only when the row overflows. The PAGE scrolls vertically;
 * the row scrolls horizontally (swipe on touch).
 */
export function CarouselSection({
  title,
  subtitle,
  align = 'left',
  linkLabel = 'Ver todos los negocios',
  onLink,
  cardWidth = 282,
  gap = 18,
  arrows = true,
  children,
  style,
}) {
  const scroller = React.useRef(null);
  const [canL, setCanL] = React.useState(false);
  const [canR, setCanR] = React.useState(false);

  const update = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const t = setTimeout(update, 300); // after images settle
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); clearTimeout(t); };
  }, [update]);

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (cardWidth + gap) * 2, behavior: 'smooth' });
  };

  // Drag-to-scroll (mouse) so the row is scrollable even without visible arrow
  // controls. Vertical wheel/touchpad scroll is left untouched so the page can
  // still scroll while the cursor is over the row; horizontal swipe is native.
  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = false;

    const onDown = (e) => {
      if (e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX; startLeft = el.scrollLeft;
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; el.style.cursor = 'grabbing'; }
      el.scrollLeft = startLeft - dx;
    };
    const end = () => { down = false; el.style.cursor = ''; };
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', end);
    el.addEventListener('click', onClick, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', end);
      el.removeEventListener('click', onClick, true);
    };
  }, []);

  // Circular arrow that floats at the side of the row, vertically centered.
  const SideArrow = ({ dir, show }) => (
    <button
      aria-label={dir < 0 ? 'Anterior' : 'Siguiente'}
      onClick={() => scrollBy(dir)}
      style={{
        position: 'absolute', top: '50%', [dir < 0 ? 'left' : 'right']: -18,
        transform: 'translateY(-50%)',
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--surface-card)', border: '1px solid var(--border-default)',
        boxShadow: '0 4px 14px rgba(2,48,71,0.12)', cursor: 'pointer', zIndex: 3,
        display: show ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
        color: 'var(--rz-navy)',
        transition: 'background var(--dur-base), color var(--dur-base), border-color var(--dur-base), transform var(--dur-fast)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rz-coral)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--rz-coral)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.color = 'var(--rz-navy)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(0.92)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
    >
      <Glyph name={dir < 0 ? 'chevronLeft' : 'chevronRight'} size={21} />
    </button>
  );

  const items = React.Children.toArray(children);
  const centered = align === 'center';

  return (
    <section style={style}>
      {/* Header */}
      {centered ? (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 30, lineHeight: 1.15 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 15, color: 'var(--rz-gray-500)', marginTop: 8 }}>{subtitle}</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            {subtitle && <div className="rz-eyebrow" style={{ marginBottom: 6 }}>{subtitle}</div>}
            <h2 style={{ fontSize: 26, lineHeight: 1.15 }}>{title}</h2>
          </div>
          {onLink && (
            <button
              onClick={onLink}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none',
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--rz-coral)', padding: '4px 0',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rz-coral-700)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rz-coral)'; }}
            >{linkLabel} <Glyph name="arrowRight" size={16} /></button>
          )}
        </div>
      )}

      {/* Row with side arrows */}
      <div style={{ position: 'relative' }}>
        {arrows && <SideArrow dir={-1} show={canL} />}
        {arrows && <SideArrow dir={1} show={canR} />}
        <div
          ref={scroller}
          className="rz-noscrollbar"
          style={{
            display: 'flex', gap, overflowX: 'auto', scrollSnapType: 'x mandatory',
            padding: '6px 2px 8px', margin: '-6px -2px -8px',
            scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
        >
          {items.map((child, i) => (
            <div key={i} style={{ flex: 'none', width: cardWidth, scrollSnapAlign: 'start' }}>{child}</div>
          ))}
        </div>
        <style>{`.rz-noscrollbar::-webkit-scrollbar{display:none}`}</style>
      </div>
    </section>
  );
}
export default CarouselSection;
