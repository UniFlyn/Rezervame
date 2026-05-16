"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  ArrowDownCircle, 
  Bell, 
  ShieldCheck, 
  Settings, 
  FileText,
  LogOut,
  Tags,
  Sparkles,
  Tag,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils'; // I'll create this helper if it doesn't exist

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Businesses', icon: Store, href: '/admin/businesses' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Bookings', icon: CalendarCheck, href: '/admin/bookings' },
  { name: 'Events', icon: CalendarDays, href: '/admin/events' },
  { name: 'Promotions', icon: Tag, href: '/admin/promotions' },
  { name: 'Transactions', icon: CreditCard, href: '/admin/transactions' },
  { name: 'Withdrawals', icon: ArrowDownCircle, href: '/admin/withdrawals' },
  { name: 'Notifications', icon: Bell, href: '/admin/notifications' },
  { name: 'Subscriptions', icon: ShieldCheck, href: '/admin/subscriptions' },
  { name: 'Categories', icon: Tags, href: '/admin/categories' },
  { name: 'Amenities', icon: Sparkles, href: '/admin/amenities' },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
  { name: 'Logs', icon: FileText, href: '/admin/logs' },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h2 className="text-white text-2xl font-bold tracking-tight">Rezervame</h2>
        <p className="text-slate-500 text-xs mt-1">Super Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={logout} className="flex items-center space-x-3 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group">
          <LogOut className="w-5 h-5 group-hover:text-white" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 ml-64">
      <div className="flex items-center space-x-4">
        <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 uppercase tracking-wider">
          System: Online
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <Link href="/admin/notifications" className="relative text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-black">3</span>
        </Link>
        
        <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">John Brito</p>
            <p className="text-[10px] text-slate-500 font-medium">Super Admin</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
            JB
          </div>
        </div>
      </div>
    </header>
  );
}
