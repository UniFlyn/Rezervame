import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownToLine,
  Building,
  Calendar,
  CreditCard,
  Headphones,
  Layers,
  LayoutDashboard,
  List,
  Settings,
  Star,
  UserSquare,
  Users,
} from 'lucide-react';

const PANEL_NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  Layers,
  UserSquare,
  Users,
  Star,
  CreditCard,
  ArrowDownToLine,
  Building,
  Settings,
  Headphones,
  List,
};

export function panelNavIcon(name: string): LucideIcon {
  return PANEL_NAV_ICONS[name] ?? LayoutDashboard;
}
