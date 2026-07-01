import * as React from 'react';
export interface HeaderUser { name: string; avatar?: string; reservations?: number; email?: string; }
export interface HeaderNotification { icon?: string; title: string; time?: string; unread?: boolean; onClick?: () => void; }
export interface HeaderMenuItem { label: string; icon?: string; onClick?: () => void; danger?: boolean; divider?: boolean; badge?: number | string; }
export interface HeaderProps {
  /** "business" (default): full header w/ business info + user. "home": logo · search · Iniciar sesión. */
  variant?: 'business' | 'home';
  logoSrc?: string;
  showSearch?: boolean;
  /** Business name (business variant), centered between search and the right group. */
  contextTitle?: string;
  /** Category / subtitle under the business name. */
  contextSubtitle?: string;
  user?: HeaderUser;
  notifications?: boolean;
  /** Business variant: heart click handler (e.g. open favourites). */
  onFavorites?: () => void;
  /** Business variant: bell click handler when no `notificationItems` panel is supplied. */
  onNotifications?: () => void;
  /** Business variant: pass to render a notifications dropdown anchored to the bell. Unread items drive the badge count. */
  notificationItems?: HeaderNotification[];
  /** Business variant: "Ver todas" footer action in the notifications panel. */
  onSeeAllNotifications?: () => void;
  /** Business variant: pass to turn the user cluster into an account-menu trigger (chevron + dropdown). */
  accountMenu?: HeaderMenuItem[];
  /** Home variant: login button label + handler. */
  loginLabel?: string;
  onLogin?: () => void;
  joinLabel?: string;
  onJoinBusiness?: () => void;
  onLogoClick?: () => void;
  /** Pin the header to the top of the viewport; gains a soft shadow and compacts on scroll. */
  sticky?: boolean;
  style?: React.CSSProperties;
}
/**
 * Global customer header — "business" (logo·search·business info·notifications·
 * favourites·user) and "home" (logo·search·Iniciar sesión) variants.
 * @startingPoint section="Navigation" subtitle="Customer top navigation" viewport="1280x84"
 */
export declare const Header: React.FC<HeaderProps>;
export default Header;
