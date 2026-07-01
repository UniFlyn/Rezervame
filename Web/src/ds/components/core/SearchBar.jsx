import React from 'react';
import { Glyph } from './Glyph.jsx';
import { Button } from './Button.jsx';

/**
 * The signature Rezervame search bar: a white rounded-rectangle with two
 * fields (service / location) split by a divider, and a coral "Buscar" button.
 */
export function SearchBar({
  servicePlaceholder = 'Servicio o nombre del negocio',
  locationPlaceholder = 'Ubicación',
  buttonLabel = 'Buscar',
  onSearch,
  defaultService = '',
  defaultLocation = '',
  compact = false,
  style,
}) {
  const [service, setService] = React.useState(defaultService);
  const [location, setLocation] = React.useState(defaultLocation);
  // keep in sync when an external default changes (e.g. results page query)
  React.useEffect(() => { setService(defaultService); }, [defaultService]);
  React.useEffect(() => { setLocation(defaultLocation); }, [defaultLocation]);

  const submit = () => { onSearch && onSearch({ service: service.trim(), location: location.trim() }); };

  const field = (icon, placeholder, value, setValue, grow = 1) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      flex: grow, minWidth: 0, padding: compact ? '0 16px' : '0 22px',
    }}>
      <Glyph name={icon} size={18} style={{ color: 'var(--rz-gray-400)' }} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{
          flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--rz-gray-900)',
        }}
      />
    </div>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: compact ? 54 : 64,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: compact ? 'var(--radius-md)' : 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: compact ? 5 : 6,
      paddingLeft: compact ? 6 : 8,
      ...style,
    }}>
      {field('search', servicePlaceholder, service, setService, 1.7)}
      <div style={{ width: 1, height: '56%', background: 'var(--border-subtle)' }} />
      {field('mapPin', locationPlaceholder, location, setLocation, 1)}
      <Button
        variant="primary"
        shape="rounded"
        size={compact ? 'sm' : 'md'}
        onClick={submit}
        style={{ flex: 'none' }}
      >{buttonLabel}</Button>
    </div>
  );
}
export default SearchBar;
