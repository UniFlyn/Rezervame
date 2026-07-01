import React from 'react';
import { Glyph } from '../core/Glyph.jsx';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_MIN = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };

/**
 * Day-strip date selector.
 *
 * Two modes:
 *  • Legacy/static — pass `days` [{date, weekday, day, disabled}] (+ optional
 *    `monthLabel`). Renders a fixed strip; arrows are inert.
 *  • Dynamic calendar — omit `days`. Renders `count` real dates starting from
 *    today (or `minDate`), with working ‹ › paging, a live month/year title,
 *    past/closed days disabled, and controlled `value`/`onChange` (ISO 'YYYY-MM-DD').
 *    Pass `isDateDisabled(Date) => boolean` to close specific days. A calendar
 *    button in the header opens a full-month popover that selects any open date.
 */
export function DateSelector({ days, count = 7, start, value, onChange, monthLabel, minDate, isDateDisabled, style }) {
  // ---- Legacy static mode ----
  if (days) {
    return (
      <div style={style}>
        <Head label={monthLabel || ''} />
        <Strip>
          {days.map((d) => (
            <DayPill key={d.date} weekday={d.weekday} day={d.day} active={d.date === value}
              disabled={d.disabled} onClick={() => onChange && onChange(d.date)} />
          ))}
        </Strip>
      </div>
    );
  }

  // ---- Dynamic calendar mode ----
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const floor = minDate ? startOfDay(typeof minDate === 'string' ? parseISO(minDate) : minDate) : today;
  const selected = value ? startOfDay(parseISO(value)) : null;

  const [winStart, setWinStart] = React.useState(() => startOfDay(selected && selected > floor ? selected : floor));
  const [calOpen, setCalOpen] = React.useState(false);

  // If the parent moves the selection outside the current window, follow it.
  React.useEffect(() => {
    if (!selected) return;
    const inWindow = selected >= winStart && selected < addDays(winStart, count);
    if (!inWindow) setWinStart(startOfDay(selected < floor ? floor : selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const visible = Array.from({ length: count }, (_, i) => addDays(winStart, i));
  const firstM = visible[0], lastM = visible[count - 1];
  const spans = firstM.getMonth() !== lastM.getMonth();
  const label = monthLabel || (spans
    ? `${MONTHS[firstM.getMonth()].slice(0, 3)} – ${MONTHS[lastM.getMonth()].slice(0, 3)} ${lastM.getFullYear()}`
    : `${MONTHS[firstM.getMonth()]} ${firstM.getFullYear()}`);

  const canPrev = addDays(winStart, -1) >= floor; // at least one selectable day exists before the window
  const goPrev = () => { if (!canPrev) return; const ns = addDays(winStart, -count); setWinStart(startOfDay(ns < floor ? floor : ns)); };
  const goNext = () => setWinStart(addDays(winStart, count));

  const dayDisabled = (d) => d < floor || (isDateDisabled ? isDateDisabled(d) : false);

  // Picking a date from the full-month popover: align the strip window to it,
  // hand the ISO value up (parent recalculates time slots + availability), close.
  const pickFromCalendar = (d) => {
    const iso = toISO(d);
    setWinStart(startOfDay(d < floor ? floor : d));
    setCalOpen(false);
    if (onChange) onChange(iso);
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <Head label={label} onPrev={goPrev} onNext={goNext} prevDisabled={!canPrev}
        calOpen={calOpen} onToggleCal={() => setCalOpen((o) => !o)} />
      <Strip>
        {visible.map((d) => {
          const iso = toISO(d);
          return (
            <DayPill key={iso} weekday={DAYS[d.getDay()]} day={d.getDate()}
              active={!!selected && toISO(selected) === iso} disabled={dayDisabled(d)}
              onClick={() => onChange && onChange(iso)} />
          );
        })}
      </Strip>

      {calOpen && (
        <MonthPopover
          anchor={selected || winStart} floor={floor} selected={selected}
          isDateDisabled={isDateDisabled} onPick={pickFromCalendar} onClose={() => setCalOpen(false)}
        />
      )}
    </div>
  );
}

function Head({ label, onPrev, onNext, prevDisabled, calOpen, onToggleCal }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--rz-navy)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onPrev} disabled={prevDisabled} aria-label="Rango anterior" style={navBtn(prevDisabled)}><Glyph name="chevronLeft" size={16} /></button>
        <button onClick={onNext} aria-label="Rango siguiente" style={navBtn(false)}><Glyph name="chevronRight" size={16} /></button>
        {onToggleCal && (
          <button onClick={onToggleCal} aria-label="Abrir calendario del mes" aria-expanded={calOpen} style={calToggleBtn(calOpen)}>
            <Glyph name="calendar" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function Strip({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'safe center', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {children}
    </div>
  );
}

function DayPill({ weekday, day, active, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        flex: '1 1 0', minWidth: 52, maxWidth: 78, padding: '21px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'var(--rz-coral)' : 'var(--surface-card)',
        color: active ? '#fff' : 'var(--rz-gray-700)',
        border: `1.5px solid ${active ? 'var(--rz-coral)' : 'var(--border-default)'}`,
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'var(--font-sans)',
        transition: 'border-color var(--dur-base), background var(--dur-base), transform var(--dur-base)',
      }}
      onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.borderColor = 'var(--rz-coral)'; }}
      onMouseLeave={(e) => { if (!disabled && !active) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.85 }}>{weekday}</span>
      <span style={{ fontSize: 21, fontWeight: 700, lineHeight: 1 }}>{day}</span>
    </button>
  );
}

/* Full-month calendar — floating popover on desktop, centered sheet on narrow
   screens. Past/closed days are disabled; the selected day keeps the coral state. */
function MonthPopover({ anchor, floor, selected, isDateDisabled, onPick, onClose }) {
  const [view, setView] = React.useState(() => startOfMonth(anchor || floor));
  const [narrow, setNarrow] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 480 : false);
  React.useEffect(() => {
    const o = () => setNarrow(window.innerWidth < 480);
    window.addEventListener('resize', o, { passive: true });
    return () => window.removeEventListener('resize', o);
  }, []);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const y = view.getFullYear(), m = view.getMonth();
  const firstWeekday = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const floorMonth = startOfMonth(floor);
  const canPrev = view > floorMonth;
  const dayDisabled = (d) => d < floor || (isDateDisabled ? isDateDisabled(d) : false);

  const card = (
    <div
      onClick={(e) => e.stopPropagation()}
      role="dialog" aria-modal="true" aria-label="Selecciona una fecha"
      style={{
        width: narrow ? 'min(340px, 92vw)' : 312,
        background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-modal)',
        padding: 16, fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => canPrev && setView(addMonths(view, -1))} disabled={!canPrev} aria-label="Mes anterior" style={navBtn(!canPrev)}><Glyph name="chevronLeft" size={16} /></button>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--rz-navy)' }}>{MONTHS[m]} {y}</span>
        <button onClick={() => setView(addMonths(view, 1))} aria-label="Mes siguiente" style={navBtn(false)}><Glyph name="chevronRight" size={16} /></button>
      </div>

      {/* Weekday labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS_MIN.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--rz-gray-400)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const iso = toISO(d);
          const active = selected && toISO(selected) === iso;
          const disabled = dayDisabled(d);
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={disabled ? undefined : () => onPick(d)}
              aria-label={iso}
              aria-pressed={!!active}
              style={{
                aspectRatio: '1 / 1', width: '100%', border: 'none',
                borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: active ? 700 : 500,
                background: active ? 'var(--rz-coral)' : 'transparent',
                color: active ? '#fff' : disabled ? 'var(--rz-gray-300)' : 'var(--rz-gray-700)',
                opacity: disabled ? 0.55 : 1,
                textDecoration: disabled && !active ? 'line-through' : 'none',
                transition: 'background var(--dur-base), color var(--dur-base)',
              }}
              onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = 'var(--rz-coral-050)'; }}
              onMouseLeave={(e) => { if (!disabled && !active) e.currentTarget.style.background = 'transparent'; }}
            >{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );

  // Narrow: centered modal sheet. Wide: popover anchored under the header (right-aligned).
  return (
    <div
      onClick={onClose}
      style={narrow ? {
        position: 'fixed', inset: 0, zIndex: 130, background: 'var(--overlay-scrim, rgba(15,23,42,0.4))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      } : {
        position: 'absolute', top: 44, right: 0, zIndex: 130,
      }}
    >
      {card}
    </div>
  );
}

const navBtn = (disabled) => ({
  width: 32, height: 32, borderRadius: 'var(--radius-sm)',
  background: disabled ? 'var(--rz-gray-050)' : 'var(--rz-gray-100)', border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: disabled ? 'var(--rz-gray-300)' : 'var(--rz-navy)',
  opacity: disabled ? 0.6 : 1, transition: 'all var(--dur-base)',
});

const calToggleBtn = (active) => ({
  width: 34, height: 32, borderRadius: 'var(--radius-sm)',
  background: active ? 'var(--rz-coral-050)' : 'var(--surface-card)',
  border: `1.5px solid ${active ? 'var(--rz-coral)' : 'var(--border-default)'}`,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: active ? 'var(--rz-coral)' : 'var(--rz-navy)', transition: 'all var(--dur-base)',
});

export default DateSelector;
