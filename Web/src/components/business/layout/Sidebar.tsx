'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useBusinessStore } from '../../../store/businessStore';
import { apiGet } from '@/lib/api';
import type { PanelMenuPayload } from '@/lib/business-panel-types';
import { panelNavIcon } from '@/lib/panelNavIcons';

/** Fallback if menu API is unreachable (offline). Must match Backend `MERCHANT_NAV_ITEMS` in `business-panel.service.ts`. */
const FALLBACK_MENU: PanelMenuPayload['items'] = [
  { id: 'dashboard', href: '/business/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'appointments', href: '/business/appointments', label: 'Appointments', icon: 'Calendar' },
  { id: 'bookings', href: '/business/bookings', label: 'Bookings', icon: 'List' },
  { id: 'services', href: '/business/services', label: 'Services', icon: 'Layers' },
  { id: 'staff', href: '/business/staff', label: 'Staff', icon: 'UserSquare' },
  { id: 'users', href: '/business/users', label: 'Customers', icon: 'Users' },
  { id: 'reviews', href: '/business/reviews', label: 'Ratings & Reviews', icon: 'Star' },
  { id: 'transactions', href: '/business/transactions', label: 'Transactions', icon: 'CreditCard' },
  { id: 'withdrawals', href: '/business/withdrawals', label: 'Withdrawals', icon: 'ArrowDownToLine' },
  { id: 'profile', href: '/business/profile', label: 'Business Profile', icon: 'Building' },
  { id: 'settings', href: '/business/settings', label: 'Settings', icon: 'Settings' },
  { id: 'support', href: '/business/support', label: 'Support', icon: 'Headphones' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const business = useBusinessStore((state) => state.business);
  const logout = useBusinessStore((state) => state.logout);

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('business_token');

  const { data: menuPayload } = useQuery({
    queryKey: ['business-panel-menu', business?.id],
    enabled: Boolean(business?.id && hasToken),
    queryFn: () =>
      apiGet<PanelMenuPayload>(`/business/${business!.id}/panel/menu`, 'BUSINESS'),
  });

  const menuItems = menuPayload?.items?.length ? menuPayload.items : FALLBACK_MENU;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="w-64 bg-slate-900 h-screen text-white flex flex-col fixed left-0 top-0">
      <div className="px-6 py-8 border-b border-slate-800 flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Logo" className="w-32 h-auto object-contain brightness-0 invert" />
        <div className="text-center px-4">
          <p className="text-sm font-black tracking-tighter uppercase text-white leading-tight break-words">
            {business?.name || 'BUSINESS PANEL'}
          </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto pt-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = panelNavIcon(item.icon);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center px-6 py-3 text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-800/50',
                    pathname.startsWith(item.href) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all hover:bg-primary/5 rounded-2xl group"
        >
          <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
          Logout
        </button>
      </div>
    </aside>
  );
}
