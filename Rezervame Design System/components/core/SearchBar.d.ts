import * as React from 'react';
export interface SearchBarProps {
  servicePlaceholder?: string;
  locationPlaceholder?: string;
  buttonLabel?: string;
  onSearch?: () => void;
  /** Smaller height for headers. */
  compact?: boolean;
  style?: React.CSSProperties;
}
/**
 * The signature dual-field search pill (service + location + Buscar).
 * @startingPoint section="Core" subtitle="Dual-field search pill" viewport="700x150"
 */
export declare const SearchBar: React.FC<SearchBarProps>;
export default SearchBar;
