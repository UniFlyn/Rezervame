import React from 'react';

/**
 * TruncatedReveal — show text truncated to one line with an ellipsis, then
 * gently expand it IN PLACE (up to `expandLines`, default 2) on hover / focus /
 * tap, retracting when the pointer leaves. No tooltip, bubble or floating
 * label — the full value is revealed inside the same container, so it never
 * overlaps neighbouring UI; it simply reflows the content below it.
 *
 * Reusable DS pattern for compact labels whose full value should be readable
 * on demand (map cards, list rows, dense tables).
 *
 * Implementation notes:
 *  - `display` stays `block` in BOTH states; only `white-space` (nowrap↔normal)
 *    and a pixel `max-height` change, so the transition runs and it works even
 *    when the editor wraps the text in an inner inline <span>.
 *  - The full wrapped height is measured on a DETACHED hidden clone (matching
 *    the live content-box width + font), never by mutating the live element —
 *    so a ResizeObserver firing mid-animation can't capture a transient height.
 */
export function TruncatedReveal({
  children,
  text,
  lines = 1,           // collapsed line count (1 = single-line ellipsis)
  expandLines = 2,     // max lines when expanded, then clip
  as = 'span',
  lineHeight = 1.3,
  style,
  className,
  onClick,
}) {
  const childText = Array.isArray(children)
    ? children.filter((c) => typeof c === 'string' || typeof c === 'number').join('')
    : (typeof children === 'string' || typeof children === 'number' ? String(children) : '');
  const ref = React.useRef(null);
  const [domText, setDomText] = React.useState('');
  const full = text != null ? text : (childText || domText);
  const [truncated, setTruncated] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [metrics, setMetrics] = React.useState(null); // { lhPx, fullH }

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const t = full || el.textContent || '';
    if (text == null && !childText && el.textContent) setDomText(el.textContent);

    const cs = window.getComputedStyle(el);
    let lh = parseFloat(cs.lineHeight);
    if (!lh || Number.isNaN(lh)) lh = parseFloat(cs.fontSize) * lineHeight;
    const contentW = el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    if (!contentW || contentW <= 0) return;

    // Detached clone — measures the true wrapped height without touching the
    // live element, so it is immune to the in-flight max-height transition.
    const clone = document.createElement('div');
    clone.textContent = t;
    Object.assign(clone.style, {
      position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden',
      pointerEvents: 'none', boxSizing: 'content-box', width: `${contentW}px`,
      margin: '0', padding: '0', maxHeight: 'none', overflow: 'visible',
      whiteSpace: 'normal',
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight,
      wordBreak: cs.wordBreak, textTransform: cs.textTransform,
    });
    document.body.appendChild(clone);
    const fullH = clone.scrollHeight;
    document.body.removeChild(clone);

    setMetrics((prev) => (prev && prev.lhPx === lh && prev.fullH === fullH) ? prev : { lhPx: lh, fullH });
    const isTrunc = fullH > lh * lines + 1;
    setTruncated((prev) => prev === isTrunc ? prev : isTrunc);
  }, [text, childText, lineHeight, lines, full]);

  React.useLayoutEffect(() => { measure(); }, [measure]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const open = () => { if (truncated) setExpanded(true); };
  const close = () => setExpanded(false);

  const lhPx = metrics && metrics.lhPx;
  const collapsedH = lhPx ? Math.ceil(lhPx * lines) + 2 : null;
  const expandedH = lhPx ? Math.ceil(Math.min(metrics.fullH, lhPx * expandLines)) + 2 : null;
  const maxHeight = expanded
    ? (expandedH != null ? `${expandedH}px` : `${expandLines * lineHeight + 0.2}em`)
    : (collapsedH != null ? `${collapsedH}px` : `${lines * lineHeight + 0.2}em`);

  const Tag = as;

  return (
    <Tag
      ref={ref}
      className={className}
      tabIndex={truncated ? 0 : undefined}
      aria-label={truncated ? full : undefined}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      onClick={(e) => {
        if (truncated) { e.stopPropagation(); setExpanded((v) => !v); }
        onClick && onClick(e);
      }}
      style={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: expanded ? 'normal' : 'nowrap',
        lineHeight,
        maxHeight,
        transition: 'max-height var(--dur-base) var(--ease-out)',
        ...style,
      }}
    >
      {children != null ? children : full}
    </Tag>
  );
}
export default TruncatedReveal;
