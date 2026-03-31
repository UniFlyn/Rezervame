'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  UserSquare,
  CreditCard,
  Building,
  Settings,
  ArrowDownToLine,
  LogOut,
  Star
} from 'lucide-react';
import clsx from 'clsx';
import { useBusinessStore } from '../../../store/businessStore';

const menuItems = [
  { href: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/business/appointments', label: 'Appointments', icon: Calendar },
  { href: '/business/services', label: 'Services', icon: Layers },
  { href: '/business/staff', label: 'Staff', icon: UserSquare },
  { href: '/business/users', label: 'Customers', icon: Users },
  { href: '/business/reviews', label: 'Ratings & Reviews', icon: Star },
  { href: '/business/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/business/withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
  { href: '/business/profile', label: 'Business Profile', icon: Building },
  { href: '/business/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const business = useBusinessStore((state) => state.business);
  const logout = useBusinessStore((state) => state.logout);

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
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'flex items-center px-6 py-3 text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-800/50',
                  pathname.startsWith(item.href) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
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
