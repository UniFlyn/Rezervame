import * as React from 'react';
import { GlyphName } from '../core/Glyph';

export interface MenuRenderArgs {
  open: boolean;
  toggle: () => void;
  close: () => void;
}
export interface MenuProps {
  /** Renders the clickable trigger; receives { open, toggle, close }. */
  trigger: (args: MenuRenderArgs) => React.ReactNode;
  /** Renders the popover body; receives { close }. */
  children: (args: { close: () => void }) => React.ReactNode;
  /** Popover width in px. Default 220. */
  width?: number;
  /** Horizontal anchor edge. Default 'right'. */
  align?: 'left' | 'right';
  style?: React.CSSProperties;
}
/** Anchored dropdown menu — closes on outside-click / Escape. */
export declare const Menu: React.FC<MenuProps>;

export interface MenuItemProps {
  icon?: GlyphName;
  /** Override the leading icon colour. Defaults to coral (or red when danger). */
  iconColor?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  /** Red label + soft-coral hover (destructive / logout rows). */
  danger?: boolean;
  /** Draw a top separator and extra top padding (section break). */
  divider?: boolean;
  /** Trailing count pill. */
  badge?: number | string;
  /** 'sm' = compact action menu (default); 'md' = taller navigation menu. */
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
/** A single row inside a Menu: leading icon + label, ghost hover. */
export declare const MenuItem: React.FC<MenuItemProps>;
export default Menu;
